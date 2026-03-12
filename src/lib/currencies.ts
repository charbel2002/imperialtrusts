export const SUPPORTED_CURRENCIES = ["EUR", "USD", "CHF"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Symbol map used in non-Intl contexts (e.g. slider prefix) */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: "€",
  USD: "$",
  CHF: "CHF",
};
