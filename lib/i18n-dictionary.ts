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
    sidebar: {
      upload: "上传",
      home: "首页",
      transactions: "交易",
      unsorted: "待整理",
      apps: "应用",
      settings: "设置",
      importFromCsv: "从 CSV 导入",
      importJobs: "导入任务中心",
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
    sidebar: {
      upload: "Upload",
      home: "Home",
      transactions: "Transactions",
      unsorted: "Unsorted",
      apps: "Apps",
      settings: "Settings",
      importFromCsv: "Import from CSV",
      importJobs: "Import Jobs",
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
