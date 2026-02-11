import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"

export type CreateAuditLogInput = {
  organizationId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  metadata?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  })
}

export async function getAuditLogsByOrganization(organizationId: string, limit: number = 100) {
  return await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  })
}
