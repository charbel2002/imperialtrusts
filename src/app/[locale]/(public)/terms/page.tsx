import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
};


export default async function TermsPage({ params }: { params: { locale: string } }) {
  const platform = await getPlatformSettings();
  const dict = await getDictionary(params.locale as Locale, platform);
  const t = dict.terms;
  return (
    <>
      <section className="pt-16 pb-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.updated}: January 1, 2025</p>
        </div>
      </section>
      <section className="py-16"><div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-slate prose-sm max-w-none">
        <h2>1. {t.acceptTitle}</h2><p>{t.accept}</p>
        <h2>2. {t.accountTitle}</h2><p>{t.account}</p>
        <h2>3. {t.kycTitle}</h2><p>{t.kyc}</p>
        <h2>4. {t.bankingTitle}</h2><p>{t.banking}</p>
        <h2>5. {t.locksTitle}</h2><p>{t.locks}</p>
        <h2>6. {t.loansTitle}</h2><p>{t.loans}</p>
        <h2>7. {t.prohibitedTitle}</h2><p>{t.prohibited}</p>
        <h2>8. {t.liabilityTitle}</h2><p>{t.liability}</p>
        <h2>9. {t.lawTitle}</h2><p>{t.law}</p>
        <h2>10. {t.contactTitle}</h2><p className="whitespace-pre-line">{t.contact}</p>
      </div></section>
    </>
  );
}
