export const locales = ["en", "fr", "de", "es", "it", "hi", "sk", "pt", "ro", "cz", "fi", "el", "hu"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  hi: "हिन्दी",
  sk: "Slovenčina",
  pt: "Português",
  ro: "Română",
  cz: "Čeština",
  fi: "Suomi",
  el: "Ελληνικά",
  hu: "Magyar",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸",
  it: "🇮🇹",
  hi: "🇮🇳",
  sk: "🇸🇰",
  pt: "🇵🇹",
  ro: "🇷🇴",
  cz: "🇨🇿",
  fi: "🇫🇮",
  el: "🇬🇷",
  hu: "🇭🇺",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code] = lang.trim().split(";");
      return code.trim().substring(0, 2).toLowerCase();
    });

  for (const lang of preferred) {
    if (isValidLocale(lang)) return lang;
  }

  return defaultLocale;
}
