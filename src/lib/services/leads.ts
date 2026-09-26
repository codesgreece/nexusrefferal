import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { like } from "./query";
import { AppError } from "@/lib/errors";
import { parseEurosToCents } from "@/lib/money";
import type { AttributionMethod, LeadStatus } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth/session";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { nextReference } from "./references";
import { NO_ATTRIBUTION, resolveAttributionForLead, resolveCode } from "./referral";
import { getSettings } from "./settings";

export type PublicLeadInput = {
  customerName: string;
  businessName?: string;
  email: string;
  phone?: string;
  serviceId?: string;
  message: string;
  referralCode?: string;
  cookieCode?: string | null;
};

/**
 * Creates a lead from the public contact form. Attribution is resolved
 * server-side: an invalid explicit referral code is a validation error, an
 * absent one simply produces an unattributed lead for manual review.
 */
export async function createPublicLead(input: PublicLeadInput) {
  const settings = await getSettings();

  const attribution = await resolveAttributionForLead({
    explicitCode: input.referralCode,
    cookieCode: input.cookieCode,
    source: input.referralCode ? "public-form-code" : "public-form-link",
  }).catch((error) => {
    if (error instanceof AppError && error.key === "errors.referralCodeInvalid") {
      throw new AppError("errors.referralCodeInvalid", {
        fieldErrors: { referralCode: "errors.referralCodeInvalid" },
      });
    }
    throw error;
  });

  // Self-referral guard: an affiliate cannot submit a lead with their own code.
  if (attribution.affiliateId) {
    const owner = await prisma.affiliate.findUnique({
      where: { id: attribution.affiliateId },
      select: { email: true },
    });
    if (owner && owner.email.toLowerCase() === input.email.toLowerCase()) {
      throw new AppError("errors.selfReferral", {
        fieldErrors: { referralCode: "errors.selfReferral" },
      });
    }
  }

  const serviceId = input.serviceId
    ? (
        await prisma.service.findFirst({
          where: { id: input.serviceId, isActive: true },
          select: { id: true },
        })
      )?.id ?? null
    : null;

  const lead = await prisma.$transaction(async (tx) => {
    const reference = await nextReference("LD", tx);
    const created = await tx.lead.create({
      data: {
        reference,
        customerName: input.customerName,
        businessName: input.businessName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        message: input.message,
        serviceId,
        status: "NEW",
        origin: "PUBLIC_FORM",
        affiliateId: attribution.affiliateId,
        referralCodeId: attribution.referralCodeId,
        referralCodeRaw: attribution.referralCodeRaw,
        attributionMethod: attribution.attributionMethod,
        attributedAt: attribution.attributedAt,
        attributionSource: attribution.attributionSource,
      },
      include: { affiliate: { select: { userId: true, fullName: true } } },
    });

    await recordAudit(
      {
        action: "LEAD_CREATED",
        entityType: "Lead",
        entityId: created.id,
        newValue: {
          reference,
          email: input.email,
          affiliateId: attribution.affiliateId,
          attributionMethod: attribution.attributionMethod,
          referralCode: attribution.referralCodeRaw,
        },
      },
      tx,
    );

    await notifyAdmins(
      {
        type: "ADMIN_NEW_LEAD",
        params: {
          customer: input.customerName,
          attribution: attribution.referralCodeRaw
            ? ` (${attribution.referralCodeRaw})`
            : "",
        },
        link: `/admin/leads?q=${encodeURIComponent(reference)}`,
        severity: "INFO",
      },
      tx,
    );

    if (created.affiliate && attribution.affiliateId) {
      await notify(
        {
          userId: created.affiliate.userId,
          type: "LEAD_ATTRIBUTED",
          params: {
            customer: input.customerName,
            method: attribution.attributionMethod ?? "",
          },
          link: "/affiliate/leads",
          severity: "SUCCESS",
        },
        tx,
      );
    }

    return created;
  });

  return {
    reference: lead.reference,
    attributed: Boolean(attribution.affiliateId),
    affiliateName: lead.affiliate?.fullName ?? null,
    cookieDays: settings.referralCookieDays,
  };
}

type AdminLeadInput = {
  customerName: string;
  businessName?: string;
  email: string;
  phone?: string;
  serviceId?: string;
  message?: string;
  status: LeadStatus;
  estimatedAmount?: string;
  internalNotes?: string;
  affiliateId?: string;
  attributionMethod?: AttributionMethod;
  attributionSource?: string;
  attributionNotes?: string;
};

async function resolveManualAttribution(
  affiliateId: string | undefined,
  method: AttributionMethod | undefined,
) {
  if (!affiliateId) return { ...NO_ATTRIBUTION };

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: { referralCodes: { where: { isPrimary: true }, take: 1 } },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status !== "ACTIVE") throw new AppError("errors.affiliateNotApproved");

  const primary = affiliate.referralCodes[0] ?? null;
  return {
    affiliateId: affiliate.id,
    referralCodeId: primary?.id ?? null,
    referralCodeRaw: primary?.code ?? null,
    attributionMethod: method ?? "MANUAL",
    attributedAt: new Date(),
    attributionSource: null as string | null,
  };
}

