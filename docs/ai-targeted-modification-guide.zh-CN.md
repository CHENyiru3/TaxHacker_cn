# AI 定向修改指南（指定文件 / 指定片段）

> 目标：后续添加功能时，可以明确提示 AI “只改哪些文件、哪些部分、按什么标准验收”。

## 1. 推荐请求格式（JSON）

```json
{
  "goal": "实现导入任务失败重试按钮",
  "targets": [
    {
      "file": "components/import/jobs-overview.tsx",
      "section": "最近导入任务表格操作列",
      "instruction": "新增失败任务的重试按钮，点击后调用重试接口"
    },
    {
      "file": "app/api/imports/[jobId]/retry/route.ts",
      "instruction": "新增 POST 接口，校验权限后触发重试"
    }
  ],
  "constraints": ["默认中文文案", "不修改无关文件", "保持现有样式风格统一"],
  "acceptanceCriteria": ["失败任务出现重试按钮", "重试后任务状态变为 pending/running", "eslint 与 build 通过"]
}
```

## 2. 字段说明

- `goal`：业务目标（必须）。
- `targets`：修改目标列表（至少 1 个）。
  - `file`：明确文件路径（必须）。
  - `section`：文件中的逻辑片段（可选但强烈建议）。
  - `instruction`：该目标要做什么（必须）。
- `constraints`：约束条件（可选）。
- `acceptanceCriteria`：验收标准（可选）。

## 3. API 解析支持

当前系统提供：

- `POST /api/ai/change-request`

该接口会：

1. 校验请求结构合法性。
2. 输出规范化结构。
3. 生成适用于 AI 执行的标准 Prompt 文本。

## 4. 团队使用建议

1. 每次需求拆分成多个 `targets`，避免“一个请求改全仓”。
2. 必填 `constraints`，尤其是“默认中文”“不改无关文件”。
3. 必填 `acceptanceCriteria`，保证提交可验收。
4. 对于高风险变更（鉴权、财税口径、报告计算），必须要求 AI 先输出计划。
