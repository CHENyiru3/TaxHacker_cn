import { ImportJobsOverview } from "@/components/import/jobs-overview"
import { getCurrentUser } from "@/lib/auth"
import { getCurrentMembership } from "@/lib/organization"
import { getImportJobSummaryByOrganization, getImportJobsByOrganization } from "@/models/import-jobs"

export default async function ImportJobsPage() {
  await getCurrentUser()
  const membership = await getCurrentMembership()

  const [jobs, summary] = await Promise.all([
    getImportJobsByOrganization(membership.organizationId, 30),
    getImportJobSummaryByOrganization(membership.organizationId),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">导入任务中心</h1>
        <p className="text-sm text-muted-foreground">
          提供组织级导入任务监控、自动化状态追踪与异常可视化，帮助分析师快速定位问题并持续交付。
        </p>
      </div>
      <ImportJobsOverview jobs={jobs} summary={summary} />
    </div>
  )
}
