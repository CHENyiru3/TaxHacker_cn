"use client"

import { useLocale } from "@/components/i18n/locale-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-xs text-muted-foreground min-w-8">{t("sidebar", "language")}</span>
      <Select value={locale} onValueChange={(value) => setLocale(value as "zh-CN" | "en")}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh-CN">{t("sidebar", "chinese")}</SelectItem>
          <SelectItem value="en">{t("sidebar", "english")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
