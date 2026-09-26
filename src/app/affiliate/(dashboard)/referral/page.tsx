import type { Metadata } from "next";
import { MousePointerClick } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { ReferralCard } from "@/components/affiliate/referral-card";
import { QuickActions } from "@/components/affiliate/quick-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import {
  MobileCard,
  MobileCardList,
  TableShell,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getAffiliateContext } from "@/lib/services/affiliate-context";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "My referral" };

export default async function AffiliateReferralPage() {
  const user = await requireActiveAffiliatePage();
  const { t, locale } = await getI18n();

  const [context, settings, clicks, clickCount, uniqueVisitors, leadCount] = await Promise.all([
    getAffiliateContext(user.affiliateId),
    getSettings(),
    prisma.referralClick.findMany({
      where: { affiliateId: user.affiliateId },
      orderBy: { createdAt: "desc" },
      take: 25,
      // The affiliate sees their own traffic, never the hashed IP.
      select: {
        id: true,
        code: true,
        source: true,
        campaign: true,
        deviceType: true,
        createdAt: true,
      },
    }),
    prisma.referralClick.count({ where: { affiliateId: user.affiliateId } }),
    prisma.referralClick
      .findMany({
        where: { affiliateId: user.affiliateId },
        distinct: ["visitorId"],
        select: { visitorId: true },
      })
      .then((rows) => rows.filter((row) => row.visitorId).length),
    prisma.lead.count({
      where: {
        affiliateId: user.affiliateId,
        deletedAt: null,
        attributionMethod: "REFERRAL_LINK",
      },
    }),
  ]);

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("affiliate.nav.referral")}
        description={t("affiliate.referral.hint")}
      />

      <ReferralCard
        code={context.primaryCode}
        referralUrl={context.referralUrl}
        codeActive={context.primaryCodeActive}
        cookieDays={settings.referralCookieDays}
      />

      <StatGrid cols={3}>
        <StatCard
          label={t("admin.tracking.totalClicks")}
          value={clickCount}
          icon={<MousePointerClick />}
        />
        <StatCard label={t("admin.tracking.uniqueVisitors")} value={uniqueVisitors} />
        <StatCard
          label={t("attribution.REFERRAL_LINK")}
          value={leadCount}
          tone="violet"
          sublabel={t("affiliate.stats.totalLeads")}
        />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title={t("affiliate.referral.clicksTitle")} />
          {clicks.length === 0 ? (
            <EmptyState
              icon={<MousePointerClick className="size-6" />}
              title={t("admin.tracking.emptyTitle")}
              body={t("affiliate.referral.qrHint")}
              compact
            />
          ) : (
            <>
              <TableShell className="border-0 shadow-none">
                <Thead>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("admin.tracking.code")}</Th>
                  <Th>{t("admin.tracking.device")}</Th>
                  <Th>{t("admin.tracking.source")}</Th>
                  <Th>{t("admin.tracking.campaign")}</Th>
                </Thead>
                <Tbody>
                  {clicks.map((click) => (
                    <Tr key={click.id}>
                      <Td className="whitespace-nowrap text-muted">
                        {formatDate.format(click.createdAt)}
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-violet-200">{click.code}</span>
                      </Td>
                      <Td>
                        <Badge tone="neutral">{click.deviceType ?? "UNKNOWN"}</Badge>
                      </Td>
                      <Td className="text-muted">{click.source ?? "—"}</Td>
                      <Td className="text-muted">{click.campaign ?? "—"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableShell>

              <MobileCardList className="p-4">
                {clicks.map((click) => (
                  <MobileCard
                    key={click.id}
                    title={formatDate.format(click.createdAt)}
                    subtitle={click.code}
                    badge={<Badge tone="neutral">{click.deviceType ?? "UNKNOWN"}</Badge>}
                    rows={[
                      { label: t("admin.tracking.source"), value: click.source ?? "—" },
                      { label: t("admin.tracking.campaign"), value: click.campaign ?? "—" },
                    ]}
                  />
                ))}
              </MobileCardList>
            </>
          )}
        </Card>

        <QuickActions code={context.primaryCode} referralUrl={context.referralUrl} />
      </div>
    </div>
  );
}
