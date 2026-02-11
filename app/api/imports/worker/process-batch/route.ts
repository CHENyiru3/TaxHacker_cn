import { processPendingImportJobsBatch } from "@/services/import-jobs-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-worker-token")
    const expectedToken = process.env.IMPORT_WORKER_TOKEN

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized worker request" }, { status: 401 })
    }

    const payload = (await request.json().catch(() => ({}))) as { maxJobs?: number }
    const result = await processPendingImportJobsBatch(payload.maxJobs ?? 5)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process pending import jobs batch", details: String(error) },
      { status: 500 }
    )
  }
}
