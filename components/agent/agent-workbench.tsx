"use client"

import { useLocale } from "@/components/i18n/locale-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Loader2, Send } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type ChatMessage = {
  id: string
  role: "user" | "assistant" | string
  content: string
  createdAt: string
}

type ChatSession = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function AgentWorkbench() {
  const { t } = useLocale()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      const response = await fetch("/api/agent/sessions")
      const payload = (await response.json()) as { sessions?: ChatSession[]; error?: string }

      if (!response.ok) {
        setError(payload.error || "会话加载失败")
        return
      }

      const loaded = payload.sessions ?? []
      setSessions(loaded)
      if (loaded[0]) {
        setActiveSessionId(loaded[0].id)
      }
    }

    void loadSessions()
  }, [])

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions]
  )

  const onSubmit = async () => {
    const trimmed = message.trim()
    if (!trimmed || isSending) return

    setError(null)
    setIsSending(true)

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: activeSessionId || undefined,
        }),
      })

      const payload = (await response.json()) as {
        error?: string
        session?: ChatSession
      }

      if (!response.ok || !payload.session) {
        setError(payload.error || "智能体响应失败")
        return
      }

      const nextSession = payload.session
      setSessions((prev) => {
        const others = prev.filter((item) => item.id !== nextSession.id)
        return [nextSession, ...others]
      })
      setActiveSessionId(nextSession.id)
      setMessage("")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-[76vh]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            {t("agent", "sessionListTitle")}
          </CardTitle>
          <CardDescription>{t("agent", "sessionListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[62vh] space-y-2 overflow-y-auto pr-3">
            {sessions.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                {t("agent", "emptySessions")}
              </p>
            ) : (
              sessions.map((session) => {
                const active = session.id === activeSessionId
                return (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      active ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <p className="line-clamp-1 text-sm font-medium">{session.title || t("agent", "untitledSession")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(session.updatedAt)}</p>
                  </button>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-[76vh]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t("agent", "workbenchTitle")}</CardTitle>
              <CardDescription>{t("agent", "workbenchDescription")}</CardDescription>
            </div>
            <Badge variant="secondary">{t("agent", "beta")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex h-[calc(76vh-86px)] flex-col gap-4 py-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/20 p-4">
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                {t("agent", "emptyMessages")}
              </div>
            ) : (
              activeSession.messages.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    item.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "border bg-background text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  <p className="mt-2 text-[11px] opacity-75">{formatDateTime(item.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("agent", "inputPlaceholder")}
              className="min-h-[110px] resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={isSending || message.trim() === ""}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t("agent", "send")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
