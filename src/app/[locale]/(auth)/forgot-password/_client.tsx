"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || "en";
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    (dicts[locale] || dicts.en)().then(d => setT(d.auth.forgotPassword));
  }, [locale]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  if (!t) return null;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 font-heading">{t.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
      </div>
      {sent ? (
        <Alert variant="success"><CheckCircle size={20} className="flex-shrink-0" /><span>{t.sent}</span></Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input name="email" type="email" label={t.email} placeholder="john@example.com" required autoFocus />
          <Button type="submit" className="w-full" loading={loading}>{t.submit}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href={`/${locale}/login`} className="text-secondary font-medium hover:underline">&larr; {t.back}</Link>
      </p>
    </div>
  );
}
