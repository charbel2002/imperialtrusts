import Link from "next/link";
import { ArrowRight, Shield, CreditCard, Send, Users, Calculator, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const platform = await getPlatformSettings();
  const dict = await getDictionary(locale, platform);
  const t = dict.home;

  const features = [
    { icon: Send, title: t.feature1Title, desc: t.feature1Desc, color: "text-secondary", bg: "bg-blue-50" },
    { icon: CreditCard, title: t.feature2Title, desc: t.feature2Desc, color: "text-accent", bg: "bg-emerald-50" },
    { icon: Shield, title: t.feature3Title, desc: t.feature3Desc, color: "text-primary", bg: "bg-slate-50" },
    { icon: Users, title: t.feature4Title, desc: t.feature4Desc, color: "text-secondary", bg: "bg-blue-50" },
    { icon: Calculator, title: t.feature5Title, desc: t.feature5Desc, color: "text-accent", bg: "bg-emerald-50" },
    { icon: Bell, title: t.feature6Title, desc: t.feature6Desc, color: "text-primary", bg: "bg-slate-50" },
  ];

  const steps = [
    { num: "01", title: t.step1Title, desc: t.step1Desc },
    { num: "02", title: t.step2Title, desc: t.step2Desc },
    { num: "03", title: t.step3Title, desc: t.step3Desc },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden hero-glow">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent/[0.08] blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary/[0.06] blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-6 animate-fade-in-up">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />{t.badge}
              </span>
              <h1 className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight font-heading" style={{ animationDelay: "0.1s" }}>
                {t.heroTitle1}<br />{t.heroTitle2} <span className="gradient-text">{t.heroTitle3}</span>.
              </h1>
              <p className="animate-fade-in-up mt-6 text-lg text-slate-500 leading-relaxed max-w-lg" style={{ animationDelay: "0.2s" }}>{t.heroSubtitle}</p>
              <div className="animate-fade-in-up mt-8 flex flex-wrap gap-4" style={{ animationDelay: "0.3s" }}>
                <Link href={`/${locale}/register`}><Button size="lg" className="shadow-xl shadow-primary/15">{t.cta} <ArrowRight size={16} /></Button></Link>
                <Link href={`/${locale}/loan-simulator`}><Button variant="outline" size="lg">{t.ctaLoan}</Button></Link>
              </div>
              <div className="animate-fade-in-up mt-10 flex items-center gap-8" style={{ animationDelay: "0.4s" }}>
                {[{ val: "256-bit", sub: t.ssl }, { val: "24/7", sub: t.access }, { val: "0 fees", sub: t.noFees }].map((s, i) => (
                  <div key={i}><span className="text-2xl font-bold text-primary font-heading">{s.val}</span><span className="block text-xs text-slate-400 mt-0.5">{s.sub}</span></div>
                ))}
              </div>
            </div>
            {/* Floating card - unchanged visual */}
            <div className="relative hidden lg:block">
              <div className="animate-float-slow relative w-full max-w-md mx-auto">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary-700 p-8 shadow-2xl shadow-primary/30">
                  <div className="card-shine absolute inset-0 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-10">
                      <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-90" />
                      <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="12" r="6" /><circle cx="16" cy="12" r="6" opacity="0.6" /></svg>
                    </div>
                    <p className="text-white/60 text-sm tracking-[0.25em] font-mono">**** **** **** 4821</p>
                    <div className="mt-6 flex items-end justify-between">
                      <div><p className="text-white/40 text-xs uppercase tracking-wider">Card Holder</p><p className="text-white font-semibold mt-0.5">John Doe</p></div>
                      <div><p className="text-white/40 text-xs uppercase tracking-wider">Expires</p><p className="text-white font-semibold mt-0.5">09/28</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="animate-float-medium absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle size={20} className="text-emerald-600" /></div>
                <div><p className="text-xs text-slate-400">Transfer Sent</p><p className="text-sm font-bold text-slate-800">$2,450.00</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">{t.featuresTag}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.featuresTitle}</h2>
            <p className="mt-4 text-slate-500 leading-relaxed">{t.featuresSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}><f.icon size={24} className={f.color} /></div>
                <h3 className="text-lg font-bold text-primary mb-2 font-heading">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">{t.howTag}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.howTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <span className="text-6xl font-bold text-primary/5 absolute -top-4 -left-2 font-heading">{s.num}</span>
                <div className="relative pt-8">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mb-5">{s.num}</div>
                  <h3 className="text-xl font-bold text-primary mb-2 font-heading">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{ value: "15K+", label: t.statsUsers }, { value: "$42M+", label: t.statsVolume }, { value: "99.9%", label: t.statsUptime }, { value: "< 2 min", label: t.statsSetup }].map((s) => (
              <div key={s.label}><p className="text-3xl sm:text-4xl font-bold text-white font-heading">{s.value}</p><p className="mt-1 text-sm text-slate-400">{s.label}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">{t.testimonialsTag}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight font-heading">{t.testimonialsTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: t.testimonial1, name: "Sarah M.", role: "Freelance Designer", initials: "SM" },
              { text: t.testimonial2, name: "David K.", role: "Small Business Owner", initials: "DK" },
              { text: t.testimonial3, name: "Amira L.", role: "Digital Nomad", initials: "AL" },
            ].map((tm) => (
              <div key={tm.name} className="rounded-2xl border border-slate-200 p-7 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => (<svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}</div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">&ldquo;{tm.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{tm.initials}</div>
                  <div><p className="text-sm font-semibold text-slate-800">{tm.name}</p><p className="text-xs text-slate-400">{tm.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight font-heading whitespace-pre-line">{t.ctaFinalTitle}</h2>
          <p className="mt-5 text-lg text-slate-300 max-w-xl mx-auto">{t.ctaFinalSubtitle}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/register`}><Button variant="accent" size="lg" className="shadow-xl shadow-accent/25">{t.ctaFinalButton} <ArrowRight size={18} /></Button></Link>
            <Link href={`/${locale}/services`}><Button variant="ghost" size="lg" className="text-white border-2 border-white/20 hover:bg-white/10">{t.ctaExplore}</Button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
