"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Input, Alert } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { requestLoginOtp } from "@/actions/auth";
import { translateActionError } from "@/lib/translate-error";
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
  const [dict, setDict] = useState<any>(null);
  const [t, setT] = useState<any>(null);

  // Two-phase login state
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    (dicts[locale] || dicts.en)().then(d => {
      setDict(d);
      setT(d.auth.login);
    });
  }, [locale]);

  // Phase 1: Validate credentials → send OTP
  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const emailVal = form.get("email") as string;
    const passwordVal = form.get("password") as string;

    try {
      const result = await requestLoginOtp(emailVal, passwordVal);

      if (result.error) {
        setError(dict ? translateActionError(result.error, dict) : result.error);
        setLoading(false);
        return;
      }

      // Admin users bypass OTP — sign in directly
      if (result.isAdmin) {
        const signInResult = await signIn("credentials", {
          email: emailVal,
          password: passwordVal,
          otp: "",
          redirect: false,
        });
        setLoading(false);
        if (signInResult?.error) {
          setError(dict ? translateActionError(signInResult.error, dict) : signInResult.error);
        } else {
          router.push("/admin");
          router.refresh();
        }
        return;
      }

      // OTP sent — move to step 2
      setEmail(emailVal);
      setPassword(passwordVal);
      setStep("otp");
    } catch {
      setError(t?.error || "Something went wrong");
    }
    setLoading(false);
  }

  // Phase 2: Verify OTP → sign in
  async function handleOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      otp,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(dict ? translateActionError(result.error, dict) : result.error);
    } else {
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        const session = await getSession();
        const isAdmin = (session?.user as any)?.role === "ADMIN";
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
      router.refresh();
    }
  }

  // Resend OTP
  async function handleResend() {
    setResending(true);
    setError("");
    try {
      const result = await requestLoginOtp(email, password);
      if (result.error) {
        setError(dict ? translateActionError(result.error, dict) : result.error);
      }
    } catch {
      setError(t?.error || "Something went wrong");
    }
    setResending(false);
  }

  // Go back to credentials step
  function handleBack() {
    setStep("credentials");
    setOtp("");
    setError("");
  }

  if (!t) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-heading">
            {step === "otp" ? t.otpTitle : t.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {step === "otp" ? t.otpSubtitle : t.subtitle}
          </p>
        </div>
        <LanguageSwitcher currentLocale={locale} compact />
      </div>

      {registered && step === "credentials" && (
        <Alert variant="success" className="mb-5">{t.registered}</Alert>
      )}
      {error && <Alert variant="danger" className="mb-5">{error}</Alert>}

      {step === "credentials" ? (
        <form onSubmit={handleCredentials} className="space-y-5">
          <Input name="email" type="email" label={t.email} placeholder="john@example.com" required autoFocus />
          <Input name="password" type="password" label={t.password} placeholder="********" required />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="remember" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-secondary focus:ring-secondary/20" />
              <span className="text-sm text-slate-600">{t.remember}</span>
            </label>
            <Link href={`/${locale}/forgot-password`} className="text-sm text-secondary font-medium hover:underline">{t.forgot}</Link>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? t.signing : t.submit}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtp} className="space-y-5">
          <p className="text-sm text-slate-600 mb-2">{t.otpSent}</p>
          <Input
            name="otp"
            type="text"
            label={t.otpLabel}
            placeholder={t.otpPlaceholder}
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
            maxLength={6}
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? t.otpVerifying : t.otpSubmit}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleBack}
              className="text-secondary font-medium hover:underline"
            >
              {t.otpBack}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-secondary font-medium hover:underline disabled:opacity-50"
            >
              {resending ? t.otpResending : t.otpResend}
            </button>
          </div>
        </form>
      )}

      {step === "credentials" && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {t.noAccount}{" "}
          <Link href={`/${locale}/register`} className="text-secondary font-medium hover:underline">{t.createOne}</Link>
        </p>
      )}
    </div>
  );
}
