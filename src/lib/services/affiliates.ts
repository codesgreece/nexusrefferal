import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { SOCIAL_PLATFORMS, type AffiliateStatus } from "@/lib/domain";
import type { affiliateRegisterSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { normalizeCode, suggestCode } from "./referral";
import { getSettings } from "./settings";

type RegisterInput = z.output<typeof affiliateRegisterSchema>;

const SOCIAL_BASE_URLS: Record<string, string> = {
  TIKTOK: "https://www.tiktok.com/@",
  INSTAGRAM: "https://www.instagram.com/",
  FACEBOOK: "https://www.facebook.com/",
  YOUTUBE: "https://www.youtube.com/@",
};

/** Accepts either a handle or a full URL and stores both consistently. */
export function normalizeSocial(platform: string, value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const handle = trimmed.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? trimmed;
    return { handle: handle.replace(/^@/, ""), url: trimmed };
  }
  const handle = trimmed.replace(/^@/, "");
  const base = SOCIAL_BASE_URLS[platform];
  return { handle, url: base ? `${base}${handle}` : null };
}

export async function registerAffiliate(input: RegisterInput) {
  const settings = await getSettings();
  if (!settings.programActive) throw new AppError("errors.programPaused");

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new AppError("errors.emailTaken", { fieldErrors: { email: "errors.emailTaken" } });
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const socials = (
    [
      ["TIKTOK", input.tiktok],
      ["INSTAGRAM", input.instagram],
      ["FACEBOOK", input.facebook],
      ["YOUTUBE", input.youtube],
    ] as const
  )
    .filter(([, value]) => Boolean(value))
    .map(([platform, value]) => {
      const { handle, url } = normalizeSocial(platform, value as string);
      return { platform, handle, url };
    });

  const affiliate = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "AFFILIATE",
        name: input.fullName,
        locale: input.locale ?? "el",
      },
    });

    const created = await tx.affiliate.create({
      data: {
        userId: user.id,
        status: "PENDING",
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        bio: input.bio,
        motivation: input.motivation,
        confirmedAdult: input.adultConfirm,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        appliedAt: now,
        socialProfiles: { create: socials },
      },
    });

    await recordAudit(
      {
        action: "AFFILIATE_APPLIED",
        entityType: "Affiliate",
        entityId: created.id,
        newValue: { email: input.email, fullName: input.fullName, status: "PENDING" },
      },
      tx,
    );

    await notifyAdmins(
      {
        type: "ADMIN_NEW_APPLICATION",
        params: { name: input.fullName },
        link: `/admin/affiliates/${created.id}`,
        severity: "INFO",
      },
      tx,
    );

    return { affiliate: created, userId: user.id };
  });

  return affiliate;
}

export async function approveAffiliate(
  actor: SessionUser,
  input: { affiliateId: string; referralCode: string; internalNotes?: string },
) {
  const code = normalizeCode(input.referralCode);
  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    throw new AppError("errors.validation", { fieldErrors: { referralCode: "validation.code" } });
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: input.affiliateId },
    include: { referralCodes: true },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status === "ACTIVE") throw new AppError("errors.validation");

  const clash = await prisma.referralCode.findUnique({ where: { code } });
  if (clash && clash.affiliateId !== affiliate.id) {
    throw new AppError("errors.referralCodeTaken", {
      fieldErrors: { referralCode: "errors.referralCodeTaken" },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedById: actor.id,
        rejectedAt: null,
        rejectionReason: null,
        suspendedAt: null,
        suspensionReason: null,
        ...(input.internalNotes ? { internalNotes: input.internalNotes } : {}),
      },
    });

    const existingPrimary = affiliate.referralCodes.find((entry) => entry.isPrimary);
    if (existingPrimary) {
      await tx.referralCode.update({
        where: { id: existingPrimary.id },
        data: { code, isActive: true, disabledAt: null },
      });
    } else {
      await tx.referralCode.create({
        data: { code, affiliateId: affiliate.id, isPrimary: true, isActive: true },
      });
    }

    await recordAudit(
      {
        action: "AFFILIATE_APPROVED",
        entityType: "Affiliate",
        entityId: affiliate.id,
        actor,
        previousValue: { status: affiliate.status },
        newValue: { status: "ACTIVE", referralCode: code },
      },
      tx,
    );

    await recordAudit(
      {
        action: existingPrimary ? "REFERRAL_CODE_CHANGED" : "REFERRAL_CODE_CREATED",
        entityType: "ReferralCode",
        entityId: affiliate.id,
        actor,
        previousValue: existingPrimary ? { code: existingPrimary.code } : undefined,
        newValue: { code },
      },
      tx,
    );

    await notify(
      {
        userId: affiliate.userId,
        type: "AFFILIATE_APPROVED",
        params: { code },
        link: "/affiliate/dashboard",
        severity: "SUCCESS",
      },
      tx,
    );
  });

  return { code };
}

