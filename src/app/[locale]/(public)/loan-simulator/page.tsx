import { LoanSimulator } from "@/components/public/loan-simulator";
import { Calculator, Mail, Clock } from "lucide-react";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loan Simulator",
};


export default async function LoanSimulatorPage({ params }: { params: { locale: string } }) {
  const platform = await getPlatformSettings();
  const dict = await getDictionary(params.locale as Locale, platform);
  const t = dict.loanSim;

  return (
    <>
      <section className="pt-16 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">{t.tag}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight font-heading">{t.title}</h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>
      <section className="py-16"><div className="max-w-5xl mx-auto px-6 lg:px-8"><LoanSimulator dict={dict} /></div></section>
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          {[{icon:Calculator,title:t.infoCalc,desc:t.infoCalcDesc},{icon:Mail,title:t.infoEmail,desc:t.infoEmailDesc},{icon:Clock,title:t.infoReview,desc:t.infoReviewDesc}].map((f)=>(<div key={f.title} className="text-center"><div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><f.icon size={24} className="text-primary" /></div><h3 className="text-sm font-bold text-primary">{f.title}</h3><p className="mt-1 text-xs text-slate-500">{f.desc}</p></div>))}
        </div>
      </section>
    </>
  );
}
