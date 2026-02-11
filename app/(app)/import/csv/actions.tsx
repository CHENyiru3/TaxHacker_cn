"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { EXPORT_AND_IMPORT_FIELD_MAP } from "@/models/export_and_import"
import {
  createCsvImportJobContext,
  createImportArtifact,
  markImportJobAsCompleted,
  markImportJobAsFailed,
  markImportJobAsRunning,
  markImportJobRunAsCompleted,
  markImportJobRunAsFailed,
  startImportJobRun,
} from "@/services/import-jobs-service"
import { createTransaction } from "@/models/transactions"
import { Transaction } from "@/prisma/client"
import { parse } from "@fast-csv/parse"
import { revalidatePath } from "next/cache"

export async function parseCSVAction(
  _prevState: ActionState<string[][]> | null,
  formData: FormData
): Promise<ActionState<string[][]>> {
  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "未上传文件" }
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "仅支持 CSV 文件" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const rows: string[][] = []

    const parser = parse()
      .on("data", (row) => rows.push(row))
      .on("error", (error) => {
        throw error
      })
    parser.write(buffer)
    parser.end()

    await new Promise((resolve) => parser.on("end", resolve))

    return { success: true, data: rows }
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return { success: false, error: "CSV 解析失败，请检查文件编码或分隔符" }
  }
}

export async function saveTransactionsAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  const user = await getCurrentUser()
  let importJobId: string | null = null
  let importJobRunId: string | null = null
  let organizationId: string | null = null

  try {
    const rows = JSON.parse(formData.get("rows") as string) as Record<string, unknown>[]

    const context = await createCsvImportJobContext(user.id, rows.length)
    importJobId = context.importJob.id
    organizationId = context.organizationId

    const run = await startImportJobRun({
      importJobId,
      userId: user.id,
      organizationId,
    })
    importJobRunId = run.id

    await markImportJobAsRunning(importJobId)

    let importedCount = 0

    for (const row of rows) {
      const transactionData: Record<string, unknown> = {}
      for (const [fieldCode, value] of Object.entries(row)) {
        const fieldDef = EXPORT_AND_IMPORT_FIELD_MAP[fieldCode]
        if (fieldDef?.import) {
          transactionData[fieldCode] = await fieldDef.import(user.id, value as string)
        } else {
          transactionData[fieldCode] = value as string
        }
      }

      await createTransaction(user.id, transactionData)
      importedCount += 1
    }

    const result = {
      importedCount,
      failedCount: rows.length - importedCount,
    }

    if (importJobId) {
      await markImportJobAsCompleted(importJobId, result)
    }

    if (importJobRunId) {
      await markImportJobRunAsCompleted(importJobRunId, result)
    }

    if (importJobId && organizationId) {
      await createImportArtifact({
        importJobId,
        importJobRunId: importJobRunId || undefined,
        organizationId,
        userId: user.id,
        kind: "summary",
        name: "CSV 导入摘要",
        payload: result,
      })
    }

    revalidatePath("/import/csv")
    revalidatePath("/import/jobs")
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Error saving transactions:", error)

    if (importJobId) {
      await markImportJobAsFailed(importJobId, String(error))
    }

    if (importJobRunId) {
      await markImportJobRunAsFailed(importJobRunId, String(error))
    }

    if (importJobId && organizationId) {
      await createImportArtifact({
        importJobId,
        importJobRunId: importJobRunId || undefined,
        organizationId,
        userId: user.id,
        kind: "error",
        name: "CSV 导入失败日志",
        payload: {
          error: String(error),
        },
      })
    }

    return { success: false, error: "保存交易失败：" + error }
  }
}
