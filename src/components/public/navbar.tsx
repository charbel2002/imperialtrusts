"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import type { Locale } from "@/lib/i18n";
import type { PlatformSettings } from "@/lib/platform";

interface Props {
  locale: Locale;
  dict: Record<string, any>;
  platform: PlatformSettings;
}

export function Navbar({ locale, dict, platform }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const t = dict.nav;

  const navLinks = [
    { href: `/${locale}`, label: t.home },
    { href: `/${locale}/services`, label: t.services },
    { href: `/${locale}/loan-simulator`, label: t.loans },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/contact`, label: t.contact },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 nav-blur bg-white/70 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-primary tracking-tight font-heading">{platform.name}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                  pathname === link.href ? "text-primary bg-slate-100" : "text-slate-600 hover:text-primary hover:bg-slate-50"
                )}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} compact />
            {session ? (
              <Link href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}>
                <Button size="sm">{t.dashboard}</Button>
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">{t.signIn}</Link>
                <Link href={`/${locale}/register`}><Button size="sm">{t.openAccount}</Button></Link>
              </>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-600 hover:text-slate-800">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-3 space-y-1 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={cn("block px-4 py-2.5 rounded-lg text-sm font-medium",
                  pathname === link.href ? "text-primary bg-slate-100" : "text-slate-600"
                )}>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-3">
              <LanguageSwitcher currentLocale={locale} />
              <div className="flex gap-3">
                {session ? (
                  <Link href="/dashboard" className="w-full"><Button className="w-full" size="sm">{t.dashboard}</Button></Link>
                ) : (
                  <>
                    <Link href={`/${locale}/login`} className="flex-1"><Button variant="outline" size="sm" className="w-full">{t.signIn}</Button></Link>
                    <Link href={`/${locale}/register`} className="flex-1"><Button size="sm" className="w-full">{t.openAccount}</Button></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
