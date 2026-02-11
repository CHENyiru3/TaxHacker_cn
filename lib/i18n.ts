import { cookies } from "next/headers"
import { DEFAULT_LOCALE, Locale, LOCALE_COOKIE_NAME, locales } from "@/lib/i18n-dictionary"

export { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, locales, type Locale, getDictionary } from "@/lib/i18n-dictionary"

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return DEFAULT_LOCALE
}
