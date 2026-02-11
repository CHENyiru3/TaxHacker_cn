import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"

export async function createChatSession(input: { organizationId: string; userId: string; title?: string }) {
  return await prisma.chatSession.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
    },
  })
}

export async function appendChatMessage(input: {
  chatSessionId: string
  organizationId: string
  userId: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Prisma.InputJsonValue
}) {
  return await prisma.chatMessage.create({
    data: {
      chatSessionId: input.chatSessionId,
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      content: input.content,
      metadata: input.metadata,
    },
  })
}

export async function getChatSessionById(sessionId: string, userId: string, organizationId: string) {
  return await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId,
      organizationId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })
}

export async function listChatSessions(userId: string, organizationId: string, limit: number = 20) {
  return await prisma.chatSession.findMany({
    where: {
      userId,
      organizationId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  })
}
