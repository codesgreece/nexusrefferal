export const LOCALES = ["el", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "el";
export const LOCALE_COOKIE = "nds_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  el: "🇬🇷",
  en: "🇬🇧",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function dateLocaleTag(locale: Locale) {
  return locale === "el" ? "el-GR" : "en-GB";
}