export async function createAdminLead(actor: SessionUser, input: AdminLeadInput) {
  const attribution = await resolveManualAttribution(input.affiliateId, input.attributionMethod);
  const estimatedAmountCents = input.estimatedAmount
    ? parseEurosToCents(input.estimatedAmount)
    : null;

  return prisma.$transaction(async (tx) => {
    const reference = await nextReference("LD", tx);
    const lead = await tx.lead.create({
      data: {
        reference,
        customerName: input.customerName,
        businessName: input.businessName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        message: input.message ?? null,
        serviceId: input.serviceId ?? null,
        status: input.status,
        origin: "ADMIN",
        createdByUserId: actor.id,
        estimatedAmountCents,
        internalNotes: input.internalNotes ?? null,
        affiliateId: attribution.affiliateId,
        referralCodeId: attribution.referralCodeId,
        referralCodeRaw: attribution.referralCodeRaw,
        attributionMethod: attribution.attributionMethod,
        attributedAt: attribution.attributedAt,
        attributionSource: input.attributionSource ?? attribution.attributionSource,
        attributionNotes: input.attributionNotes ?? null,
      },
      include: { affiliate: { select: { userId: true } } },
    });

    await recordAudit(
      {
        action: "LEAD_CREATED",
        entityType: "Lead",
        entityId: lead.id,
        actor,
        newValue: {
          reference,
          email: input.email,
          status: input.status,
          affiliateId: attribution.affiliateId,
          attributionMethod: attribution.attributionMethod,
          referralCode: attribution.referralCodeRaw,
          attributionSource: input.attributionSource ?? null,
        },
      },
      tx,
    );

    if (lead.affiliate) {
      await notify(
        {
          userId: lead.affiliate.userId,
          type: "LEAD_ATTRIBUTED",
          params: {
            customer: input.customerName,
            method: attribution.attributionMethod ?? "MANUAL",
          },
          link: "/affiliate/leads",
          severity: "SUCCESS",
        },
        tx,
      );
    }

    return lead;
  });
}

export async function updateLead(
  actor: SessionUser,
  input: AdminLeadInput & { leadId: string },
) {
  const existing = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!existing || existing.deletedAt) throw new AppError("errors.notFound");

  const attributionChanged = (input.affiliateId ?? null) !== existing.affiliateId;
  const attribution = attributionChanged
    ? await resolveManualAttribution(input.affiliateId, input.attributionMethod)
    : {
        affiliateId: existing.affiliateId,
        referralCodeId: existing.referralCodeId,
        referralCodeRaw: existing.referralCodeRaw,
        attributionMethod: input.attributionMethod ?? existing.attributionMethod,
        attributedAt: existing.attributedAt,
        attributionSource: existing.attributionSource,
      };

  const estimatedAmountCents = input.estimatedAmount
    ? parseEurosToCents(input.estimatedAmount)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: existing.id },
      data: {
        customerName: input.customerName,
        businessName: input.businessName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        message: input.message ?? null,
        serviceId: input.serviceId ?? null,
        status: input.status,
        estimatedAmountCents,
        internalNotes: input.internalNotes ?? null,
        affiliateId: attribution.affiliateId,
        referralCodeId: attribution.referralCodeId,
        referralCodeRaw: attribution.referralCodeRaw,
        attributionMethod: attribution.attributionMethod,
        attributedAt: attribution.attributedAt,
        attributionSource: input.attributionSource ?? attribution.attributionSource,
        attributionNotes: input.attributionNotes ?? null,
      },
    });

    await recordAudit(
      {
        action: attributionChanged ? "LEAD_REASSIGNED" : "LEAD_UPDATED",
        entityType: "Lead",
        entityId: existing.id,
        actor,
        previousValue: {
          status: existing.status,
          affiliateId: existing.affiliateId,
          attributionMethod: existing.attributionMethod,
          email: existing.email,
        },
        newValue: {
          status: input.status,
          affiliateId: attribution.affiliateId,
          attributionMethod: attribution.attributionMethod,
          email: input.email,
        },
      },
      tx,
    );

    if (attributionChanged && attribution.affiliateId) {
      const affiliate = await tx.affiliate.findUnique({
        where: { id: attribution.affiliateId },
        select: { userId: true },
      });
      if (affiliate) {
        await notify(
          {
            userId: affiliate.userId,
            type: "LEAD_ATTRIBUTED",
            params: {
              customer: input.customerName,
              method: attribution.attributionMethod ?? "MANUAL",
            },
            link: "/affiliate/leads",
            severity: "SUCCESS",
          },
          tx,
        );
      }
    }
  });
}

