import { parseAIChangeRequest, renderAIChangeRequestPrompt } from "@/lib/ai/change-request"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const normalized = parseAIChangeRequest(payload)
    const prompt = renderAIChangeRequestPrompt(normalized)

    return NextResponse.json({
      request: normalized,
      prompt,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid change request payload",
        details: String(error),
      },
      { status: 400 }
    )
  }
}
