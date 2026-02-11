import { requestLLM } from "@/ai/providers/llmProvider"
import { getCurrentMembership } from "@/lib/organization"
import { appendChatMessage, createChatSession, getChatSessionById, listChatSessions } from "@/models/agent-chat"
import { getImportJobSummaryByOrganization } from "@/models/import-jobs"
import { getLLMSettings, getSettings } from "@/models/settings"

function buildAgentPrompt(input: {
  message: string
  summary: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    latestCompletedAt: Date | null
  }
}) {
  const lines = [
    "你是财税咨询智能体助手。请使用专业、清晰、中文优先的方式回答。",
    "如果信息不足，请明确说明需要补充哪些材料。",
    `当前导入任务汇总：总数=${input.summary.total}，排队=${input.summary.pending}，执行中=${input.summary.running}，完成=${input.summary.completed}，失败=${input.summary.failed}。`,
    `最近完成时间：${input.summary.latestCompletedAt ? input.summary.latestCompletedAt.toISOString() : "无"}`,
    `用户问题：${input.message}`,
  ]

  return lines.join("\n")
}

export async function listCurrentUserChatSessions(userId: string) {
  const membership = await getCurrentMembership()
  return await listChatSessions(userId, membership.organizationId)
}

export async function chatWithAgent(input: { userId: string; message: string; sessionId?: string }) {
  const membership = await getCurrentMembership()
  const summary = await getImportJobSummaryByOrganization(membership.organizationId)

  let sessionId = input.sessionId

  if (sessionId) {
    const existing = await getChatSessionById(sessionId, input.userId, membership.organizationId)
    if (!existing) {
      sessionId = undefined
    }
  }

  if (!sessionId) {
    const created = await createChatSession({
      organizationId: membership.organizationId,
      userId: input.userId,
      title: input.message.slice(0, 40),
    })
    sessionId = created.id
  }

  await appendChatMessage({
    chatSessionId: sessionId,
    organizationId: membership.organizationId,
    userId: input.userId,
    role: "user",
    content: input.message,
  })

  const settings = await getSettings(input.userId)
  const llmSettings = getLLMSettings(settings)

  const llmResponse = await requestLLM(llmSettings, {
    prompt: buildAgentPrompt({ message: input.message, summary }),
    schema: {
      answer: "string",
      nextActions: "string",
      riskLevel: "string",
    },
  })

  const answer = llmResponse.error
    ? `当前无法调用模型：${llmResponse.error}。建议先检查模型配置或稍后重试。`
    : String((llmResponse.output as Record<string, unknown>).answer || "暂时无法生成回答。")

  await appendChatMessage({
    chatSessionId: sessionId,
    organizationId: membership.organizationId,
    userId: input.userId,
    role: "assistant",
    content: answer,
    metadata: llmResponse.error
      ? { error: llmResponse.error }
      : {
          provider: llmResponse.provider,
          raw: llmResponse.output,
        },
  })

  const fullSession = await getChatSessionById(sessionId, input.userId, membership.organizationId)

  return {
    session: fullSession,
    summary,
  }
}
