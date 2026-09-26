import "server-only";

import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { AttributionMethod } from "@/lib/domain";
import { hashIp } from "@/lib/rate-limit";

export const REFERRAL_COOKIE = "nds_ref";
export const VISITOR_COOKIE = "nds_vid";

/** Referral codes are case-insensitive: they are normalized on every path. */
export function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidCodeShape(code: string): boolean {
  return /^[A-Z0-9]{3,20}$/.test(code);
}

export type ResolvedReferral = {
  referralCodeId: string;
  code: string;
  affiliateId: string;
  affiliateName: string;
};

/**
 * Looks up a referral code. Only codes that are active AND belong to an active
 * affiliate resolve — a suspended affiliate stops receiving new attribution.
 */
export async function resolveCode(
  rawCode: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<ResolvedReferral | null> {
  const code = normalizeCode(rawCode);
  if (!isValidCodeShape(code)) return null;

  const record = await client.referralCode.findUnique({
    where: { code },
    include: { affiliate: { select: { id: true, fullName: true, status: true, deletedAt: true } } },
  });

  if (!record || !record.isActive) return null;
  if (record.affiliate.deletedAt) return null;
  if (record.affiliate.status !== "ACTIVE") return null;

  return {
    referralCodeId: record.id,
    code: record.code,
    affiliateId: record.affiliate.id,
    affiliateName: record.affiliate.fullName,
  };
}

export async function requireCode(rawCode: string): Promise<ResolvedReferral> {
  const resolved = await resolveCode(rawCode);
  if (!resolved) throw new AppError("errors.referralCodeInvalid");
  return resolved;
}

/** Generates a unique code from a display name, falling back to a suffix. */
export async function suggestCode(fullName: string): Promise<string> {
  const base =
    normalizeCode(
      fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)[0] ?? "",
    ).slice(0, 12) || "NEXUS";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    if (!isValidCodeShape(candidate)) continue;
    const taken = await prisma.referralCode.findUnique({ where: { code: candidate } });
    if (!taken) return candidate;
  }
  return `${base}${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

function deviceTypeFrom(userAgent: string | null): string {
  if (!userAgent) return "UNKNOWN";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "TABLET";
  if (/mobi|iphone|android/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

export type ClickInput = {
  code: string;
  landingPath?: string | null;
  source?: string | null;
  campaign?: string | null;
  medium?: string | null;
  referer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  visitorId?: string | null;
};

/** Records a referral link visit. Unknown or inactive codes are ignored. */
export async function recordClick(input: ClickInput): Promise<ResolvedReferral | null> {
  const resolved = await resolveCode(input.code);
  if (!resolved) return null;

  await prisma.referralClick.create({
    data: {
      referralCodeId: resolved.referralCodeId,
      affiliateId: resolved.affiliateId,
      code: resolved.code,
      landingPath: input.landingPath ?? null,
      source: input.source ?? null,
      campaign: input.campaign ?? null,
      medium: input.medium ?? null,
      referer: input.referer ?? null,
      userAgent: input.userAgent ?? null,
      deviceType: deviceTypeFrom(input.userAgent ?? null),
      ipHash: hashIp(input.ip ?? null),
      visitorId: input.visitorId ?? null,
    },
  });

  return resolved;
}

/** Reads the attribution cookie set by /ref/[code]. */
export async function readReferralCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(REFERRAL_COOKIE)?.value;
  if (!value) return null;
  const code = normalizeCode(value);
  return isValidCodeShape(code) ? code : null;
}

export type AttributionResult = {
  affiliateId: string | null;
  referralCodeId: string | null;
  referralCodeRaw: string | null;
  attributionMethod: AttributionMethod | null;
  attributedAt: Date | null;
  attributionSource: string | null;
};

export const NO_ATTRIBUTION: AttributionResult = {
  affiliateId: null,
  referralCodeId: null,
  referralCodeRaw: null,
  attributionMethod: null,
  attributedAt: null,
  attributionSource: null,
};

/**
 * Attribution priority, in order:
 *   1. an explicit referral code supplied by the customer
 *   2. the referral cookie set by a referral link visit
 *   3. nothing — an administrator attributes manually later
 *
 * The function never guesses: if neither source resolves to an active code of
 * an active affiliate, the lead is created unattributed.
 */
export async function resolveAttributionForLead(options: {
  explicitCode?: string | null;
  cookieCode?: string | null;
  source?: string | null;
}): Promise<AttributionResult> {
  const explicit = options.explicitCode?.trim();
  if (explicit) {
    const resolved = await resolveCode(explicit);
    if (!resolved) throw new AppError("errors.referralCodeInvalid");
    return {
      affiliateId: resolved.affiliateId,
      referralCodeId: resolved.referralCodeId,
      referralCodeRaw: resolved.code,
      attributionMethod: "REFERRAL_CODE",
      attributedAt: new Date(),
      attributionSource: options.source ?? null,
    };
  }

  const cookieCode = options.cookieCode?.trim();
  if (cookieCode) {
    const resolved = await resolveCode(cookieCode);
    if (resolved) {
      return {
        affiliateId: resolved.affiliateId,
        referralCodeId: resolved.referralCodeId,
        referralCodeRaw: resolved.code,
        attributionMethod: "REFERRAL_LINK",
        attributedAt: new Date(),
        attributionSource: options.source ?? "referral-link",
      };
    }
  }

  return NO_ATTRIBUTION;
}
