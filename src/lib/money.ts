/**
 * All monetary values are integer euro cents. Nothing in the app stores or
 * computes money as a float.
 */

export function formatMoney(cents: number, locale = "el", currency = "EUR") {
  return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatMoneyPrecise(cents: number, locale = "el", currency = "EUR") {
  return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parses user-entered euro amounts ("200", "200.50", "1.234,56") to cents. */
export function parseEurosToCents(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.round(input * 100);
  }
  const raw = input.trim().replace(/[€\s]/g, "");
  if (!raw) return null;

  let normalized = raw;
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma && hasDot) {
    // Whichever separator appears last is the decimal separator.
    normalized =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (hasComma) {
    normalized = raw.replace(",", ".");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function centsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}
