import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { like } from "./query";
import { AppError } from "@/lib/errors";
import type { AttributionMethod, CustomerStatus } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth/session";
import { recordAudit } from "./audit";

export type DuplicateMatch = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  matchedOn: Array<"email" | "phone">;
};

/**
 * Duplicate detection runs before every customer create. It never silently
 * merges or blocks: the administrator is shown the match and decides.
 */
export async function findDuplicates(
  email: string,
  phone?: string | null,
  excludeId?: string,
): Promise<DuplicateMatch[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone?.replace(/[\s()./-]/g, "") ?? null;

  const candidates = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { email: normalizedEmail },
        ...(normalizedPhone && normalizedPhone.length >= 6
          ? [{ phone: like(normalizedPhone.slice(-9)) }]
          : []),
      ],
    },
    select: { id: true, fullName: true, email: true, phone: true },
    take: 5,
  });

  return candidates.map((candidate) => {
    const matchedOn: Array<"email" | "phone"> = [];
    if (candidate.email === normalizedEmail) matchedOn.push("email");
    if (
      normalizedPhone &&
      candidate.phone &&
      candidate.phone.replace(/[\s()./-]/g, "").endsWith(normalizedPhone.slice(-9))
    ) {
      matchedOn.push("phone");
    }
    return { ...candidate, matchedOn };
  });
}

type CustomerInput = {
  fullName: string;
  businessName?: string;
  email: string;
  phone?: string;
  serviceId?: string;
  affiliateId?: string;
  attributionMethod?: AttributionMethod;
  source?: string;
  status: CustomerStatus;
  internalNotes?: string;
};

async function resolveAffiliateCode(affiliateId?: string) {
  if (!affiliateId) {
    return { affiliateId: null, referralCodeId: null, referralCode: null };
  }
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: { referralCodes: { where: { isPrimary: true }, take: 1 } },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status !== "ACTIVE") throw new AppError("errors.affiliateNotApproved");
  return {
    affiliateId: affiliate.id,
    referralCodeId: affiliate.referralCodes[0]?.id ?? null,
    referralCode: affiliate.referralCodes[0]?.code ?? null,
  };
}

export async function createCustomer(
  actor: SessionUser,
  input: CustomerInput & { acknowledgeDuplicate?: boolean },
) {
  const duplicates = await findDuplicates(input.email, input.phone);
  if (duplicates.length > 0 && !input.acknowledgeDuplicate) {
    throw new AppError("errors.duplicateCustomer", {
      detail: JSON.stringify(duplicates),
    });
  }

  const attribution = await resolveAffiliateCode(input.affiliateId);

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        fullName: input.fullName,
        businessName: input.businessName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        serviceId: input.serviceId ?? null,
        status: input.status,
        source: input.source ?? null,
        internalNotes: input.internalNotes ?? null,
        createdByUserId: actor.id,
        ...attribution,
      },
    });

    await recordAudit(
      {
        action: "CUSTOMER_CREATED",
        entityType: "Customer",
        entityId: customer.id,
        actor,
        newValue: {
          email: customer.email,
          fullName: customer.fullName,
          affiliateId: attribution.affiliateId,
          referralCode: attribution.referralCode,
          acknowledgedDuplicates: duplicates.length > 0 ? duplicates.map((d) => d.id) : undefined,
        },
      },
      tx,
    );

    return customer;
  });
}

export async function updateCustomer(
  actor: SessionUser,
  input: CustomerInput & { customerId: string },
) {
  const existing = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!existing || existing.deletedAt) throw new AppError("errors.notFound");

  const attribution =
    (input.affiliateId ?? null) === existing.affiliateId
      ? {
          affiliateId: existing.affiliateId,
          referralCodeId: existing.referralCodeId,
          referralCode: existing.referralCode,
        }
      : await resolveAffiliateCode(input.affiliateId);

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: existing.id },
      data: {
        fullName: input.fullName,
        businessName: input.businessName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        serviceId: input.serviceId ?? null,
        status: input.status,
        source: input.source ?? null,
        internalNotes: input.internalNotes ?? null,
        ...attribution,
      },
    });

    await recordAudit(
      {
        action: "CUSTOMER_UPDATED",
        entityType: "Customer",
        entityId: existing.id,
        actor,
        previousValue: {
          fullName: existing.fullName,
          email: existing.email,
          status: existing.status,
          affiliateId: existing.affiliateId,
        },
        newValue: {
          fullName: input.fullName,
          email: input.email,
          status: input.status,
          affiliateId: attribution.affiliateId,
        },
      },
      tx,
    );
  });
}

