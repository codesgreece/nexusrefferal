import { el } from "./dictionaries/el";
import { en, type Dictionary } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./config";

export const dictionaries: Record<Locale, Dictionary> = { el, en };

export type { Dictionary };
export type Translate = (key: string, params?: Record<string, string | number>) => string;

function resolve(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Builds a translator for a locale. Missing keys fall back to the default
 * locale and finally to the key itself, so the UI never renders blank.
 */
export function createTranslator(locale: Locale): Translate {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key, params) => {
    const value = resolve(dict, key) ?? resolve(fallback, key);
    if (typeof value === "string") return interpolate(value, params);
    return key;
  };
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
