import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};


export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const dict = await getDictionary(params.locale as Locale);
  const t = dict.privacy;
  return (
    <>
      <section className="pt-16 pb-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.updated}: January 1, 2025</p>
        </div>
      </section>
      <section className="py-16"><div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-slate prose-sm max-w-none">
        <h2>1. {t.collectTitle}</h2><p>{t.intro}</p>
        <h2>2. {t.collectTitle}</h2><p>{t.collect}</p>
        <h2>3. {t.useTitle}</h2><p>{t.use}</p>
        <h2>4. {t.shareTitle}</h2><p>{t.share}</p>
        <h2>5. {t.securityTitle}</h2><p>{t.security}</p>
        <h2>6. {t.rightsTitle}</h2><p>{t.rights}</p>
        <h2>7. {t.contactTitle}</h2><p className="whitespace-pre-line">{t.contact}</p>
      </div></section>
    </>
  );
}
