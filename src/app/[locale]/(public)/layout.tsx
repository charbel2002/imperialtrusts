import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(locale, platform);

  return (
    <>
      <Navbar locale={locale} dict={dict} platform={platform} />
      <main className="pt-16"><div className="page-transition">{children}</div></main>
      <Footer locale={locale} dict={dict} platform={platform} />
    </>
  );
}
