import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { PlatformSettings } from "@/lib/platform";

interface Props {
  locale: Locale;
  dict: Record<string, any>;
  platform: PlatformSettings;
}

export function Footer({ locale, dict, platform }: Props) {
  const t = dict.footer;
  const nav = dict.nav;

  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold font-heading tracking-tight">{t.ctaTitle}</h3>
            <p className="mt-1 text-slate-400">{t.ctaSubtitle}</p>
          </div>
          <Link href={`/${locale}/register`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-600 shadow-lg shadow-accent/20 transition-colors whitespace-nowrap">
            {t.ctaButton}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <span className="text-lg font-bold tracking-tight font-heading">{platform.name}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{t.brand}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">{t.product}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/services`} className="text-sm text-slate-300 hover:text-white transition-colors">{nav.services}</Link></li>
              <li><Link href={`/${locale}/loan-simulator`} className="text-sm text-slate-300 hover:text-white transition-colors">{nav.loans}</Link></li>
              <li><Link href={`/${locale}/register`} className="text-sm text-slate-300 hover:text-white transition-colors">{nav.openAccount}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">{t.company}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/about`} className="text-sm text-slate-300 hover:text-white transition-colors">{nav.about}</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-sm text-slate-300 hover:text-white transition-colors">{nav.contact}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">{t.legalTitle}</h4>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/legal`} className="text-sm text-slate-300 hover:text-white transition-colors">{t.legalNotices}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="text-sm text-slate-300 hover:text-white transition-colors">{t.privacyPolicy}</Link></li>
              <li><Link href={`/${locale}/terms`} className="text-sm text-slate-300 hover:text-white transition-colors">{t.termsOfService}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} {platform.name}. {t.copyright}</p>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {t.status}
          </span>
        </div>
      </div>
    </footer>
  );
}
