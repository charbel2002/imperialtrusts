"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import type { Locale } from "@/lib/i18n";

// Client-side dict loading
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

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as Locale) || "en";
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    (dicts[locale] || dicts.en)().then(d => setT(d.auth.login));
  }, [locale]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      if (callbackUrl) { router.push(callbackUrl); }
      else {
        const session = await getSession();
        const isAdmin = (session?.user as any)?.role === "ADMIN";
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
      router.refresh();
    }
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
      {registered && <Alert variant="success" className="mb-5">{t.registered}</Alert>}
      {error && <Alert variant="danger" className="mb-5">{t.error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input name="email" type="email" label={t.email} placeholder="john@example.com" required autoFocus />
        <Input name="password" type="password" label={t.password} placeholder="********" required />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer"><input name="remember" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-secondary focus:ring-secondary/20" /><span className="text-sm text-slate-600">{t.remember}</span></label>
          <Link href={`/${locale}/forgot-password`} className="text-sm text-secondary font-medium hover:underline">{t.forgot}</Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>{loading ? t.signing : t.submit}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{t.noAccount} <Link href={`/${locale}/register`} className="text-secondary font-medium hover:underline">{t.createOne}</Link></p>
    </div>
  );
}
