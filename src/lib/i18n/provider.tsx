"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";

import {
  LOCALE_COOKIE,
  LOCALES,
  dateLocaleTag,
  type Locale,
} from "./config";
import { createTranslator, type Translate } from ".";

type I18nContextValue = {
  locale: Locale;
  t: Translate;
  setLocale: (locale: Locale) => void;
  isSwitching: boolean;
  formatDate: (value: Date | string | number, withTime?: boolean) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [isSwitching, startTransition] = useTransition();

  const t = useMemo(() => createTranslator(locale), [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (!LOCALES.includes(next)) return;
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${oneYear};samesite=lax`;
    startTransition(() => {
      // A full refresh re-renders every server component with the new locale.
      window.location.reload();
    });
  }, []);

  const formatDate = useCallback(
    (value: Date | string | number, withTime = false) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat(dateLocaleTag(locale), {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      }).format(date);
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(dateLocaleTag(locale), options).format(value),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, t, setLocale, isSwitching, formatDate, formatNumber }),
    [locale, t, setLocale, isSwitching, formatDate, formatNumber],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
