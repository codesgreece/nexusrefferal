import type { Metadata } from "next";
import { MousePointerClick } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { activeAffiliateOptions } from "@/lib/services/affiliates";
import { like } from "@/lib/services/query";
import { isoDate, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Referral tracking" };

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const page = pageNumber(params);
  const perPage = 30;
  const affiliateId = single(params, "affiliateId");
  const query = single(params, "q")?.trim();
  const from = isoDate(params, "from");
  const to = isoDate(params, "to");

  const where = {
    ...(affiliateId ? { affiliateId } : {}),
    ...(query ? { OR: [{ code: like(query) }, { source: like(query) }, { campaign: like(query) }] } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [total, rows, affiliates, topCodes, uniqueVisitors] = await Promise.all([
    prisma.referralClick.count({ where }),
    prisma.referralClick.findMany({
      where,
      include: { affiliate: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    activeAffiliateOptions(),
    prisma.referralClick.groupBy({
      by: ["code"],
      where,
      _count: { _all: true },
      orderBy: { _count: { code: "desc" } },
      take: 1,
    }),
    prisma.referralClick
      .findMany({ where, distinct: ["visitorId"], select: { visitorId: true } })
      .then((entries) => entries.filter((entry) => entry.visitorId).length),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const formatDateTime = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.tracking.title")}
        description={t("admin.tracking.subtitle")}
      />

      <StatGrid cols={3}>
        <StatCard
          label={t("admin.tracking.totalClicks")}
          value={total}
          icon={<MousePointerClick />}
        />
        <StatCard label={t("admin.tracking.uniqueVisitors")} value={uniqueVisitors} />
        <StatCard
          label={t("admin.tracking.topCode")}
          value={topCodes[0]?.code ?? "—"}
          tone="violet"
          sublabel={
            topCodes[0]
              ? `${topCodes[0]._count._all} ${t("admin.tracking.totalClicks").toLowerCase()}`
              : undefined
          }
        />
      </StatGrid>

      <FilterBar
        showDateRange
        selects={[
          {
            name: "affiliateId",
            label: t("admin.leads.affiliate"),
            options: [
              { value: "", label: t("common.all") },
              ...affiliates.map((affiliate) => ({
                value: affiliate.id,
                label: affiliate.name,
              })),
            ],
          },
        ]}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<MousePointerClick className="size-6" />}
            title={t("admin.tracking.emptyTitle")}
            body={t("admin.tracking.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("common.date")}</Th>
              <Th>{t("admin.tracking.code")}</Th>
              <Th>{t("admin.leads.affiliate")}</Th>
              <Th>{t("admin.tracking.device")}</Th>
              <Th>{t("admin.tracking.source")}</Th>
              <Th>{t("admin.tracking.campaign")}</Th>
              <Th>{t("admin.tracking.referer")}</Th>
              <Th>{t("admin.tracking.visitor")}</Th>
            </Thead>
            <Tbody>
              {rows.map((click) => (
                <Tr key={click.id}>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDateTime.format(click.createdAt)}
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-violet-200">{click.code}</span>
                  </Td>
                  <Td className="text-muted">{click.affiliate.fullName}</Td>
                  <Td>
                    <Badge tone="neutral">{click.deviceType ?? "UNKNOWN"}</Badge>
                  </Td>
                  <Td className="text-muted">{click.source ?? "—"}</Td>
                  <Td className="text-muted">{click.campaign ?? "—"}</Td>
                  <Td className="max-w-48 truncate text-muted-2">{click.referer ?? "—"}</Td>
                  <Td>
                    <span className="font-mono text-[0.68rem] text-muted-2">
                      {click.visitorId ? click.visitorId.slice(0, 8) : "—"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {rows.map((click) => (
              <MobileCard
                key={click.id}
                title={click.code}
                subtitle={click.affiliate.fullName}
                badge={<Badge tone="neutral">{click.deviceType ?? "UNKNOWN"}</Badge>}
                rows={[
                  { label: t("common.date"), value: formatDateTime.format(click.createdAt) },
                  { label: t("admin.tracking.source"), value: click.source ?? "—" },
                  { label: t("admin.tracking.campaign"), value: click.campaign ?? "—" },
                  {
                    label: t("admin.tracking.visitor"),
                    value: click.visitorId ? click.visitorId.slice(0, 8) : "—",
                  },
                ]}
              />
            ))}
          </MobileCardList>

          <Pagination page={page} pages={pages} total={total} />
        </>
      )}
    </div>
  );
}
