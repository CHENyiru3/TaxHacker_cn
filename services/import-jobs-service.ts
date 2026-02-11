import { getCurrentMembership } from "@/lib/organization"
import { EXPORT_AND_IMPORT_FIELD_MAP } from "@/models/export_and_import"
import {
  createDataSourceForCsvImport,
  createImportJob,
  createImportJobArtifact,
  createImportJobRun,
  getImportJobById,
  getImportJobSummaryByOrganization,
  getImportJobsByOrganization,
  getNextPendingCsvImportJob,
  IMPORT_JOB_STATUS,
  IMPORT_JOB_TYPE,
  markImportJobCompleted,
  markImportJobFailed,
  markImportJobRunCompleted,
  markImportJobRunFailed,
  markImportJobRunning,
  resetImportJobToPending,
} from "@/models/import-jobs"
import { createTransaction } from "@/models/transactions"
import { Prisma } from "@/prisma/client"

export async function listImportJobsForCurrentOrganization(limit: number = 30) {
  const membership = await getCurrentMembership()
  return await getImportJobsByOrganization(membership.organizationId, limit)
}

export async function getImportJobSummaryForCurrentOrganization() {
  const membership = await getCurrentMembership()
  return await getImportJobSummaryByOrganization(membership.organizationId)
}

export async function getImportJobForCurrentUser(jobId: string, userId: string) {
  const membership = await getCurrentMembership()
  return await getImportJobById(jobId, userId, membership.organizationId)
}

export async function createImportJobForCurrentOrganization(input: {
  userId: string
  type?: string
  dataSourceId?: string
  payload?: Prisma.InputJsonValue
}) {
  const membership = await getCurrentMembership()
  const normalizedType = input.type || IMPORT_JOB_TYPE.csvTransactions

  return await createImportJob({
    userId: input.userId,
    organizationId: membership.organizationId,
    dataSourceId: input.dataSourceId,
    type: normalizedType as (typeof IMPORT_JOB_TYPE)[keyof typeof IMPORT_JOB_TYPE],
    input: input.payload,
  })
}

export async function createCsvImportJobContext(userId: string, totalRows: number) {
  const membership = await getCurrentMembership()

  const dataSource = await createDataSourceForCsvImport(userId, membership.organizationId)
  const importJob = await createImportJob({
    userId,
    organizationId: membership.organizationId,
    dataSourceId: dataSource.id,
    type: IMPORT_JOB_TYPE.csvTransactions,
    input: { totalRows },
  })

  return {
    organizationId: membership.organizationId,
    dataSource,
    importJob,
  }
}

export async function retryImportJobForCurrentUser(jobId: string, userId: string) {
  const membership = await getCurrentMembership()
  const job = await getImportJobById(jobId, userId, membership.organizationId)

  if (!job) {
    throw new Error("Import job not found")
  }

  if (job.status !== IMPORT_JOB_STATUS.failed) {
    throw new Error("Only failed import jobs can be retried")
  }

  const updated = await resetImportJobToPending(job.id, userId, membership.organizationId)

  if (updated.count === 0) {
    throw new Error("Failed to update import job status")
  }

  await createImportJobArtifact({
    importJobId: job.id,
    organizationId: membership.organizationId,
    userId,
    kind: "retry-request",
    name: "手动重试请求",
    payload: {
      previousStatus: job.status,
      requestedAt: new Date().toISOString(),
    },
  })

  return await getImportJobById(job.id, userId, membership.organizationId)
}

export async function processCsvRowsForImportJob(input: {
  importJobId: string
  userId: string
  organizationId: string
  rows: Record<string, unknown>[]
}) {
  const run = await createImportJobRun({
    importJobId: input.importJobId,
    userId: input.userId,
    organizationId: input.organizationId,
  })

  await markImportJobRunning(input.importJobId)

  let importedCount = 0

  try {
    for (const row of input.rows) {
      const transactionData: Record<string, unknown> = {}
      for (const [fieldCode, value] of Object.entries(row)) {
        const fieldDef = EXPORT_AND_IMPORT_FIELD_MAP[fieldCode]
        if (fieldDef?.import) {
          transactionData[fieldCode] = await fieldDef.import(input.userId, value as string)
        } else {
          transactionData[fieldCode] = value as string
        }
      }

      await createTransaction(input.userId, transactionData)
      importedCount += 1
    }

    const result = {
      importedCount,
      failedCount: input.rows.length - importedCount,
    }

    await markImportJobCompleted(input.importJobId, result)
    await markImportJobRunCompleted(run.id, result)

    await createImportJobArtifact({
      importJobId: input.importJobId,
      importJobRunId: run.id,
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "summary",
      name: "CSV 导入摘要",
      payload: result,
    })

    return {
      success: true,
      runId: run.id,
      result,
    }
  } catch (error) {
    const message = String(error)

    await markImportJobFailed(input.importJobId, message)
    await markImportJobRunFailed(run.id, message)

    await createImportJobArtifact({
      importJobId: input.importJobId,
      importJobRunId: run.id,
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "error",
      name: "CSV 导入失败日志",
      payload: {
        error: message,
      },
    })

    return {
      success: false,
      runId: run.id,
      error: message,
    }
  }
}

export async function processNextPendingImportJob() {
  const job = await getNextPendingCsvImportJob()
  if (!job) {
    return { processed: false, reason: "No pending job" }
  }

  const inputArtifact = job.artifacts[0]
  const payload = (inputArtifact?.payload || {}) as { rows?: Record<string, unknown>[] }

  if (!payload.rows || payload.rows.length === 0) {
    await markImportJobFailed(job.id, "Missing input rows artifact for processing")
    await createImportJobArtifact({
      importJobId: job.id,
      organizationId: job.organizationId,
      userId: job.userId,
      kind: "error",
      name: "缺少输入数据",
      payload: {
        message: "No input rows artifact found",
      },
    })

    return { processed: false, reason: "Missing input rows" }
  }

  const result = await processCsvRowsForImportJob({
    importJobId: job.id,
    userId: job.userId,
    organizationId: job.organizationId,
    rows: payload.rows,
  })

  return {
    processed: true,
    jobId: job.id,
    result,
  }
}

export async function startImportJobRun(input: { importJobId: string; userId: string; organizationId: string }) {
  return await createImportJobRun(input)
}

export async function markImportJobAsRunning(jobId: string) {
  return await markImportJobRunning(jobId)
}

export async function markImportJobAsCompleted(jobId: string, result?: Prisma.InputJsonValue) {
  return await markImportJobCompleted(jobId, result)
}

export async function markImportJobAsFailed(jobId: string, error: string, result?: Prisma.InputJsonValue) {
  return await markImportJobFailed(jobId, error, result)
}

export async function markImportJobRunAsCompleted(jobRunId: string, result?: Prisma.InputJsonValue) {
  return await markImportJobRunCompleted(jobRunId, result)
}

export async function markImportJobRunAsFailed(jobRunId: string, error: string, result?: Prisma.InputJsonValue) {
  return await markImportJobRunFailed(jobRunId, error, result)
}

export async function createImportArtifact(input: {
  importJobId: string
  importJobRunId?: string
  organizationId: string
  userId: string
  kind: string
  name: string
  payload?: Prisma.InputJsonValue
}) {
  return await createImportJobArtifact(input)
}
