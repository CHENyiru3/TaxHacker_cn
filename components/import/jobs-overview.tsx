import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
type ImportJobWithDataSource = {
  id: string
  type: string
  status: string
  error: string | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  dataSource: {
    name: string
    type: string
  } | null
  jobRuns: {
    id: string
    attempt: number
    status: string
  }[]
}

const STATUS_META: Record<
  string,
  { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "排队中", badgeVariant: "outline" },
  running: { label: "执行中", badgeVariant: "secondary" },
  completed: { label: "已完成", badgeVariant: "default" },
  failed: { label: "失败", badgeVariant: "destructive" },
}

function formatDateTime(value: Date | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

function getSuccessRate(completed: number, failed: number) {
  const total = completed + failed
  if (total === 0) return 0

  return Math.round((completed / total) * 100)
}

export function ImportJobsOverview({
  jobs,
  summary,
}: {
  jobs: ImportJobWithDataSource[]
  summary: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    latestCompletedAt: Date | null
  }
}) {
  const successRate = getSuccessRate(summary.completed, summary.failed)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>导入任务总数</CardDescription>
            <CardTitle className="text-2xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">最近一次完成：{formatDateTime(summary.latestCompletedAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>执行中与排队</CardDescription>
            <CardTitle className="text-2xl">{summary.running + summary.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              执行中 {summary.running} / 排队中 {summary.pending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>成功率</CardDescription>
            <CardTitle className="text-2xl">{successRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${successRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>失败任务</CardDescription>
            <CardTitle className="text-2xl">{summary.failed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">建议优先处理失败原因并重试导入。</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近导入任务</CardTitle>
          <CardDescription>按组织维度展示最近 30 条任务，便于追踪进度与异常。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3">任务类型</th>
                  <th className="px-4 py-3">数据源</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">最近执行</th>
                  <th className="px-4 py-3">创建时间</th>
                  <th className="px-4 py-3">开始时间</th>
                  <th className="px-4 py-3">完成时间</th>
                  <th className="px-4 py-3">结果</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>
                      暂无导入任务，前往「CSV 导入」开始第一批数据导入。
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const statusMeta = STATUS_META[job.status] ?? {
                      label: job.status,
                      badgeVariant: "outline" as const,
                    }

                    return (
                      <tr key={job.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <Link href={`/import/jobs/${job.id}`} className="font-medium hover:underline">
                            {job.type}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{job.dataSource?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {job.jobRuns[0] ? `第 ${job.jobRuns[0].attempt} 次（${job.jobRuns[0].status}）` : "-"}
                        </td>
                        <td className="px-4 py-3">{formatDateTime(job.createdAt)}</td>
                        <td className="px-4 py-3">{formatDateTime(job.startedAt)}</td>
                        <td className="px-4 py-3">{formatDateTime(job.finishedAt)}</td>
                        <td className="px-4 py-3 max-w-[280px] truncate" title={job.error ?? "成功"}>
                          {job.error ?? "成功"}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/import/jobs/${job.id}`} className="text-primary hover:underline">
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
