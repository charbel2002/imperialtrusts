"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface Props {
  currentLocale: Locale;
  compact?: boolean;
}

export function LanguageSwitcher({ currentLocale, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(newLocale: Locale) {
    // Replace the locale segment in the URL: /en/services -> /fr/services
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/") || `/${newLocale}`;
    router.push(newPath);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg transition-colors",
          compact
            ? "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            : "px-3 py-2 text-sm border border-slate-200 hover:border-slate-300 bg-white"
        )}
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        {!compact && (
          <span className="text-xs font-medium text-slate-600">{currentLocale.toUpperCase()}</span>
        )}
        <Globe size={compact ? 16 : 14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-fade-in-up" style={{ animationDuration: "0.15s" }}>
          <div className="py-1 max-h-80 overflow-y-auto">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  locale === currentLocale
                    ? "bg-secondary/5 text-secondary font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="text-base">{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
