import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  if (!isValidLocale(locale)) return {};

  const platform = await getPlatformSettings();
  const dict = await getDictionary(locale, platform);

  return {
    title: {
      default: dict.meta.title,
      template: `%s | ${platform.name}`,
    },
    description: dict.meta.description,
    alternates: {
      languages: {
        en: "/en", fr: "/fr", de: "/de", es: "/es", it: "/it",
        hi: "/hi", sk: "/sk", pt: "/pt", ro: "/ro", cs: "/cz",
      },
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) {
    notFound();
  }
  return children;
}
