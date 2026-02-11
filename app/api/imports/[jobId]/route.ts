import { getCurrentUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { getImportJobForCurrentUser } from "@/services/import-jobs-service"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser()
  const { jobId } = await params

  const job = await getImportJobForCurrentUser(jobId, user.id)

  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  return NextResponse.json({ job })
}
