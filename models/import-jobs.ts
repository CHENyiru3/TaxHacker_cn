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

export const IMPORT_JOB_RUN_STATUS = {
  running: "running",
  completed: "completed",
  failed: "failed",
} as const

export type ImportJobRunStatus = (typeof IMPORT_JOB_RUN_STATUS)[keyof typeof IMPORT_JOB_RUN_STATUS]

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

export async function createImportJobRun(input: { importJobId: string; userId: string; organizationId: string }) {
  const latestRun = await prisma.importJobRun.findFirst({
    where: {
      importJobId: input.importJobId,
    },
    orderBy: {
      attempt: "desc",
    },
    select: {
      attempt: true,
    },
  })

  return await prisma.importJobRun.create({
    data: {
      importJobId: input.importJobId,
      userId: input.userId,
      organizationId: input.organizationId,
      attempt: (latestRun?.attempt ?? 0) + 1,
      status: IMPORT_JOB_RUN_STATUS.running,
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

export async function resetImportJobToPending(jobId: string, userId: string, organizationId: string) {
  return await prisma.importJob.updateMany({
    where: {
      id: jobId,
      userId,
      organizationId,
    },
    data: {
      status: IMPORT_JOB_STATUS.pending,
      startedAt: null,
      finishedAt: null,
      error: null,
      result: Prisma.DbNull,
    },
  })
}

export async function markImportJobRunCompleted(jobRunId: string, result?: Prisma.InputJsonValue) {
  return await prisma.importJobRun.update({
    where: { id: jobRunId },
    data: {
      status: IMPORT_JOB_RUN_STATUS.completed,
      result,
      error: null,
      finishedAt: new Date(),
    },
  })
}

export async function markImportJobRunFailed(jobRunId: string, error: string, result?: Prisma.InputJsonValue) {
  return await prisma.importJobRun.update({
    where: { id: jobRunId },
    data: {
      status: IMPORT_JOB_RUN_STATUS.failed,
      error,
      result,
      finishedAt: new Date(),
    },
  })
}

export async function createImportJobArtifact(input: {
  importJobId: string
  importJobRunId?: string
  organizationId: string
  userId: string
  kind: string
  name: string
  payload?: Prisma.InputJsonValue
}) {
  return await prisma.importJobArtifact.create({
    data: {
      importJobId: input.importJobId,
      importJobRunId: input.importJobRunId,
      organizationId: input.organizationId,
      userId: input.userId,
      kind: input.kind,
      name: input.name,
      payload: input.payload,
    },
  })
}

export async function getImportJobById(jobId: string, userId: string, organizationId?: string) {
  return await prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId,
      organizationId,
    },
    include: {
      jobRuns: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
      artifacts: {
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      },
      dataSource: true,
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
      jobRuns: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
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