export async function deleteCustomer(actor: SessionUser, customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { _count: { select: { sales: true } } },
  });
  if (!customer || customer.deletedAt) throw new AppError("errors.notFound");
  if (customer._count.sales > 0) throw new AppError("errors.cannotDeleteWithSales");

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customer.id },
      data: { deletedAt: new Date() },
    });
    await recordAudit(
      {
        action: "CUSTOMER_DELETED",
        entityType: "Customer",
        entityId: customer.id,
        actor,
        previousValue: { email: customer.email, fullName: customer.fullName },
      },
      tx,
    );
  });
}

/** Creates a customer from a lead while preserving the referral attribution. */
export async function convertLeadToCustomer(
  actor: SessionUser,
  input: { leadId: string; acknowledgeDuplicate?: boolean },
) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead || lead.deletedAt) throw new AppError("errors.notFound");
  if (lead.customerId) {
    return { customerId: lead.customerId, alreadyConverted: true };
  }

  const duplicates = await findDuplicates(lead.email, lead.phone);
  if (duplicates.length > 0 && !input.acknowledgeDuplicate) {
    throw new AppError("errors.duplicateCustomer", {
      detail: JSON.stringify(duplicates),
    });
  }

  // Reuse the existing record when the administrator acknowledged the match.
  const reusable = duplicates.find((candidate) => candidate.matchedOn.includes("email"));

  const result = await prisma.$transaction(async (tx) => {
    let customerId: string;

    if (reusable) {
      customerId = reusable.id;
      await tx.customer.update({
        where: { id: reusable.id },
        data: {
          businessName: lead.businessName ?? undefined,
          serviceId: lead.serviceId ?? undefined,
          ...(lead.affiliateId
            ? {
                affiliateId: lead.affiliateId,
                referralCodeId: lead.referralCodeId,
                referralCode: lead.referralCodeRaw,
              }
            : {}),
        },
      });
    } else {
      const created = await tx.customer.create({
        data: {
          fullName: lead.customerName,
          businessName: lead.businessName,
          email: lead.email,
          phone: lead.phone,
          serviceId: lead.serviceId,
          affiliateId: lead.affiliateId,
          referralCodeId: lead.referralCodeId,
          referralCode: lead.referralCodeRaw,
          source: lead.attributionSource ?? lead.attributionMethod,
          status: "ACTIVE",
          createdByUserId: actor.id,
        },
      });
      customerId = created.id;
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        customerId,
        status: lead.status === "NEW" || lead.status === "CONTACTED" ? "QUALIFIED" : lead.status,
      },
    });

    await recordAudit(
      {
        action: "CUSTOMER_CREATED",
        entityType: "Customer",
        entityId: customerId,
        actor,
        newValue: {
          fromLead: lead.reference,
          email: lead.email,
          reusedExisting: Boolean(reusable),
          affiliateId: lead.affiliateId,
        },
      },
      tx,
    );

    return { customerId, alreadyConverted: false };
  });

  return result;
}

export type CustomerFilters = {
  query?: string;
  status?: CustomerStatus | "ALL";
  affiliateId?: string | "ALL";
  page?: number;
  perPage?: number;
};

export async function listCustomers(filters: CustomerFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(5, filters.perPage ?? 20));
  const query = filters.query?.trim();

  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.affiliateId && filters.affiliateId !== "ALL") {
    where.affiliateId = filters.affiliateId === "NONE" ? null : filters.affiliateId;
  }
  if (query) {
    where.OR = [
      { fullName: like(query) },
      { businessName: like(query) },
      { email: like(query) },
      { phone: like(query) },
      { referralCode: like(query) },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: {
        service: { select: { nameEn: true, nameEl: true } },
        affiliate: { select: { id: true, fullName: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)), rows };
}
