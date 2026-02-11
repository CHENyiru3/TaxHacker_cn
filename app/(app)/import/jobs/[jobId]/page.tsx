import { ImportJobDetailPanel } from "@/components/import/job-detail-panel"
import { getCurrentUser } from "@/lib/auth"
import { getImportJobForCurrentUser } from "@/services/import-jobs-service"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ImportJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser()
  const { jobId } = await params
  const job = await getImportJobForCurrentUser(jobId, user.id)

  if (!job) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <Link href="/import/jobs" className="text-sm text-muted-foreground hover:underline">
          ← 返回导入任务中心
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">导入任务详情</h1>
      </div>
      <ImportJobDetailPanel job={job} />
    </div>
  )
}
