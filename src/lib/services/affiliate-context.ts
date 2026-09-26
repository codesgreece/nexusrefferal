import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

/** Public origin used to build the referral links shown to affiliates. */
export async function appOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:43711";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function referralUrl(origin: string, code: string) {
  return `${origin}/ref/${code}`;
}

export async function getAffiliateContext(affiliateId: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      referralCodes: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      socialProfiles: true,
      user: { select: { email: true, name: true, locale: true } },
    },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");

  const primary = affiliate.referralCodes.find((entry) => entry.isPrimary) ?? null;
  const origin = await appOrigin();

  return {
    affiliate,
    primaryCode: primary?.code ?? null,
    primaryCodeActive: primary?.isActive ?? false,
    referralUrl: primary ? referralUrl(origin, primary.code) : null,
  };
}
