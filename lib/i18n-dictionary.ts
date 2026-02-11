export const locales = ["zh-CN", "en"] as const
export type Locale = (typeof locales)[number]

export const DEFAULT_LOCALE: Locale = "zh-CN"
export const LOCALE_COOKIE_NAME = "taxhacker_locale"

export const translations = {
  "zh-CN": {
    settings: {
      pageTitle: "设置",
      pageDescription: "在这里自定义你的设置",
      general: "常规",
      profileAndPlan: "个人资料与套餐",
      businessDetails: "企业信息",
      llmSettings: "LLM 设置",
      fields: "字段",
      categories: "分类",
      projects: "项目",
      currencies: "币种",
      backups: "备份",
      dangerZone: "危险区域",
    },
    agent: {
      sessionListTitle: "历史会话",
      sessionListDescription: "保留近期开启的咨询会话，支持切换上下文继续追问。",
      emptySessions: "暂无会话，发送第一条问题后会自动创建会话。",
      untitledSession: "未命名会话",
      workbenchTitle: "财税智能体工作区",
      workbenchDescription: "面向非专业用户提供清晰建议，复杂问题会提示补充材料。",
      beta: "Beta",
      emptyMessages: "请输入问题，例如：本月税负波动为什么异常？",
      inputPlaceholder: "请输入你的财税问题，建议包含时间范围、业务背景与目标。",
      send: "发送",
    },
    sidebar: {
      upload: "上传",
      home: "首页",
      transactions: "交易",
      unsorted: "待整理",
      apps: "应用",
      settings: "设置",
      importFromCsv: "从 CSV 导入",
      importJobs: "导入任务中心",
      aiAssistant: "财税智能体",
      thankAuthor: "感谢作者",
      language: "语言",
      chinese: "中文",
      english: "English",
    },
  },
  en: {
    settings: {
      pageTitle: "Settings",
      pageDescription: "Customize your settings here",
      general: "General",
      profileAndPlan: "Profile & Plan",
      businessDetails: "Business Details",
      llmSettings: "LLM settings",
      fields: "Fields",
      categories: "Categories",
      projects: "Projects",
      currencies: "Currencies",
      backups: "Backups",
      dangerZone: "Danger Zone",
    },
    agent: {
      sessionListTitle: "Sessions",
      sessionListDescription: "Recent advisory sessions. Continue with full context.",
      emptySessions: "No sessions yet. Send your first question to start.",
      untitledSession: "Untitled session",
      workbenchTitle: "Tax AI Workbench",
      workbenchDescription: "Professional guidance for clients with context-aware responses.",
      beta: "Beta",
      emptyMessages: "Ask a question, e.g. Why did VAT burden increase this month?",
      inputPlaceholder: "Describe your tax/accounting question with period and context.",
      send: "Send",
    },
    sidebar: {
      upload: "Upload",
      home: "Home",
      transactions: "Transactions",
      unsorted: "Unsorted",
      apps: "Apps",
      settings: "Settings",
      importFromCsv: "Import from CSV",
      importJobs: "Import Jobs",
      aiAssistant: "AI Assistant",
      thankAuthor: "Thank the author",
      language: "Language",
      chinese: "中文",
      english: "English",
    },
  },
} as const

export type TranslationKeyspace = (typeof translations)[Locale]

export function getDictionary(locale: Locale) {
  return translations[locale]
}
