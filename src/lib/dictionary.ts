import type { Locale } from "./i18n";
import type { PlatformSettings } from "./platform";

// Dynamically load translation files
const dictionaries: Record<string, () => Promise<Record<string, any>>> = {
  en: () => import("@/locales/en.json").then((m) => m.default),
  fr: () => import("@/locales/fr.json").then((m) => m.default),
  de: () => import("@/locales/de.json").then((m) => m.default),
  es: () => import("@/locales/es.json").then((m) => m.default),
  it: () => import("@/locales/it.json").then((m) => m.default),
  hi: () => import("@/locales/hi.json").then((m) => m.default),
  sk: () => import("@/locales/sk.json").then((m) => m.default),
  pt: () => import("@/locales/pt.json").then((m) => m.default),
  ro: () => import("@/locales/ro.json").then((m) => m.default),
  cz: () => import("@/locales/cz.json").then((m) => m.default),
  fi: () => import("@/locales/fi.json").then((m) => m.default),
  el: () => import("@/locales/el.json").then((m) => m.default),
  hu: () => import("@/locales/hu.json").then((m) => m.default),
};

/**
 * Deep-replace all {{placeholder}} strings in a dictionary object.
 */
function injectPlatformVars(obj: any, vars: Record<string, string>): any {
  if (typeof obj === "string") {
    let result = obj;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }
  if (Array.isArray(obj)) return obj.map((item) => injectPlatformVars(item, vars));
  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = injectPlatformVars(value, vars);
    }
    return result;
  }
  return obj;
}

/**
 * Load dictionary for a locale.
 * If platform settings are provided, all {{platformName}}, {{platformEmail}}, etc.
 * placeholders are replaced throughout the entire dictionary.
 */
export async function getDictionary(
  locale: Locale,
  platform?: PlatformSettings
): Promise<Record<string, any>> {
  const loader = dictionaries[locale] || dictionaries.en;
  const raw = await loader();

  // Attach the locale code so client components can use it for Intl APIs
  raw._locale = locale;

  if (!platform) return raw;

  const injected = injectPlatformVars(raw, {
    platformName: platform.name,
    platformEmail: platform.email,
    platformPhone: platform.phone,
    platformAddress: platform.address,
    platformTagline: platform.tagline,
  });

  // Preserve _locale after injection (injectPlatformVars keeps it)
  injected._locale = locale;
  return injected;
}

/**
 * Get a nested value from dictionary using dot notation.
 */
export function t(dict: Record<string, any>, key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: any = dict;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }

  if (typeof value !== "string") return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v)),
      value
    );
  }

  return value;
}
