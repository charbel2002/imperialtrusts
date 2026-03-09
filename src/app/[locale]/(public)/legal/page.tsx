import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
};


export default async function LegalPage({ params }: { params: { locale: string } }) {
  const dict = await getDictionary(params.locale as Locale);
  const t = dict.legal;
  return (
    <>
      <section className="pt-16 pb-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.updated}: January 1, 2025</p>
        </div>
      </section>
      <section className="py-16"><div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-slate prose-sm max-w-none">
        <h2>{t.publisherTitle}</h2><p className="whitespace-pre-line">{t.publisher}</p>
        <h2>{t.registrationTitle}</h2><p>{t.registration}</p>
        <h2>{t.ipTitle}</h2><p>{t.ip}</p>
        <h2>{t.liabilityTitle}</h2><p>{t.liability}</p>
        <h2>{t.lawTitle}</h2><p>{t.law}</p>
      </div></section>
    </>
  );
}
