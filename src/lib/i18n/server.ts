import { cookies, headers } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { createTranslator, getDictionary, type Translate } from ".";

/** Cookie first, then Accept-Language, then the program default (Greek). */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  const accept = headerStore.get("accept-language")?.toLowerCase() ?? "";
  if (accept.includes("en") && !accept.includes("el")) return "en";

  return DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{
  locale: Locale;
  t: Translate;
  dict: ReturnType<typeof getDictionary>;
}> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale), dict: getDictionary(locale) };
}
