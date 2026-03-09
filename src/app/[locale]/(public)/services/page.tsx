import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
};


export default async function ServicesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = dict.services;

  function FeatureList({ items }: { items: string[] }) {
    return (<ul className="mt-6 space-y-3">{items.map((item) => (<li key={item} className="flex items-start gap-3 text-sm text-slate-600"><Check size={20} className="text-accent flex-shrink-0 mt-0.5" />{item}</li>))}</ul>);
  }

  return (
    <>
      <section className="pt-16 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">{t.tag}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight font-heading">{t.title}</h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-secondary text-xs font-semibold uppercase tracking-wide mb-5">{t.bankingTag}</span>
              <h2 className="text-3xl font-bold text-primary tracking-tight font-heading">{t.bankingTitle}</h2>
              <p className="mt-4 text-slate-500 leading-relaxed">{t.bankingDesc}</p>
              <FeatureList items={[t.bankingF1, t.bankingF2, t.bankingF3, t.bankingF4]} />
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-8">
              <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase tracking-wider">Account Number</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span></div>
              <p className="text-lg font-mono font-semibold text-primary tracking-wide mt-4">BNK 0038 4721 05</p>
              <div className="pt-4 mt-4 border-t border-slate-200"><p className="text-xs text-slate-400">Available Balance</p><p className="text-3xl font-bold text-primary mt-1 font-heading">$12,580<span className="text-lg text-slate-400">.00</span></p></div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative max-w-sm mx-auto">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 shadow-xl transform -rotate-3"><div className="flex justify-between items-start mb-8"><p className="text-xs text-white/50 uppercase tracking-wider">Virtual Card</p><span className="text-white font-bold text-sm tracking-wider">VISA</span></div><p className="text-white/70 text-sm tracking-[0.2em] font-mono">4821 **** **** 3647</p><p className="mt-4 text-white text-sm font-medium">John Doe</p></div>
              <div className="rounded-2xl bg-gradient-to-br from-accent to-accent-700 p-6 shadow-xl transform rotate-3 -mt-10 ml-12"><div className="flex justify-between items-start mb-8"><p className="text-xs text-white/50 uppercase tracking-wider">Virtual Card</p><span className="text-white/40 font-bold text-sm">MC</span></div><p className="text-white/70 text-sm tracking-[0.2em] font-mono">5412 **** **** 9183</p><p className="mt-4 text-white text-sm font-medium">John Doe</p></div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-accent text-xs font-semibold uppercase tracking-wide mb-5">{t.cardsTag}</span>
              <h2 className="text-3xl font-bold text-primary tracking-tight font-heading">{t.cardsTitle}</h2>
              <p className="mt-4 text-slate-500 leading-relaxed">{t.cardsDesc}</p>
              <FeatureList items={[t.cardsF1, t.cardsF2, t.cardsF3, t.cardsF4]} />
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-secondary text-xs font-semibold uppercase tracking-wide mb-5">{t.transfersTag}</span>
              <h2 className="text-3xl font-bold text-primary tracking-tight font-heading">{t.transfersTitle}</h2>
              <p className="mt-4 text-slate-500 leading-relaxed">{t.transfersDesc}</p>
              <FeatureList items={[t.transfersF1, t.transfersF2, t.transfersF3, t.transfersF4]} />
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50"><p className="text-sm font-semibold text-slate-700">Recent Transfers</p></div>
              {[{name:"Alice Johnson",amount:"-$1,200.00",status:"Completed",c:"bg-emerald-100 text-emerald-800"},{name:"Bob Williams",amount:"-$340.00",status:"Processing",c:"bg-amber-100 text-amber-800"},{name:"Clara Davis",amount:"-$5,000.00",status:"Pending",c:"bg-blue-100 text-blue-800"}].map((r,i)=>(<div key={i} className="px-6 py-4 flex items-center justify-between border-b border-slate-50 last:border-0"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{r.name[0]}</div><div><p className="text-sm font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">Wire transfer</p></div></div><div className="text-right"><p className="text-sm font-semibold text-slate-800">{r.amount}</p><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${r.c}`}>{r.status}</span></div></div>))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-primary text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-heading">{t.ctaTitle}</h2>
          <p className="mt-4 text-slate-400">{t.ctaSubtitle}</p>
          <Link href={`/${locale}/register`}><Button variant="accent" size="lg" className="mt-8 shadow-lg shadow-accent/20">{dict.nav.openAccount} <ArrowRight size={16} /></Button></Link>
        </div>
      </section>
    </>
  );
}
