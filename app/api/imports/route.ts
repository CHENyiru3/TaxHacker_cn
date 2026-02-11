import { getCurrentUser } from "@/lib/auth"
import { getCurrentMembership } from "@/lib/organization"
import { createImportJob, getImportJobsByOrganization, IMPORT_JOB_TYPE } from "@/models/import-jobs"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/prisma/client"

export async function GET() {
  try {
    await getCurrentUser()
    const membership = await getCurrentMembership()
    const jobs = await getImportJobsByOrganization(membership.organizationId, 30)

    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load import jobs", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const membership = await getCurrentMembership()
    const payload = (await request.json().catch(() => ({}))) as {
      type?: string
      input?: Record<string, unknown>
      dataSourceId?: string
    }

    const type = payload.type || IMPORT_JOB_TYPE.csvTransactions

    const job = await createImportJob({
      userId: user.id,
      organizationId: membership.organizationId,
      dataSourceId: payload.dataSourceId,
      type: type as (typeof IMPORT_JOB_TYPE)[keyof typeof IMPORT_JOB_TYPE],
      input: payload.input as Prisma.InputJsonValue | undefined,
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create import job", details: String(error) }, { status: 500 })
  }
}
