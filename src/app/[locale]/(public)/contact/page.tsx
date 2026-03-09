import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { getDictionary } from "@/lib/dictionary";
import { getPlatformSettings } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};


export default async function ContactPage({ params }: { params: { locale: string } }) {
  const [dict, platform] = await Promise.all([
    getDictionary(params.locale as Locale),
    getPlatformSettings(),
  ]);
  const t = dict.contact;

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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-5 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-lg font-bold text-primary font-heading">{t.infoTitle}</h3>
            {[
              { icon: Mail, label: t.email, value: platform.email, bg: "bg-blue-50", color: "text-secondary" },
              { icon: Phone, label: t.phone, value: platform.phone, bg: "bg-emerald-50", color: "text-accent" },
              { icon: MapPin, label: t.office, value: platform.address, bg: "bg-slate-100", color: "text-primary" },
              { icon: Clock, label: t.hours, value: t.hoursValue, bg: "bg-blue-50", color: "text-secondary" },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.label}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-line">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-primary mb-6 font-heading">{t.formTitle}</h3>
            <ContactForm dict={dict} />
          </div>
        </div>
      </section>
    </>
  );
}