/** Manual attribution — the path used for DMs, comments and phone referrals. */
export async function assignLead(
  actor: SessionUser,
  input: {
    leadId: string;
    affiliateId?: string;
    attributionMethod?: AttributionMethod;
    attributionSource?: string;
    attributionNotes?: string;
  },
) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead || lead.deletedAt) throw new AppError("errors.notFound");

  const attribution = await resolveManualAttribution(
    input.affiliateId,
    input.attributionMethod,
  );

  if (attribution.affiliateId) {
    const owner = await prisma.affiliate.findUnique({
      where: { id: attribution.affiliateId },
      select: { email: true },
    });
    if (owner && owner.email.toLowerCase() === lead.email.toLowerCase()) {
      throw new AppError("errors.selfReferral");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        affiliateId: attribution.affiliateId,
        referralCodeId: attribution.referralCodeId,
        referralCodeRaw: attribution.referralCodeRaw,
        attributionMethod: attribution.attributionMethod,
        attributedAt: attribution.attributedAt,
        attributionSource: input.attributionSource ?? null,
        attributionNotes: input.attributionNotes ?? null,
      },
    });

    // Keep any customer created from this lead aligned with the attribution.
    if (lead.customerId) {
      await tx.customer.update({
        where: { id: lead.customerId },
        data: {
          affiliateId: attribution.affiliateId,
          referralCodeId: attribution.referralCodeId,
          referralCode: attribution.referralCodeRaw,
        },
      });
    }

    await recordAudit(
      {
        action: lead.affiliateId ? "LEAD_REASSIGNED" : "LEAD_ASSIGNED",
        entityType: "Lead",
        entityId: lead.id,
        actor,
        previousValue: {
          affiliateId: lead.affiliateId,
          referralCode: lead.referralCodeRaw,
          attributionMethod: lead.attributionMethod,
        },
        newValue: {
          affiliateId: attribution.affiliateId,
          referralCode: attribution.referralCodeRaw,
          attributionMethod: attribution.attributionMethod,
          attributionSource: input.attributionSource ?? null,
          attributionNotes: input.attributionNotes ?? null,
        },
      },
      tx,
    );

    if (attribution.affiliateId && attribution.affiliateId !== lead.affiliateId) {
      const affiliate = await tx.affiliate.findUnique({
        where: { id: attribution.affiliateId },
        select: { userId: true },
      });
      if (affiliate) {
        await notify(
          {
            userId: affiliate.userId,
            type: "LEAD_ATTRIBUTED",
            params: {
              customer: lead.customerName,
              method: attribution.attributionMethod ?? "MANUAL",
            },
            link: "/affiliate/leads",
            severity: "SUCCESS",
          },
          tx,
        );
      }
    }
  });
}

export async function changeLeadStatus(
  actor: SessionUser,
  input: { leadId: string; status: LeadStatus },
) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead || lead.deletedAt) throw new AppError("errors.notFound");
  if (lead.status === input.status) return;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: lead.id }, data: { status: input.status } });
    await recordAudit(
      {
        action: "LEAD_STATUS_CHANGED",
        entityType: "Lead",
        entityId: lead.id,
        actor,
        previousValue: { status: lead.status },
        newValue: { status: input.status },
      },
      tx,
    );
  });
}

export async function deleteLead(actor: SessionUser, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { _count: { select: { sales: true } } },
  });
  if (!lead || lead.deletedAt) throw new AppError("errors.notFound");
  if (lead._count.sales > 0) throw new AppError("errors.cannotDeleteWithSales");

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: lead.id }, data: { deletedAt: new Date() } });
    await recordAudit(
      {
        action: "LEAD_DELETED",
        entityType: "Lead",
        entityId: lead.id,
        actor,
        previousValue: { reference: lead.reference, email: lead.email },
      },
      tx,
    );
  });
}

export type LeadFilters = {
  query?: string;
  status?: LeadStatus | "ALL";
  affiliateId?: string | "ALL";
  attributionMethod?: AttributionMethod | "ALL";
  referralCode?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
  sort?: "newest" | "oldest";
};

export function buildLeadWhere(filters: LeadFilters, scopedAffiliateId?: string) {
  const query = filters.query?.trim();
  const where: Prisma.LeadWhereInput = { deletedAt: null };

  if (scopedAffiliateId) where.affiliateId = scopedAffiliateId;
  else if (filters.affiliateId && filters.affiliateId !== "ALL") {
    where.affiliateId = filters.affiliateId === "NONE" ? null : filters.affiliateId;
  }

  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.attributionMethod && filters.attributionMethod !== "ALL") {
    where.attributionMethod = filters.attributionMethod;
  }
  if (filters.referralCode?.trim()) {
    where.referralCodeRaw = like(filters.referralCode.trim().toUpperCase());
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }
  if (query) {
    where.OR = [
      { reference: like(query) },
      { customerName: like(query) },
      { businessName: like(query) },
      { email: like(query) },
      { phone: like(query) },
      { referralCodeRaw: like(query) },
    ];
  }
  return where;
}

export async function listLeads(filters: LeadFilters, scopedAffiliateId?: string) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(5, filters.perPage ?? 20));
  const where = buildLeadWhere(filters, scopedAffiliateId);

  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: {
        service: { select: { id: true, nameEn: true, nameEl: true } },
        affiliate: { select: { id: true, fullName: true } },
        customer: { select: { id: true, fullName: true } },
        sales: {
          where: { deletedAt: null },
          select: {
            id: true,
            amountCents: true,
            paymentStatus: true,
            commission: {
              select: { id: true, commissionAmountCents: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    rows,
  };
}
