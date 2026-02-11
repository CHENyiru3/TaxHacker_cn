import { z } from "zod"

export const ChangeTargetSchema = z.object({
  file: z.string().min(1, "file is required"),
  section: z.string().optional(),
  instruction: z.string().min(1, "instruction is required"),
})

export const AIChangeRequestSchema = z.object({
  goal: z.string().min(1, "goal is required"),
  targets: z.array(ChangeTargetSchema).min(1, "at least one target is required"),
  constraints: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
})

export type AIChangeRequest = z.infer<typeof AIChangeRequestSchema>

export function parseAIChangeRequest(input: unknown): AIChangeRequest {
  return AIChangeRequestSchema.parse(input)
}

export function renderAIChangeRequestPrompt(input: AIChangeRequest) {
  const targets = input.targets
    .map((target, index) => {
      const section = target.section ? ` | section: ${target.section}` : ""
      return `${index + 1}. file: ${target.file}${section}\n   instruction: ${target.instruction}`
    })
    .join("\n")

  const constraints = input.constraints.length > 0 ? input.constraints.map((value) => `- ${value}`).join("\n") : "- 无"
  const acceptance =
    input.acceptanceCriteria.length > 0 ? input.acceptanceCriteria.map((value) => `- ${value}`).join("\n") : "- 无"

  return [
    `目标：${input.goal}`,
    "\n请只修改以下指定目标：",
    targets,
    "\n约束：",
    constraints,
    "\n验收标准：",
    acceptance,
  ].join("\n")
}
