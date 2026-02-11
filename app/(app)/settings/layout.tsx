import { SideNav } from "@/components/settings/side-nav"
import { Separator } from "@/components/ui/separator"
import { getDictionary, getServerLocale } from "@/lib/i18n"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Customize your settings here",
}

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale()
  const dict = getDictionary(locale)

  const settingsCategories = [
    {
      title: dict.settings.general,
      href: "/settings",
    },
    {
      title: dict.settings.profileAndPlan,
      href: "/settings/profile",
    },
    {
      title: dict.settings.businessDetails,
      href: "/settings/business",
    },
    {
      title: dict.settings.llmSettings,
      href: "/settings/llm",
    },
    {
      title: dict.settings.fields,
      href: "/settings/fields",
    },
    {
      title: dict.settings.categories,
      href: "/settings/categories",
    },
    {
      title: dict.settings.projects,
      href: "/settings/projects",
    },
    {
      title: dict.settings.currencies,
      href: "/settings/currencies",
    },
    {
      title: dict.settings.backups,
      href: "/settings/backups",
    },
    {
      title: dict.settings.dangerZone,
      href: "/settings/danger",
    },
  ]

  return (
    <>
      <div className="space-y-6 p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{dict.settings.pageTitle}</h2>
          <p className="text-muted-foreground">{dict.settings.pageDescription}</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SideNav items={settingsCategories} />
          </aside>
          <div className="flex w-full">{children}</div>
        </div>
      </div>
    </>
  )
}
