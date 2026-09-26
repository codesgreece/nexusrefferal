import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { PayoutStatus } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth/session";
import { recordAudit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { nextReference } from "./references";
import { getSettings } from "./settings";

type Tx = Prisma.TransactionClient;

async function appendHistory(
  tx: Tx,
  payoutId: string,
  fromStatus: string | null,
  toStatus: PayoutStatus,
  actor: SessionUser | null,
  note?: string,
) {
  await tx.payoutStatusHistory.create({
    data: {
      payoutId,
      fromStatus,
      toStatus,
      note: note ?? null,
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
    },
  });
}

export type PayoutBalance = {
  availableCents: number;
  pendingCents: number;
  paidCents: number;
  lockedCents: number;
  minPayoutCents: number;
  canRequest: boolean;
  hasOpenRequest: boolean;
  hasPayoutDetails: boolean;
  availableCommissionCount: number;
};

/**
 * Available balance = approved commissions not already attached to an open or
 * paid payout. Everything is derived from commission rows, never cached.
 */
export async function getPayoutBalance(affiliateId: string): Promise<PayoutBalance> {
  const settings = await getSettings();

  const [available, pending, paid, locked, openRequest, affiliate] = await Promise.all([
    prisma.commission.aggregate({
      where: { affiliateId, status: "APPROVED", payoutId: null },
      _sum: { commissionAmountCents: true },
      _count: { _all: true },
    }),
    prisma.commission.aggregate({
      where: { affiliateId, status: "PENDING" },
      _sum: { commissionAmountCents: true },
    }),
    prisma.commission.aggregate({
      where: { affiliateId, status: "PAID" },
      _sum: { commissionAmountCents: true },
    }),
    prisma.commission.aggregate({
      where: { affiliateId, status: "APPROVED", payoutId: { not: null } },
      _sum: { commissionAmountCents: true },
    }),
    prisma.payout.findFirst({
      where: { affiliateId, status: { in: ["REQUESTED", "APPROVED"] } },
      select: { id: true },
    }),
    prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: {
        payoutMethod: true,
        payoutIban: true,
        payoutPaypalEmail: true,
        payoutOtherDetails: true,
      },
    }),
  ]);

  const availableCents = available._sum.commissionAmountCents ?? 0;
  const hasPayoutDetails = Boolean(
    affiliate?.payoutMethod &&
      ((affiliate.payoutMethod === "BANK_TRANSFER" && affiliate.payoutIban) ||
        (affiliate.payoutMethod === "PAYPAL" && affiliate.payoutPaypalEmail) ||
        (affiliate.payoutMethod === "OTHER" && affiliate.payoutOtherDetails)),
  );

  return {
    availableCents,
    pendingCents: pending._sum.commissionAmountCents ?? 0,
    paidCents: paid._sum.commissionAmountCents ?? 0,
    lockedCents: locked._sum.commissionAmountCents ?? 0,
    minPayoutCents: settings.minPayoutCents,
    hasOpenRequest: Boolean(openRequest),
    hasPayoutDetails,
    availableCommissionCount: available._count._all,
    canRequest:
      availableCents >= settings.minPayoutCents &&
      !openRequest &&
      hasPayoutDetails &&
      availableCents > 0,
  };
}

function payoutDetailsSnapshot(affiliate: {
  payoutMethod: string | null;
  payoutAccountName: string | null;
  payoutIban: string | null;
  payoutBankName: string | null;
  payoutPaypalEmail: string | null;
  payoutOtherDetails: string | null;
}) {
  return JSON.stringify({
    method: affiliate.payoutMethod,
    accountName: affiliate.payoutAccountName,
    iban: affiliate.payoutIban,
    bankName: affiliate.payoutBankName,
    paypalEmail: affiliate.payoutPaypalEmail,
    otherDetails: affiliate.payoutOtherDetails,
  });
}

/**
 * Affiliate-initiated payout request. The amount is computed from approved
 * commissions inside the transaction — the affiliate cannot choose it.
 */
export async function requestPayout(actor: SessionUser, affiliateId: string) {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
  if (!affiliate || affiliate.deletedAt) throw new AppError("errors.notFound");
  if (affiliate.status !== "ACTIVE") throw new AppError("errors.affiliateNotApproved");

  const balance = await getPayoutBalance(affiliateId);
  if (!balance.hasPayoutDetails) throw new AppError("errors.payoutDetailsMissing");
  if (balance.hasOpenRequest) throw new AppError("errors.invalidPayoutState");
  if (balance.availableCommissionCount === 0) throw new AppError("errors.noApprovedCommissions");
  if (balance.availableCents < balance.minPayoutCents) {
    throw new AppError("errors.payoutBelowMinimum");
  }

  return prisma.$transaction(async (tx) => {
    const commissions = await tx.commission.findMany({
      where: { affiliateId, status: "APPROVED", payoutId: null },
      select: { id: true, commissionAmountCents: true },
    });
    if (commissions.length === 0) throw new AppError("errors.noApprovedCommissions");

    const amountCents = commissions.reduce(
      (total, entry) => total + entry.commissionAmountCents,
      0,
    );
    const reference = await nextReference("PO", tx);

    const payout = await tx.payout.create({
      data: {
        reference,
        affiliateId,
        amountCents,
        status: "REQUESTED",
        method: affiliate.payoutMethod,
        methodDetailsSnapshot: payoutDetailsSnapshot(affiliate),
      },
    });

    // Guarded attach: only commissions still unattached are claimed.
    const attached = await tx.commission.updateMany({
      where: { id: { in: commissions.map((entry) => entry.id) }, payoutId: null, status: "APPROVED" },
      data: { payoutId: payout.id },
    });
    if (attached.count !== commissions.length) {
      throw new AppError("errors.invalidPayoutState");
    }

    await appendHistory(tx, payout.id, null, "REQUESTED", actor);
    await recordAudit(
      {
        action: "PAYOUT_REQUESTED",
        entityType: "Payout",
        entityId: payout.id,
        actor,
        newValue: {
          reference,
          amountCents,
          commissionCount: commissions.length,
          method: affiliate.payoutMethod,
        },
      },
      tx,
    );
    await notify(
      {
        userId: affiliate.userId,
        type: "PAYOUT_REQUESTED",
        params: { amount: (amountCents / 100).toFixed(2) },
        link: "/affiliate/payouts",
        severity: "INFO",
      },
      tx,
    );
    await notifyAdmins(
      {
        type: "ADMIN_PAYOUT_REQUEST",
        params: {
          name: affiliate.fullName,
          amount: (amountCents / 100).toFixed(2),
        },
        link: "/admin/payouts",
        severity: "WARNING",
      },
      tx,
    );

    return payout;
  });
}

