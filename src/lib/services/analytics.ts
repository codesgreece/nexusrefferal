import "server-only";

import { prisma } from "@/lib/db";
import { QUALIFIED_LEAD_STATUSES } from "@/lib/domain";

export type SeriesPoint = {
  date: string;
  leads: number;
  sales: number;
  revenueCents: number;
  earningsCents: number;
  commissionsCents: number;
};

export type RangeKey = "30d" | "90d" | "12m";

export const RANGE_DAYS: Record<RangeKey, number> = {
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

function startOfRange(range: RangeKey) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (RANGE_DAYS[range] - 1));
  return start;
}

function bucketKey(date: Date, monthly: boolean) {
  const iso = date.toISOString();
  return monthly ? iso.slice(0, 7) : iso.slice(0, 10);
}

function emptyBuckets(range: RangeKey): Map<string, SeriesPoint> {
  const monthly = range === "12m";
  const buckets = new Map<string, SeriesPoint>();
  const cursor = startOfRange(range);
  const now = new Date();

  if (monthly) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );
    for (let index = 0; index < 12; index += 1) {
      const point = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
      );
      buckets.set(bucketKey(point, true), {
        date: bucketKey(point, true),
        leads: 0,
        sales: 0,
        revenueCents: 0,
        earningsCents: 0,
        commissionsCents: 0,
      });
    }
    return buckets;
  }

  while (cursor <= now) {
    const key = bucketKey(cursor, false);
    buckets.set(key, {
      date: key,
      leads: 0,
      sales: 0,
      revenueCents: 0,
      earningsCents: 0,
      commissionsCents: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}

/**
 * Time series built from real rows only. Days with no activity are emitted as
 * zeros so charts render a continuous axis without inventing data.
 */
export async function buildTimeSeries(
  range: RangeKey,
  affiliateId?: string,
): Promise<SeriesPoint[]> {
  const monthly = range === "12m";
  const since = monthly
    ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1))
    : startOfRange(range);
  const buckets = emptyBuckets(range);

  const [leads, sales, commissions] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: since },
        ...(affiliateId ? { affiliateId } : {}),
      },
      select: { createdAt: true },
    }),
    prisma.sale.findMany({
      where: {
        deletedAt: null,
        paymentStatus: "PAID",
        saleDate: { gte: since },
        ...(affiliateId ? { affiliateId } : {}),
      },
      select: { saleDate: true, amountCents: true, domainFeeCents: true },
    }),
    prisma.commission.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: ["PENDING", "APPROVED", "PAID"] },
        ...(affiliateId ? { affiliateId } : {}),
      },
      select: { createdAt: true, commissionAmountCents: true, status: true },
    }),
  ]);

  for (const lead of leads) {
    const bucket = buckets.get(bucketKey(lead.createdAt, monthly));
    if (bucket) bucket.leads += 1;
  }
  for (const sale of sales) {
    const bucket = buckets.get(bucketKey(sale.saleDate, monthly));
    if (bucket) {
      bucket.sales += 1;
      bucket.revenueCents += sale.amountCents + sale.domainFeeCents;
    }
  }
  for (const commission of commissions) {
    const bucket = buckets.get(bucketKey(commission.createdAt, monthly));
    if (bucket) {
      bucket.commissionsCents += commission.commissionAmountCents;
      if (commission.status === "APPROVED" || commission.status === "PAID") {
        bucket.earningsCents += commission.commissionAmountCents;
      }
    }
  }

  return [...buckets.values()];
}

export type AffiliateStats = {
  totalLeads: number;
  qualifiedLeads: number;
  successfulSales: number;
  totalClicks: number;
  conversionRate: number;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  totalEarningsCents: number;
};

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const [totalLeads, qualifiedLeads, successfulSales, totalClicks, commissionRows] =
    await Promise.all([
      prisma.lead.count({ where: { affiliateId, deletedAt: null } }),
      prisma.lead.count({
        where: { affiliateId, deletedAt: null, status: { in: QUALIFIED_LEAD_STATUSES } },
      }),
      prisma.sale.count({
        where: { affiliateId, deletedAt: null, paymentStatus: "PAID" },
      }),
      prisma.referralClick.count({ where: { affiliateId } }),
      prisma.commission.groupBy({
        by: ["status"],
        where: { affiliateId },
        _sum: { commissionAmountCents: true },
      }),
    ]);

  const byStatus = new Map(
    commissionRows.map((row) => [row.status, row._sum.commissionAmountCents ?? 0]),
  );
  const pendingCents = byStatus.get("PENDING") ?? 0;
  const approvedCents = byStatus.get("APPROVED") ?? 0;
  const paidCents = byStatus.get("PAID") ?? 0;

  return {
    totalLeads,
    qualifiedLeads,
    successfulSales,
    totalClicks,
    conversionRate: totalLeads > 0 ? (successfulSales / totalLeads) * 100 : 0,
    pendingCents,
    approvedCents,
    paidCents,
    totalEarningsCents: approvedCents + paidCents,
  };
}

export type AdminStats = {
  totalAffiliates: number;
  pendingApplications: number;
  activeAffiliates: number;
  totalLeads: number;
  totalSales: number;
  totalRevenueCents: number;
  totalCommissionsCents: number;
  pendingCommissionsCents: number;
  approvedCommissionsCents: number;
  paidCommissionsCents: number;
  conversionRate: number;
  pendingPayouts: number;
  pendingPayoutCents: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalAffiliates,
    pendingApplications,
    activeAffiliates,
    totalLeads,
    salesAgg,
    commissionRows,
    payoutAgg,
  ] = await Promise.all([
    prisma.affiliate.count({ where: { deletedAt: null } }),
    prisma.affiliate.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.affiliate.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.sale.aggregate({
      where: { deletedAt: null, paymentStatus: "PAID" },
      _sum: { amountCents: true, domainFeeCents: true },
      _count: { _all: true },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: {},
      _sum: { commissionAmountCents: true },
    }),
    prisma.payout.aggregate({
      where: { status: { in: ["REQUESTED", "APPROVED"] } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ]);

  const byStatus = new Map(
    commissionRows.map((row) => [row.status, row._sum.commissionAmountCents ?? 0]),
  );
  const pending = byStatus.get("PENDING") ?? 0;
  const approved = byStatus.get("APPROVED") ?? 0;
  const paid = byStatus.get("PAID") ?? 0;
  const totalSales = salesAgg._count._all;

  return {
    totalAffiliates,
    pendingApplications,
    activeAffiliates,
    totalLeads,
    totalSales,
    totalRevenueCents:
      (salesAgg._sum.amountCents ?? 0) + (salesAgg._sum.domainFeeCents ?? 0),
    totalCommissionsCents: pending + approved + paid,
    pendingCommissionsCents: pending,
    approvedCommissionsCents: approved,
    paidCommissionsCents: paid,
    conversionRate: totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0,
    pendingPayouts: payoutAgg._count._all,
    pendingPayoutCents: payoutAgg._sum.amountCents ?? 0,
  };
}
