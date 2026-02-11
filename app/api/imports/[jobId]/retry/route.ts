import { getCurrentUser } from "@/lib/auth"
import { retryImportJobForCurrentUser } from "@/services/import-jobs-service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await getCurrentUser()
    const { jobId } = await params

    const job = await retryImportJobForCurrentUser(jobId, user.id)

    return NextResponse.json({ job })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to retry import job",
        details: String(error),
      },
      { status: 400 }
    )
  }
}
