import type { Metadata } from "next";
import Link from "next/link";
import {
  Coins,
  ListChecks,
  MousePointerClick,
  ShoppingBag,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { PerformanceCharts } from "@/components/affiliate/analytics";
import { QuickActions } from "@/components/affiliate/quick-actions";
import { ReferralCard } from "@/components/affiliate/referral-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getI18n } from "@/lib/i18n/server";
import { dateLocaleTag } from "@/lib/i18n/config";
import { buildTimeSeries, getAffiliateStats } from "@/lib/services/analytics";
import { getAffiliateContext } from "@/lib/services/affiliate-context";
import { serviceName } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AffiliateDashboardPage() {
  const user = await requireActiveAffiliatePage();
  const { t, locale } = await getI18n();

  const [context, stats, settings, series30, series90, series12m, recentLeads, recentCommissions] =
    await Promise.all([
      getAffiliateContext(user.affiliateId),
      getAffiliateStats(user.affiliateId),
      getSettings(),
      buildTimeSeries("30d", user.affiliateId),
      buildTimeSeries("90d", user.affiliateId),
      buildTimeSeries("12m", user.affiliateId),
      prisma.lead.findMany({
        where: { affiliateId: user.affiliateId, deletedAt: null },
        include: { service: { select: { nameEn: true, nameEl: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.commission.findMany({
        where: { affiliateId: user.affiliateId },
        include: {
          customer: { select: { fullName: true } },
          service: { select: { nameEn: true, nameEl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const dateFormatter = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
  });
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const hasActivity = stats.totalLeads > 0 || stats.successfulSales > 0 || stats.totalClicks > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("affiliate.greeting", { name: firstName })}
        description={t("affiliate.greetingSub")}
      />

      <ReferralCard
        code={context.primaryCode}
        referralUrl={context.referralUrl}
        codeActive={context.primaryCodeActive}
        cookieDays={settings.referralCookieDays}
      />

      <StatGrid>
        <StatCard
          label={t("affiliate.stats.totalLeads")}
          value={stats.totalLeads}
          icon={<ListChecks />}
          sublabel={`${stats.qualifiedLeads} ${t("affiliate.stats.qualifiedLeads").toLowerCase()}`}
        />
        <StatCard
          label={t("affiliate.stats.successfulSales")}
          value={stats.successfulSales}
          icon={<ShoppingBag />}
          tone="positive"
          sublabel={`${t("affiliate.stats.conversionRate")}: ${stats.conversionRate.toFixed(1)}%`}
        />
        <StatCard
          label={t("affiliate.stats.pendingCommissions")}
          value={formatMoney(stats.pendingCents, locale)}
          icon={<Coins />}
          tone="caution"
        />
        <StatCard
          label={t("affiliate.stats.totalEarnings")}
          value={formatMoney(stats.totalEarningsCents, locale)}
          icon={<Wallet />}
          tone="violet"
          sublabel={`${t("affiliate.stats.paidTotal")}: ${formatMoney(stats.paidCents, locale)}`}
        />
      </StatGrid>

      <StatGrid cols={3}>
        <StatCard
          label={t("affiliate.stats.clicks")}
          value={stats.totalClicks}
          icon={<MousePointerClick />}
        />
        <StatCard
          label={t("affiliate.stats.approvedCommissions")}
          value={formatMoney(stats.approvedCents, locale)}
          icon={<Target />}
        />
        <StatCard
          label={t("affiliate.stats.conversionRate")}
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp />}
        />
      </StatGrid>

      <PerformanceCharts
        series={{ "30d": series30, "90d": series90, "12m": series12m }}
        hasAnyActivity={hasActivity}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t("affiliate.recentLeads")}
              action={
                recentLeads.length > 0 ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/affiliate/leads">{t("common.viewAll")}</Link>
                  </Button>
                ) : null
              }
            />
            {recentLeads.length === 0 ? (
              <EmptyState
                icon={<ListChecks className="size-6" />}
                title={t("affiliate.leads.emptyTitle")}
                body={t("affiliate.leads.emptyBody")}
                compact
              />
            ) : (
              <ul className="divide-y divide-white/5">
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {lead.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-2">
                        {serviceName(lead.service, locale)} · {dateFormatter.format(lead.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={lead.status}
                      label={t(`status.lead.${lead.status}`)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title={t("affiliate.recentCommissions")}
              action={
                recentCommissions.length > 0 ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/affiliate/commissions">{t("common.viewAll")}</Link>
                  </Button>
                ) : null
              }
            />
            {recentCommissions.length === 0 ? (
              <EmptyState
                icon={<Coins className="size-6" />}
                title={t("affiliate.commissions.emptyTitle")}
                body={t("affiliate.commissions.emptyBody")}
                compact
              />
            ) : (
              <ul className="divide-y divide-white/5">
                {recentCommissions.map((commission) => (
                  <li
                    key={commission.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {commission.customer.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-2">
                        {serviceName(commission.service, locale)} ·{" "}
                        {dateFormatter.format(commission.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-ink tabular-nums">
                        {formatMoney(commission.commissionAmountCents, locale)}
                      </span>
                      <StatusBadge
                        status={commission.status}
                        label={t(`status.commission.${commission.status}`)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <QuickActions code={context.primaryCode} referralUrl={context.referralUrl} />
      </div>
    </div>
  );
}
