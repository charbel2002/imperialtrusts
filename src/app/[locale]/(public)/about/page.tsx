import Link from "next/link";
import { Shield, Eye, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};


export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(locale, platform);
  const t = dict.about;

  return (
    <>
      <section className="pt-16 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">{t.tag}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight font-heading whitespace-pre-line">{t.title}</h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight mb-6 font-heading">{t.storyTitle}</h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>{t.storyP1}</p><p>{t.storyP2}</p><p>{t.storyP3}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{val:"2024",label:t.founded,bg:"bg-primary text-white"},{val:"15K+",label:t.users,bg:"bg-accent text-white"},{val:"50+",label:t.countries,bg:"bg-secondary text-white"},{val:"99.9%",label:t.uptime,bg:"bg-slate-100 text-primary"}].map((s)=>(<div key={s.label} className={`rounded-2xl p-7 ${s.bg}`}><p className="text-3xl font-bold font-heading">{s.val}</p><p className={`text-sm mt-1 ${s.bg.includes("slate")?"text-slate-400":"text-white/70"}`}>{s.label}</p></div>))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary tracking-tight text-center mb-14 font-heading">{t.valuesTitle}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[{icon:Shield,title:t.value1Title,desc:t.value1Desc},{icon:Eye,title:t.value2Title,desc:t.value2Desc},{icon:Zap,title:t.value3Title,desc:t.value3Desc}].map((v)=>(<div key={v.title} className="text-center px-4"><div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5"><v.icon size={28} className="text-accent" /></div><h3 className="text-lg font-bold text-primary mb-2 font-heading">{v.title}</h3><p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p></div>))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-primary text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white font-heading">{t.ctaTitle}</h2>
          <p className="mt-4 text-slate-400">{t.ctaSubtitle}</p>
          <Link href={`/${locale}/register`}><Button variant="accent" size="lg" className="mt-8">Get Started <ArrowRight size={16} /></Button></Link>
        </div>
      </section>
    </>
  );
}
