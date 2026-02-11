import { getCurrentUser } from "@/lib/auth"
import { listCurrentUserChatSessions } from "@/services/agent-chat-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const sessions = await listCurrentUserChatSessions(user.id)

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to list chat sessions", details: String(error) }, { status: 500 })
  }
}
