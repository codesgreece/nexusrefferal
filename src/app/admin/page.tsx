import type { Metadata } from "next";
import Link from "next/link";
import {
  Coins,
  Euro,
  ListChecks,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { ProgramCharts } from "@/components/admin/program-charts";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { buildTimeSeries, getAdminStats } from "@/lib/services/analytics";

export const metadata: Metadata = { title: "Control center" };

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const { t, locale } = await getI18n();

  const [stats, series30, series90, series12m, recentAudit, pendingApplications, pendingPayouts] =
    await Promise.all([
      getAdminStats(),
      buildTimeSeries("30d"),
      buildTimeSeries("90d"),
      buildTimeSeries("12m"),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.affiliate.findMany({
        where: { status: "PENDING", deletedAt: null },
        orderBy: { appliedAt: "asc" },
        take: 5,
        select: { id: true, fullName: true, email: true, appliedAt: true },
      }),
      prisma.payout.findMany({
        where: { status: { in: ["REQUESTED", "APPROVED"] } },
        orderBy: { requestedAt: "asc" },
        take: 5,
        include: { affiliate: { select: { fullName: true } } },
      }),
    ]);

  const formatDateTime = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const hasActivity =
    stats.totalLeads > 0 || stats.totalSales > 0 || stats.totalCommissionsCents > 0;
  const hasPendingWork =
    pendingApplications.length > 0 ||
    pendingPayouts.length > 0 ||
    stats.pendingCommissionsCents > 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.title")} description={t("admin.subtitle")} />

      <StatGrid>
        <StatCard
          label={t("admin.stats.totalRevenue")}
          value={formatMoney(stats.totalRevenueCents, locale)}
          icon={<Euro />}
          tone="violet"
          sublabel={`${stats.totalSales} ${t("admin.stats.totalSales").toLowerCase()}`}
        />
        <StatCard
          label={t("admin.stats.totalCommissions")}
          value={formatMoney(stats.totalCommissionsCents, locale)}
          icon={<Coins />}
          sublabel={`${t("admin.stats.pendingCommissions")}: ${formatMoney(stats.pendingCommissionsCents, locale)}`}
        />
        <StatCard
          label={t("admin.stats.activeAffiliates")}
          value={stats.activeAffiliates}
          icon={<Users />}
          tone="positive"
          sublabel={`${stats.totalAffiliates} ${t("admin.stats.totalAffiliates").toLowerCase()}`}
        />
        <StatCard
          label={t("admin.stats.pendingApplications")}
          value={stats.pendingApplications}
          icon={<UserPlus />}
          tone={stats.pendingApplications > 0 ? "caution" : "neutral"}
        />
      </StatGrid>

      <StatGrid>
        <StatCard
          label={t("admin.stats.totalLeads")}
          value={stats.totalLeads}
          icon={<ListChecks />}
        />
        <StatCard
          label={t("admin.stats.conversionRate")}
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp />}
        />
        <StatCard
          label={t("admin.stats.approvedCommissions")}
          value={formatMoney(stats.approvedCommissionsCents, locale)}
          icon={<Coins />}
        />
        <StatCard
          label={t("admin.stats.pendingPayouts")}
          value={formatMoney(stats.pendingPayoutCents, locale)}
          icon={<Wallet />}
          tone={stats.pendingPayouts > 0 ? "caution" : "neutral"}
          sublabel={`${stats.pendingPayouts} ${t("admin.nav.payouts").toLowerCase()}`}
        />
      </StatGrid>

      <ProgramCharts
        series={{ "30d": series30, "90d": series90, "12m": series12m }}
        hasAnyActivity={hasActivity}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t("admin.pendingActions")} />
          {!hasPendingWork ? (
            <EmptyState
              icon={<ShoppingBag className="size-6" />}
              title={t("admin.pendingActionsEmpty")}
              compact
            />
          ) : (
            <CardBody className="space-y-4">
              {pendingApplications.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80">
                      {t("admin.nav.applications")}
                    </h3>
                    <Button asChild variant="ghost" size="xs">
                      <Link href="/admin/applications">{t("common.viewAll")}</Link>
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {pendingApplications.map((application) => (
                      <li key={application.id}>
                        <Link
                          href={`/admin/affiliates/${application.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-2.5 transition-colors hover:border-violet-500/35"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {application.fullName}
                            </p>
                            <p className="truncate text-xs text-muted-2">{application.email}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-2">
                            {formatDate.format(application.appliedAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {pendingPayouts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80">
                      {t("admin.nav.payouts")}
                    </h3>
                    <Button asChild variant="ghost" size="xs">
                      <Link href="/admin/payouts">{t("common.viewAll")}</Link>
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {pendingPayouts.map((payout) => (
                      <li
                        key={payout.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {payout.affiliate.fullName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-2">
                            {payout.reference}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatMoney(payout.amountCents, locale)}
                          </span>
                          <StatusBadge
                            status={payout.status}
                            label={t(`status.payout.${payout.status}`)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stats.pendingCommissionsCents > 0 ? (
                <Link
                  href="/admin/commissions?status=PENDING"
                  className="flex items-center justify-between gap-3 rounded-xl border border-caution/25 bg-caution/8 px-3.5 py-3 transition-colors hover:border-caution/45"
                >
                  <span className="text-sm text-caution">
                    {t("admin.stats.pendingCommissions")}
                  </span>
                  <span className="text-sm font-semibold text-caution tabular-nums">
                    {formatMoney(stats.pendingCommissionsCents, locale)}
                  </span>
                </Link>
              ) : null}
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t("admin.recentActivity")}
            action={
              recentAudit.length > 0 ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/audit">{t("common.viewAll")}</Link>
                </Button>
              ) : null
            }
          />
          {recentAudit.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-6" />}
              title={t("admin.audit.emptyTitle")}
              body={t("admin.audit.emptyBody")}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentAudit.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-3 sm:px-6">
                  <Badge tone="violet" className="mt-0.5 shrink-0">
                    {t(`audit.action.${entry.action}`)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted">
                      {entry.actorEmail ?? t("common.system")} · {entry.entityType}
                    </p>
                    <p className="text-[0.68rem] text-muted-2">
                      {formatDateTime.format(entry.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