export async function rejectAffiliate(
  actor: SessionUser,
  input: { affiliateId: string; reason: string },
) {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: input.affiliateId } });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");

  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: input.reason,
      },
    });
    await tx.referralCode.updateMany({
      where: { affiliateId: affiliate.id },
      data: { isActive: false, disabledAt: new Date() },
    });
    await recordAudit(
      {
        action: "AFFILIATE_REJECTED",
        entityType: "Affiliate",
        entityId: affiliate.id,
        actor,
        previousValue: { status: affiliate.status },
        newValue: { status: "REJECTED", reason: input.reason },
      },
      tx,
    );
    await notify(
      {
        userId: affiliate.userId,
        type: "AFFILIATE_REJECTED",
        params: { reason: input.reason },
        link: "/affiliate/status",
        severity: "ERROR",
      },
      tx,
    );
  });
}

export async function suspendAffiliate(
  actor: SessionUser,
  input: { affiliateId: string; reason: string },
) {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: input.affiliateId } });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status !== "ACTIVE") throw new AppError("errors.validation");

  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspensionReason: input.reason,
      },
    });
    await tx.referralCode.updateMany({
      where: { affiliateId: affiliate.id },
      data: { isActive: false, disabledAt: new Date() },
    });
    // Revoke active sessions so dashboard access stops immediately.
    await tx.session.deleteMany({ where: { userId: affiliate.userId } });
    await recordAudit(
      {
        action: "AFFILIATE_SUSPENDED",
        entityType: "Affiliate",
        entityId: affiliate.id,
        actor,
        previousValue: { status: affiliate.status },
        newValue: { status: "SUSPENDED", reason: input.reason },
      },
      tx,
    );
    await notify(
      {
        userId: affiliate.userId,
        type: "AFFILIATE_SUSPENDED",
        params: { reason: input.reason },
        link: "/affiliate/status",
        severity: "ERROR",
      },
      tx,
    );
  });
}

export async function reactivateAffiliate(actor: SessionUser, affiliateId: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: { referralCodes: { where: { isPrimary: true }, take: 1 } },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status === "ACTIVE") throw new AppError("errors.validation");

  const primary = affiliate.referralCodes[0];
  const code = primary?.code ?? (await suggestCode(affiliate.fullName));

  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        suspensionReason: null,
        rejectedAt: null,
        rejectionReason: null,
        approvedAt: affiliate.approvedAt ?? new Date(),
        approvedById: affiliate.approvedById ?? actor.id,
      },
    });
    if (primary) {
      await tx.referralCode.update({
        where: { id: primary.id },
        data: { isActive: true, disabledAt: null },
      });
    } else {
      await tx.referralCode.create({
        data: { code, affiliateId: affiliate.id, isPrimary: true, isActive: true },
      });
    }
    await recordAudit(
      {
        action: "AFFILIATE_REACTIVATED",
        entityType: "Affiliate",
        entityId: affiliate.id,
        actor,
        previousValue: { status: affiliate.status },
        newValue: { status: "ACTIVE" },
      },
      tx,
    );
    await notify(
      {
        userId: affiliate.userId,
        type: "AFFILIATE_REACTIVATED",
        params: { code },
        link: "/affiliate/dashboard",
        severity: "SUCCESS",
      },
      tx,
    );
  });
}

export async function changeReferralCode(
  actor: SessionUser,
  input: { affiliateId: string; referralCode: string },
) {
  const code = normalizeCode(input.referralCode);
  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    throw new AppError("errors.validation", { fieldErrors: { referralCode: "validation.code" } });
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: input.affiliateId },
    include: { referralCodes: { where: { isPrimary: true }, take: 1 } },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");

  const clash = await prisma.referralCode.findUnique({ where: { code } });
  if (clash && clash.affiliateId !== affiliate.id) {
    throw new AppError("errors.referralCodeTaken", {
      fieldErrors: { referralCode: "errors.referralCodeTaken" },
    });
  }

  const primary = affiliate.referralCodes[0];

  await prisma.$transaction(async (tx) => {
    if (primary) {
      await tx.referralCode.update({ where: { id: primary.id }, data: { code } });
    } else {
      await tx.referralCode.create({
        data: { code, affiliateId: affiliate.id, isPrimary: true, isActive: true },
      });
    }
    await recordAudit(
      {
        action: "REFERRAL_CODE_CHANGED",
        entityType: "ReferralCode",
        entityId: primary?.id ?? affiliate.id,
        actor,
        previousValue: primary ? { code: primary.code } : undefined,
        newValue: { code },
      },
      tx,
    );
    await notify(
      {
        userId: affiliate.userId,
        type: "REFERRAL_CODE_CHANGED",
        params: { code },
        link: "/affiliate/referral",
        severity: "INFO",
      },
      tx,
    );
  });

  return { code };
}

