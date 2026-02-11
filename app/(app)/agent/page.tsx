import { AgentWorkbench } from "@/components/agent/agent-workbench"

export default function AgentPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">财税智能体工作台</h1>
        <p className="text-sm text-muted-foreground">默认中文交互，支持会话追踪、上下文连续问答与专业回答。</p>
      </header>
      <AgentWorkbench />
    </section>
  )
}
