import "server-only";

import type { ProgramSettings, Service } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";
import { quoteCommission } from "./commissions";

export type PublicService = {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  startingPriceCents: number;
  priceFrom: boolean;
  commissionType: string;
  commissionAmountCents: number;
  commissionPercent: number | null;
};

function parseFeatures(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function localizeService(
  service: Service,
  locale: Locale,
  settings: ProgramSettings,
): PublicService {
  const quote = quoteCommission(service, service.startingPriceCents, settings);
  return {
    id: service.id,
    slug: service.slug,
    name: locale === "el" ? service.nameEl : service.nameEn,
    description: locale === "el" ? service.descriptionEl : service.descriptionEn,
    features: parseFeatures(locale === "el" ? service.featuresEl : service.featuresEn),
    startingPriceCents: service.startingPriceCents,
    priceFrom: service.priceFrom,
    commissionType: quote.type,
    commissionAmountCents: quote.amountCents,
    commissionPercent: quote.rate,
  };
}

export async function listActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

export async function listAllServices() {
  return prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

export function serviceName(
  service: { nameEn: string; nameEl: string } | null | undefined,
  locale: Locale,
): string {
  if (!service) return "—";
  return locale === "el" ? service.nameEl : service.nameEn;
}
