import { z } from "zod";

import { AppError } from "@/lib/errors";

/**
 * Validation messages are i18n keys, not sentences. The client runs each
 * message through `t()` so field errors are bilingual without duplicating
 * schemas per locale.
 */
export const V = {
  required: "validation.required",
  email: "validation.email",
  phone: "validation.phone",
  password: "validation.password",
  passwordMatch: "validation.passwordMatch",
  adult: "validation.adult",
  dateOfBirth: "validation.dateOfBirth",
  terms: "validation.terms",
  privacy: "validation.privacy",
  socialRequired: "validation.socialRequired",
  code: "validation.code",
  amount: "validation.amount",
  number: "validation.number",
  url: "validation.url",
} as const;

export const requiredString = (max = 500) =>
  z.string({ error: V.required }).trim().min(1, V.required).max(max, V.required);

export const optionalString = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, V.required)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const emailField = z
  .string({ error: V.required })
  .trim()
  .min(1, V.required)
  .max(254, V.email)
  .toLowerCase()
  .pipe(z.email({ error: V.email }));

export const phoneField = z
  .string({ error: V.required })
  .trim()
  .min(6, V.phone)
  .max(32, V.phone)
  .regex(/^[+]?[\d\s()./-]{6,32}$/, V.phone);

export const optionalPhoneField = z
  .string()
  .trim()
  .max(32, V.phone)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine((value) => !value || /^[+]?[\d\s()./-]{6,32}$/.test(value), V.phone);

export const passwordField = z
  .string({ error: V.required })
  .min(10, V.password)
  .max(200, V.password);

export const referralCodeField = z
  .string({ error: V.required })
  .trim()
  .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  .refine((value) => /^[A-Z0-9]{3,20}$/.test(value), V.code);

export const checkboxTrue = (message: string) =>
  z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .transform((value) => value === true || value === "on" || value === "true")
    .refine((value) => value, message);

export const optionalCheckbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.undefined()])
  .transform((value) => value === true || value === "on" || value === "true");

export const centsField = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const raw = typeof value === "number" ? String(value) : value.trim();
    if (!raw) return NaN;
    const normalized = raw.replace(/[€\s]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
  })
  .refine((value) => Number.isFinite(value) && value >= 0, V.amount);

export const intField = (min = 0, max = 1_000_000) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => {
      const parsed = typeof value === "number" ? value : Number(value.trim());
      return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
    })
    .refine((value) => Number.isFinite(value) && value >= min && value <= max, V.number);

export const percentField = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : NaN;
  })
  .refine((value) => Number.isFinite(value) && value >= 0 && value <= 100, V.number);

export const optionalUrlField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine(
    (value) => !value || /^(https?:\/\/|\/)/.test(value),
    V.url,
  );

export const dateField = z
  .string({ error: V.required })
  .trim()
  .min(1, V.required)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), V.dateOfBirth)
  .transform((value) => new Date(value));

/** Converts a FormData into a plain object, dropping empty file inputs. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key.endsWith("[]")) {
      const name = key.slice(0, -2);
      const list = (result[name] as string[] | undefined) ?? [];
      list.push(value);
      result[name] = list;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Parses input against a schema, raising a translatable AppError on failure. */
export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "_form";
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  throw new AppError("errors.validation", { fieldErrors });
}
