import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"

export const IMPORT_JOB_STATUS = {
  pending: "pending",
  running: "running",
  completed: "completed",
  failed: "failed",
} as const

export type ImportJobStatus = (typeof IMPORT_JOB_STATUS)[keyof typeof IMPORT_JOB_STATUS]

export const IMPORT_JOB_TYPE = {
  csvTransactions: "csv-transactions",
} as const

export type ImportJobType = (typeof IMPORT_JOB_TYPE)[keyof typeof IMPORT_JOB_TYPE]

export async function createDataSourceForCsvImport(userId: string, organizationId: string) {
  return await prisma.dataSource.upsert({
    where: {
      organizationId_code: {
        organizationId,
        code: "csv-import",
      },
    },
    create: {
      userId,
      organizationId,
      code: "csv-import",
      type: "csv",
      name: "CSV Import",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  })
}

export async function createImportJob(input: {
  userId: string
  organizationId: string
  dataSourceId?: string
  type: ImportJobType
  input?: Prisma.InputJsonValue
}) {
  return await prisma.importJob.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      type: input.type,
      status: IMPORT_JOB_STATUS.pending,
      input: input.input,
    },
  })
}

export async function markImportJobRunning(jobId: string) {
  return await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: IMPORT_JOB_STATUS.running,
      startedAt: new Date(),
      error: null,
    },
  })
}

export async function markImportJobCompleted(jobId: string, result?: Prisma.InputJsonValue) {
  return await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: IMPORT_JOB_STATUS.completed,
      result,
      finishedAt: new Date(),
      error: null,
    },
  })
}

export async function markImportJobFailed(jobId: string, error: string, result?: Prisma.InputJsonValue) {
  return await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: IMPORT_JOB_STATUS.failed,
      error,
      result,
      finishedAt: new Date(),
    },
  })
}

export async function getImportJobById(jobId: string, userId: string) {
  return await prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
  })
}

export async function getImportJobsByOrganization(organizationId: string, limit: number = 30) {
  return await prisma.importJob.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      dataSource: true,
    },
  })
}

export async function getImportJobSummaryByOrganization(organizationId: string) {
  const [total, pending, running, completed, failed] = await Promise.all([
    prisma.importJob.count({ where: { organizationId } }),
    prisma.importJob.count({ where: { organizationId, status: IMPORT_JOB_STATUS.pending } }),
    prisma.importJob.count({ where: { organizationId, status: IMPORT_JOB_STATUS.running } }),
    prisma.importJob.count({ where: { organizationId, status: IMPORT_JOB_STATUS.completed } }),
    prisma.importJob.count({ where: { organizationId, status: IMPORT_JOB_STATUS.failed } }),
  ])

  const latestCompletedJob = await prisma.importJob.findFirst({
    where: {
      organizationId,
      status: IMPORT_JOB_STATUS.completed,
      finishedAt: {
        not: null,
      },
    },
    orderBy: {
      finishedAt: "desc",
    },
    select: {
      finishedAt: true,
    },
  })

  return {
    total,
    pending,
    running,
    completed,
    failed,
    latestCompletedAt: latestCompletedJob?.finishedAt ?? null,
  }
}
