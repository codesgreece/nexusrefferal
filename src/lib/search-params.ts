/** Helpers for reading URL search params on server components. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function single(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function pageNumber(params: RawSearchParams): number {
  const raw = single(params, "page");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

/** Returns the value only when it is one of the allowed options. */
export function oneOf<T extends readonly string[]>(
  params: RawSearchParams,
  key: string,
  allowed: T,
): T[number] | undefined {
  const value = single(params, key);
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined;
}

export function isoDate(params: RawSearchParams, key: string): string | undefined {
  const value = single(params, key);
  if (!value) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