export async function setReferralCodeActive(
  actor: SessionUser,
  input: { referralCodeId: string; isActive: boolean },
) {
  const record = await prisma.referralCode.findUnique({ where: { id: input.referralCodeId } });
  if (!record) throw new AppError("errors.notFound");

  await prisma.$transaction(async (tx) => {
    await tx.referralCode.update({
      where: { id: record.id },
      data: {
        isActive: input.isActive,
        disabledAt: input.isActive ? null : new Date(),
      },
    });
    await recordAudit(
      {
        action: input.isActive ? "REFERRAL_CODE_ENABLED" : "REFERRAL_CODE_DISABLED",
        entityType: "ReferralCode",
        entityId: record.id,
        actor,
        previousValue: { isActive: record.isActive },
        newValue: { isActive: input.isActive },
      },
      tx,
    );
  });
}

export async function updateAffiliateDetails(
  actor: SessionUser,
  input: {
    affiliateId: string;
    fullName: string;
    phone: string;
    bio?: string;
    internalNotes?: string;
    tiktok?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  },
) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: input.affiliateId },
    include: { socialProfiles: true },
  });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");

  await prisma.$transaction(async (tx) => {
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        bio: input.bio ?? null,
        internalNotes: input.internalNotes ?? null,
      },
    });
    await tx.user.update({
      where: { id: affiliate.userId },
      data: { name: input.fullName },
    });
    await syncSocials(tx, affiliate.id, input);
    await recordAudit(
      {
        action: "AFFILIATE_UPDATED",
        entityType: "Affiliate",
        entityId: affiliate.id,
        actor,
        previousValue: {
          fullName: affiliate.fullName,
          phone: affiliate.phone,
          bio: affiliate.bio,
        },
        newValue: { fullName: input.fullName, phone: input.phone, bio: input.bio ?? null },
      },
      tx,
    );
  });
}

type SocialInput = {
  tiktok?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
};

export async function syncSocials(
  tx: Prisma.TransactionClient,
  affiliateId: string,
  input: SocialInput,
) {
  const mapping: Array<[(typeof SOCIAL_PLATFORMS)[number], string | undefined]> = [
    ["TIKTOK", input.tiktok],
    ["INSTAGRAM", input.instagram],
    ["FACEBOOK", input.facebook],
    ["YOUTUBE", input.youtube],
  ];

  for (const [platform, value] of mapping) {
    if (value) {
      const { handle, url } = normalizeSocial(platform, value);
      await tx.affiliateSocialProfile.upsert({
        where: { affiliateId_platform: { affiliateId, platform } },
        create: { affiliateId, platform, handle, url },
        update: { handle, url },
      });
    } else {
      await tx.affiliateSocialProfile.deleteMany({ where: { affiliateId, platform } });
    }
  }
}

export type AffiliateListFilters = {
  query?: string;
  status?: AffiliateStatus | "ALL";
  page?: number;
  perPage?: number;
  sort?: "newest" | "oldest" | "name" | "earnings";
};

export async function listAffiliates(filters: AffiliateListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(5, filters.perPage ?? 20));
  const query = filters.query?.trim();

  const where = {
    deletedAt: null,
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(query
      ? {
          OR: [
            { fullName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { referralCodes: { some: { code: { contains: query.toUpperCase() } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.affiliate.count({ where }),
    prisma.affiliate.findMany({
      where,
      include: {
        referralCodes: { where: { isPrimary: true }, take: 1 },
        _count: { select: { leads: true, sales: true, commissions: true } },
      },
      orderBy:
        filters.sort === "oldest"
          ? { appliedAt: "asc" }
          : filters.sort === "name"
            ? { fullName: "asc" }
            : { appliedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const earnings = rows.length
    ? await prisma.commission.groupBy({
        by: ["affiliateId"],
        where: {
          affiliateId: { in: rows.map((row) => row.id) },
          status: { in: ["APPROVED", "PAID"] },
        },
        _sum: { commissionAmountCents: true },
      })
    : [];
  const earningsMap = new Map(
    earnings.map((row) => [row.affiliateId, row._sum.commissionAmountCents ?? 0]),
  );

  return {
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    rows: rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      status: row.status as AffiliateStatus,
      appliedAt: row.appliedAt,
      approvedAt: row.approvedAt,
      code: row.referralCodes[0]?.code ?? null,
      codeActive: row.referralCodes[0]?.isActive ?? false,
      leadCount: row._count.leads,
      saleCount: row._count.sales,
      commissionCount: row._count.commissions,
      earningsCents: earningsMap.get(row.id) ?? 0,
    })),
  };
}

/** Options for affiliate pickers. Only active affiliates can be attributed. */
export async function activeAffiliateOptions() {
  const rows = await prisma.affiliate.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    include: { referralCodes: { where: { isPrimary: true, isActive: true }, take: 1 } },
    orderBy: { fullName: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.fullName,
    email: row.email,
    code: row.referralCodes[0]?.code ?? null,
    referralCodeId: row.referralCodes[0]?.id ?? null,
  }));
}
