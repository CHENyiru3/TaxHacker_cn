import { getCurrentUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/prisma/client"
import {
  createImportJobForCurrentOrganization,
  listImportJobsForCurrentOrganization,
} from "@/services/import-jobs-service"

export async function GET() {
  try {
    await getCurrentUser()
    const jobs = await listImportJobsForCurrentOrganization(30)

    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load import jobs", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const payload = (await request.json().catch(() => ({}))) as {
      type?: string
      input?: Record<string, unknown>
      dataSourceId?: string
    }

    const job = await createImportJobForCurrentOrganization({
      userId: user.id,
      type: payload.type,
      dataSourceId: payload.dataSourceId,
      payload: payload.input as Prisma.InputJsonValue | undefined,
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create import job", details: String(error) }, { status: 500 })
  }
}
