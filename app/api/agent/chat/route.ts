import { getCurrentUser } from "@/lib/auth"
import { chatWithAgent } from "@/services/agent-chat-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const payload = (await request.json()) as {
      message?: string
      sessionId?: string
    }

    if (!payload.message || payload.message.trim() === "") {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    const result = await chatWithAgent({
      userId: user.id,
      message: payload.message,
      sessionId: payload.sessionId,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process agent chat", details: String(error) }, { status: 500 })
  }
}
