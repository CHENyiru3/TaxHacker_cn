import { processNextPendingImportJob } from "@/services/import-jobs-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const workerToken = process.env.IMPORT_WORKER_TOKEN
  const requestToken = request.headers.get("x-worker-token")

  if (!workerToken || requestToken !== workerToken) {
    return NextResponse.json({ error: "Unauthorized worker request" }, { status: 401 })
  }

  try {
    const result = await processNextPendingImportJob()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process pending import", details: String(error) }, { status: 500 })
  }
}
