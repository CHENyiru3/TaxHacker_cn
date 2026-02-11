"use client"

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, Locale, locales, translations } from "@/lib/i18n-dictionary"
import { createContext, useContext, useMemo, useState } from "react"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (group: keyof (typeof translations)[Locale], key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ initialLocale, children }: { initialLocale?: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale && locales.includes(initialLocale) ? initialLocale : DEFAULT_LOCALE
  )

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
  }

  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (group, key) => {
        const dict = translations[locale][group] as Record<string, string>
        return dict[key] || key
      },
    }
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider")
  }

  return context
}
