import "server-only";

import type { Prisma, ProgramSettings, Sale, Service } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { percentOf } from "@/lib/money";
import type { CommissionType } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth/session";
import { recordAudit } from "./audit";
import { notify } from "./notifications";

type Tx = Prisma.TransactionClient;

export type CommissionQuote = {
  amountCents: number;
  type: CommissionType;
  rate: number | null;
};

/**
 * Commission is always derived server-side from the service configuration and
 * the stored sale amount. Client-supplied commission values are never trusted.
 *
 * The domain fee is excluded from the commission base: commission is earned on
 * the service, not on pass-through costs.
 */
export function quoteCommission(
  service: Pick<
    Service,
    "commissionType" | "commissionFixedCents" | "commissionPercent"
  >,
  serviceAmountCents: number,
  settings: Pick<
    ProgramSettings,
    "defaultCommissionType" | "defaultCommissionFixedCents" | "defaultCommissionPercent"
  >,
): CommissionQuote {
  const type = (service.commissionType ||
    settings.defaultCommissionType) as CommissionType;

  if (type === "PERCENT") {
    const percent = service.commissionPercent ?? settings.defaultCommissionPercent;
    return {
      amountCents: Math.max(0, percentOf(serviceAmountCents, percent)),
      type: "PERCENT",
      rate: percent,
    };
  }

  const fixed = service.commissionFixedCents ?? settings.defaultCommissionFixedCents;
  return { amountCents: Math.max(0, fixed), type: "FIXED", rate: null };
}

/** The base amount commission is calculated on, excluding the domain fee. */
export function commissionBase(sale: Pick<Sale, "amountCents">): number {
  return sale.amountCents;
}

/**
 * Creates the commission for a paid sale exactly once.
 *
 * Idempotency comes from the `Commission.saleId` unique constraint: a second
 * concurrent attempt fails with P2002 and is treated as a no-op rather than an
 * error, so double payment confirmations can never double-pay an affiliate.
 *
 * Must be called inside a transaction together with the payment confirmation.
 */
export async function generateCommissionForSale(
  tx: Tx,
  saleId: string,
  actor: SessionUser | null,
): Promise<{ created: boolean; commissionId: string | null }> {
  const sale = await tx.sale.findUnique({
    where: { id: saleId },
    include: {
      service: true,
      customer: { select: { id: true, fullName: true } },
      affiliate: { select: { id: true, userId: true, status: true } },
      commission: { select: { id: true } },
    },
  });

  if (!sale) throw new AppError("errors.notFound");
  if (sale.paymentStatus !== "PAID") throw new AppError("errors.saleNotPaid");

  // No valid attribution means nobody earned anything. Not an error.
  if (!sale.affiliateId || !sale.affiliate) {
    return { created: false, commissionId: null };
  }
  // A suspended or rejected affiliate does not earn new commission.
  if (sale.affiliate.status !== "ACTIVE") {
    return { created: false, commissionId: null };
  }
  if (sale.commission) {
    return { created: false, commissionId: sale.commission.id };
  }

  const settings = await tx.programSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });
  const quote = quoteCommission(sale.service, commissionBase(sale), settings);

  if (quote.amountCents <= 0) {
    return { created: false, commissionId: null };
  }

  try {
    const commission = await tx.commission.create({
      data: {
        saleId: sale.id,
        affiliateId: sale.affiliateId,
        customerId: sale.customerId,
        serviceId: sale.serviceId,
        saleAmountCents: sale.amountCents,
        commissionAmountCents: quote.amountCents,
        commissionType: quote.type,
        commissionRate: quote.rate,
        referralCode: sale.referralCode,
        attributionMethod: sale.attributionMethod,
        status: "PENDING",
      },
    });

    await recordAudit(
      {
        action: "COMMISSION_CREATED",
        entityType: "Commission",
        entityId: commission.id,
        actor,
        newValue: {
          saleId: sale.id,
          affiliateId: sale.affiliateId,
          commissionAmountCents: quote.amountCents,
          commissionType: quote.type,
          commissionRate: quote.rate,
          status: "PENDING",
        },
      },
      tx,
    );

    await notify(
      {
        userId: sale.affiliate.userId,
        type: "COMMISSION_CREATED",
        params: {
          amount: (quote.amountCents / 100).toFixed(2),
          customer: sale.customer.fullName,
        },
        link: "/affiliate/commissions",
        severity: "INFO",
      },
      tx,
    );

    return { created: true, commissionId: commission.id };
  } catch (error) {
    // Unique violation on saleId: another writer got there first.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const existing = await tx.commission.findUnique({
        where: { saleId: sale.id },
        select: { id: true },
      });
      return { created: false, commissionId: existing?.id ?? null };
    }
    throw error;
  }
}

/**
 * Cancels every commission attached to a sale that is not already paid. Used
 * when an order is refunded or cancelled.
 */
export async function cancelCommissionForSale(
  tx: Tx,
  saleId: string,
  reason: string,
  actor: SessionUser | null,
) {
  const commission = await tx.commission.findUnique({
    where: { saleId },
    include: { affiliate: { select: { userId: true } } },
  });
  if (!commission) return;
  if (commission.status === "PAID" || commission.status === "CANCELLED") return;

  await tx.commission.update({
    where: { id: commission.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
      payoutId: null,
    },
  });

  await recordAudit(
    {
      action: "COMMISSION_CANCELLED",
      entityType: "Commission",
      entityId: commission.id,
      actor,
      previousValue: { status: commission.status },
      newValue: { status: "CANCELLED", reason },
    },
    tx,
  );

  await notify(
    {
      userId: commission.affiliate.userId,
      type: "COMMISSION_CANCELLED",
      params: {
        amount: (commission.commissionAmountCents / 100).toFixed(2),
        reason,
      },
      link: "/affiliate/commissions",
      severity: "WARNING",
    },
    tx,
  );
}

export type CommissionTotals = {
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  rejectedCents: number;
  cancelledCents: number;
  earnedCents: number;
  count: number;
};

/** Grouped sums for an affiliate, or the whole program when omitted. */
export async function commissionTotals(
  affiliateId?: string,
): Promise<CommissionTotals> {
  const rows = await prisma.commission.groupBy({
    by: ["status"],
    where: affiliateId ? { affiliateId } : undefined,
    _sum: { commissionAmountCents: true },
    _count: { _all: true },
  });

  const byStatus = new Map(
    rows.map((row) => [
      row.status,
      { sum: row._sum.commissionAmountCents ?? 0, count: row._count._all },
    ]),
  );
  const get = (status: string) => byStatus.get(status)?.sum ?? 0;

  const pendingCents = get("PENDING");
  const approvedCents = get("APPROVED");
  const paidCents = get("PAID");

  return {
    pendingCents,
    approvedCents,
    paidCents,
    rejectedCents: get("REJECTED"),
    cancelledCents: get("CANCELLED"),
    // Earnings only count money that is approved or already paid.
    earnedCents: approvedCents + paidCents,
    count: rows.reduce((total, row) => total + row._count._all, 0),
  };
}
