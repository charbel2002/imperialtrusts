import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function generateAccountNumber(): string {
  const digits = Math.random().toString().slice(2, 12).padEnd(10, "0");
  return `BNK${digits}`;
}

export function generateCardNumber(type: "VISA" | "MASTERCARD"): string {
  const prefix = type === "VISA" ? "4" : "5";
  let num = prefix;
  for (let i = 0; i < 15; i++) num += Math.floor(Math.random() * 10);
  return num;
}

export function generateReference(): string {
  const id = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TXN-${id}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function calculateMonthlyPayment(
  amount: number,
  months: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount / months;
  return (
    (amount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// Locale mapping for Intl date/number formatting
const intlLocaleMap: Record<string, string> = {
  en: "en-US", fr: "fr-FR", de: "de-DE", es: "es-ES",
  it: "it-IT", pt: "pt-BR", hi: "hi-IN", sk: "sk-SK",
  ro: "ro-RO", cz: "cs-CZ",
};

export function getIntlLocale(locale: string): string {
  return intlLocaleMap[locale] || "en-US";
}

export function formatDate(date: Date | string, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const intlLocale = getIntlLocale(locale);
  return d.toLocaleDateString(intlLocale, options || { year: "numeric", month: "long", day: "numeric" });
}
