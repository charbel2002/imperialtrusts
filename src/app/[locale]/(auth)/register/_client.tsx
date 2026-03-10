"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { translateActionError } from "@/lib/translate-error";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
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
        <Button type="submit" className="w-full" loading={loading}>{loading ? t.creating : t.submit}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{t.hasAccount} <Link href={`/${locale}/login`} className="text-secondary font-medium hover:underline">{t.signIn}</Link></p>
    </div>
  );
}