export async function approvePayout(
  actor: SessionUser,
  input: { payoutId: string; note?: string },
) {
  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    include: { affiliate: { select: { userId: true, fullName: true } } },
  });
  if (!payout) throw new AppError("errors.notFound");
  if (payout.status !== "REQUESTED") throw new AppError("errors.invalidPayoutState");

  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payout.id },
      data: { status: "APPROVED", approvedAt: new Date(), approvedById: actor.id },
    });
    await appendHistory(tx, payout.id, payout.status, "APPROVED", actor, input.note);
    await recordAudit(
      {
        action: "PAYOUT_APPROVED",
        entityType: "Payout",
        entityId: payout.id,
        actor,
        previousValue: { status: payout.status },
        newValue: { status: "APPROVED", note: input.note ?? null },
      },
      tx,
    );
    await notify(
      {
        userId: payout.affiliate.userId,
        type: "PAYOUT_APPROVED",
        params: { amount: (payout.amountCents / 100).toFixed(2) },
        link: "/affiliate/payouts",
        severity: "SUCCESS",
      },
      tx,
    );
  });
}

export async function rejectPayout(
  actor: SessionUser,
  input: { payoutId: string; reason: string },
) {
  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    include: { affiliate: { select: { userId: true } } },
  });
  if (!payout) throw new AppError("errors.notFound");
  if (payout.status === "PAID" || payout.status === "REJECTED") {
    throw new AppError("errors.invalidPayoutState");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: input.reason,
      },
    });
    // Release the commissions so they are available again.
    await tx.commission.updateMany({
      where: { payoutId: payout.id, status: "APPROVED" },
      data: { payoutId: null },
    });
    await appendHistory(tx, payout.id, payout.status, "REJECTED", actor, input.reason);
    await recordAudit(
      {
        action: "PAYOUT_REJECTED",
        entityType: "Payout",
        entityId: payout.id,
        actor,
        previousValue: { status: payout.status },
        newValue: { status: "REJECTED", reason: input.reason },
      },
      tx,
    );
    await notify(
      {
        userId: payout.affiliate.userId,
        type: "PAYOUT_REJECTED",
        params: {
          amount: (payout.amountCents / 100).toFixed(2),
          reason: input.reason,
        },
        link: "/affiliate/payouts",
        severity: "ERROR",
      },
      tx,
    );
  });
}

export async function markPayoutPaid(
  actor: SessionUser,
  input: { payoutId: string; transactionReference: string; note?: string },
) {
  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    include: { affiliate: { select: { userId: true } } },
  });
  if (!payout) throw new AppError("errors.notFound");
  if (payout.status !== "APPROVED") throw new AppError("errors.invalidPayoutState");

  await prisma.$transaction(async (tx) => {
    const paidAt = new Date();
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "PAID",
        paidAt,
        paidById: actor.id,
        transactionReference: input.transactionReference,
        notes: input.note ?? payout.notes,
      },
    });
    await tx.commission.updateMany({
      where: { payoutId: payout.id, status: "APPROVED" },
      data: { status: "PAID", paidAt },
    });
    await appendHistory(tx, payout.id, payout.status, "PAID", actor, input.note);
    await recordAudit(
      {
        action: "PAYOUT_PAID",
        entityType: "Payout",
        entityId: payout.id,
        actor,
        previousValue: { status: payout.status },
        newValue: {
          status: "PAID",
          transactionReference: input.transactionReference,
        },
      },
      tx,
    );
    await notify(
      {
        userId: payout.affiliate.userId,
        type: "PAYOUT_PAID",
        params: {
          amount: (payout.amountCents / 100).toFixed(2),
          reference: input.transactionReference,
        },
        link: "/affiliate/payouts",
        severity: "SUCCESS",
      },
      tx,
    );
  });
}

export async function listPayouts(options: {
  affiliateId?: string;
  status?: PayoutStatus | "ALL";
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(100, Math.max(5, options.perPage ?? 20));

  const where: Prisma.PayoutWhereInput = {};
  if (options.affiliateId) where.affiliateId = options.affiliateId;
  if (options.status && options.status !== "ALL") where.status = options.status;

  const [total, rows] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      include: {
        affiliate: { select: { id: true, fullName: true, email: true } },
        _count: { select: { commissions: true } },
      },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)), rows };
}
