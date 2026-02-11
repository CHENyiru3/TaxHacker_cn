"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type ArtifactPayload = {
  code?: string
  error?: string
  retriable?: boolean
  hint?: string
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
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

export function ImportJobDetailPanel({
  job,
}: {
  job: {
    id: string
    type: string
    status: string
    error: string | null
    createdAt: Date | string
    startedAt: Date | string | null
    finishedAt: Date | string | null
    dataSource: { name: string; type: string } | null
    jobRuns: Array<{
      id: string
      attempt: number
      status: string
      startedAt: Date | string
      finishedAt: Date | string | null
      error: string | null
    }>
    artifacts: Array<{
      id: string
      kind: string
      name: string
      createdAt: Date | string
      payload: unknown
    }>
  }
}) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canRetry = job.status === "failed"
  const statusMeta = STATUS_META[job.status] ?? { label: job.status, badgeVariant: "outline" as const }

  const latestErrorPayload = useMemo(() => {
    const artifact = job.artifacts.find((item) => item.kind === "error")
    if (!artifact) return null
    const payload = (artifact.payload ?? {}) as ArtifactPayload
    return {
      code: payload.code,
      hint: payload.hint,
      retriable: payload.retriable,
    }
  }, [job.artifacts])

  const onRetry = async () => {
    try {
      setIsRetrying(true)
      setNotice(null)

      const res = await fetch(`/api/imports/${job.id}/retry`, {
        method: "POST",
      })

      const payload = (await res.json().catch(() => ({}))) as { error?: string; details?: string }

      if (!res.ok) {
        setNotice(payload.error || payload.details || "重试请求失败")
        return
      }

      setNotice("已提交重试请求，任务状态已重置为排队中。")
      router.refresh()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>任务概览</CardTitle>
            <CardDescription>查看单个导入任务状态、执行历史与错误分类建议。</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
            <Button onClick={onRetry} disabled={!canRetry || isRetrying}>
              {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              重试任务
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <p>任务类型：{job.type}</p>
          <p>数据源：{job.dataSource?.name ?? "-"}</p>
          <p>创建时间：{formatDateTime(job.createdAt)}</p>
          <p>开始时间：{formatDateTime(job.startedAt)}</p>
          <p>完成时间：{formatDateTime(job.finishedAt)}</p>
          <p title={job.error || "成功"}>结果：{job.error || "成功"}</p>
          {latestErrorPayload?.code ? <p>错误代码：{latestErrorPayload.code}</p> : null}
          {typeof latestErrorPayload?.retriable === "boolean" ? (
            <p>是否可重试：{latestErrorPayload.retriable ? "是" : "否"}</p>
          ) : null}
          {latestErrorPayload?.hint ? <p className="md:col-span-2">排查建议：{latestErrorPayload.hint}</p> : null}
        </CardContent>
      </Card>

      {notice ? (
        <p className={`rounded-md border p-3 text-sm ${canRetry ? "text-muted-foreground" : "text-destructive"}`}>
          {notice}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>执行历史（Runs）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3">尝试次数</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">开始时间</th>
                  <th className="px-4 py-3">结束时间</th>
                  <th className="px-4 py-3">错误</th>
                </tr>
              </thead>
              <tbody>
                {job.jobRuns.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                      暂无执行记录
                    </td>
                  </tr>
                ) : (
                  job.jobRuns.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="px-4 py-3">第 {run.attempt} 次</td>
                      <td className="px-4 py-3">{run.status}</td>
                      <td className="px-4 py-3">{formatDateTime(run.startedAt)}</td>
                      <td className="px-4 py-3">{formatDateTime(run.finishedAt)}</td>
                      <td className="px-4 py-3" title={run.error || "-"}>
                        {run.error || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>执行工件（Artifacts）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">时间</th>
                  <th className="px-4 py-3">载荷</th>
                </tr>
              </thead>
              <tbody>
                {job.artifacts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                      暂无工件
                    </td>
                  </tr>
                ) : (
                  job.artifacts.map((artifact) => (
                    <tr key={artifact.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{artifact.kind}</td>
                      <td className="px-4 py-3">{artifact.name}</td>
                      <td className="px-4 py-3">{formatDateTime(artifact.createdAt)}</td>
                      <td className="max-w-[520px] px-4 py-3">
                        <pre className="line-clamp-3 overflow-hidden whitespace-pre-wrap text-xs text-muted-foreground">
                          {JSON.stringify(artifact.payload ?? {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
