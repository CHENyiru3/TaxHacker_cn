"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import {
  createCsvImportJobContext,
  createImportArtifact,
  processCsvRowsForImportJob,
} from "@/services/import-jobs-service"
import { Prisma, Transaction } from "@/prisma/client"
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

  try {
    const rows = JSON.parse(formData.get("rows") as string) as Record<string, unknown>[]

    const context = await createCsvImportJobContext(user.id, rows.length)

    await createImportArtifact({
      importJobId: context.importJob.id,
      organizationId: context.organizationId,
      userId: user.id,
      kind: "input-rows",
      name: "CSV 输入行",
      payload: {
        rows: rows as Prisma.InputJsonValue,
      },
    })

    const result = await processCsvRowsForImportJob({
      importJobId: context.importJob.id,
      organizationId: context.organizationId,
      userId: user.id,
      rows,
    })

    revalidatePath("/import/csv")
    revalidatePath("/import/jobs")
    revalidatePath("/transactions")

    if (!result.success) {
      return { success: false, error: "保存交易失败：" + result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error saving transactions:", error)
    return { success: false, error: "保存交易失败：" + error }
  }
}
