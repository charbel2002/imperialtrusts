"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { translateActionError } from "@/lib/translate-error";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import type { Locale } from "@/lib/i18n";

const dicts: Record<string, () => Promise<any>> = {
  en: () => import("@/locales/en.json").then(m => m.default),
  fr: () => import("@/locales/fr.json").then(m => m.default),
  de: () => import("@/locales/de.json").then(m => m.default),
  es: () => import("@/locales/es.json").then(m => m.default),
  it: () => import("@/locales/it.json").then(m => m.default),
  hi: () => import("@/locales/hi.json").then(m => m.default),
  sk: () => import("@/locales/sk.json").then(m => m.default),
  pt: () => import("@/locales/pt.json").then(m => m.default),
  ro: () => import("@/locales/ro.json").then(m => m.default),
  cz: () => import("@/locales/cz.json").then(m => m.default),
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) || "en";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [t, setT] = useState<any>(null);
  const [fullDict, setFullDict] = useState<any>({});

  useEffect(() => {
    (dicts[locale] || dicts.en)().then(d => { setT(d.auth.register); setFullDict(d); });
  }, [locale]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    form.set("language", locale);
    form.set("currency", currency);
    const result = await registerUser(form);
    setLoading(false);
    if (result.error) setError(translateActionError(result.error, fullDict));
    else router.push(`/${locale}/login?registered=true`);
  }

  if (!t) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-heading">{t.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <LanguageSwitcher currentLocale={locale} compact />
      </div>
      {error && <Alert variant="danger" className="mb-5">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input name="name" label={t.name} placeholder="John Doe" required autoFocus />
        <Input name="email" type="email" label={t.email} placeholder="john@example.com" required />
        <Input name="password" type="password" label={t.password} placeholder="********" required />
        <Input name="confirmPassword" type="password" label={t.confirmPassword} placeholder="********" required />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.currency || "Account Currency"}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{(t as any)?.[c.toLowerCase()] || c}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">{t.selectCurrency || "Select your preferred currency"}</p>
        </div>
        <Button type="submit" className="w-full" loading={loading}>{loading ? t.creating : t.submit}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{t.hasAccount} <Link href={`/${locale}/login`} className="text-secondary font-medium hover:underline">{t.signIn}</Link></p>
    </div>
  );
}
