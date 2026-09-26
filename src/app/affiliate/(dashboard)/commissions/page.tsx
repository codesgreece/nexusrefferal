import type { Metadata } from "next";
import { Coins } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
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
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { COMMISSION_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { commissionTotals } from "@/lib/services/commissions";
import { listActiveServices, serviceName } from "@/lib/services/catalog";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "My commissions" };

export default async function AffiliateCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireActiveAffiliatePage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const page = pageNumber(params);
  const perPage = 20;
  const status = oneOf(params, "status", COMMISSION_STATUSES);
  const serviceId = single(params, "serviceId");
  const from = isoDate(params, "from");
  const to = isoDate(params, "to");

  const where = {
    affiliateId: user.affiliateId,
    ...(status ? { status } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [total, rows, totals, services] = await Promise.all([
    prisma.commission.count({ where }),
    prisma.commission.findMany({
      where,
      include: {
        customer: { select: { fullName: true, businessName: true } },
        service: { select: { nameEn: true, nameEl: true } },
        sale: { select: { reference: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    commissionTotals(user.affiliateId),
    listActiveServices(),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("affiliate.commissions.title")}
        description={t("affiliate.commissions.subtitle")}
      />

      <StatGrid>
        <StatCard
          label={t("affiliate.commissions.summaryPending")}
          value={formatMoney(totals.pendingCents, locale)}
          tone="caution"
        />
        <StatCard
          label={t("affiliate.commissions.summaryApproved")}
          value={formatMoney(totals.approvedCents, locale)}
          tone="violet"
        />
        <StatCard
          label={t("affiliate.commissions.summaryPaid")}
          value={formatMoney(totals.paidCents, locale)}
          tone="positive"
        />
        <StatCard
          label={t("affiliate.commissions.summaryTotal")}
          value={formatMoney(totals.earnedCents, locale)}
        />
      </StatGrid>

      <FilterBar
        showDateRange
        selects={[
          {
            name: "status",
            label: t("common.status"),
            options: [
              { value: "", label: t("common.all") },
              ...COMMISSION_STATUSES.map((entry) => ({
                value: entry,
                label: t(`status.commission.${entry}`),
              })),
            ],
          },
          {
            name: "serviceId",
            label: t("common.service"),
            options: [
              { value: "", label: t("common.all") },
              ...services.map((service) => ({
                value: service.id,
                label: locale === "el" ? service.nameEl : service.nameEn,
              })),
            ],
          },
        ]}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Coins className="size-6" />}
            title={t("affiliate.commissions.emptyTitle")}
            body={t("affiliate.commissions.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("affiliate.commissions.commissionId")}</Th>
              <Th>{t("affiliate.leads.customer")}</Th>
              <Th>{t("common.service")}</Th>
              <Th align="right">{t("affiliate.commissions.saleAmount")}</Th>
              <Th align="right">{t("affiliate.commissions.commissionAmount")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.created")}</Th>
              <Th>{t("affiliate.commissions.approvedAt")}</Th>
              <Th>{t("affiliate.commissions.paidAt")}</Th>
            </Thead>
            <Tbody>
              {rows.map((commission) => (
                <Tr key={commission.id}>
                  <Td>
                    <span className="font-mono text-xs text-muted">
                      {commission.sale.reference}
                    </span>
                  </Td>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {commission.customer.fullName}
                      </p>
                      {commission.customer.businessName ? (
                        <p className="truncate text-[0.7rem] text-muted-2">
                          {commission.customer.businessName}
                        </p>
                      ) : null}
                    </div>
                  </Td>
                  <Td className="text-muted">{serviceName(commission.service, locale)}</Td>
                  <Td align="right" className="tabular-nums text-muted">
                    {formatMoney(commission.saleAmountCents, locale)}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatMoney(commission.commissionAmountCents, locale)}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={commission.status}
                      label={t(`status.commission.${commission.status}`)}
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(commission.createdAt)}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {commission.approvedAt ? formatDate.format(commission.approvedAt) : "—"}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {commission.paidAt ? formatDate.format(commission.paidAt) : "—"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {rows.map((commission) => (
              <MobileCard
                key={commission.id}
                title={commission.customer.fullName}
                subtitle={commission.sale.reference}
                badge={
                  <StatusBadge
                    status={commission.status}
                    label={t(`status.commission.${commission.status}`)}
                  />
                }
                rows={[
                  { label: t("common.service"), value: serviceName(commission.service, locale) },
                  {
                    label: t("affiliate.commissions.saleAmount"),
                    value: formatMoney(commission.saleAmountCents, locale),
                  },
                  {
                    label: t("affiliate.commissions.commissionAmount"),
                    value: formatMoney(commission.commissionAmountCents, locale),
                  },
                  { label: t("common.created"), value: formatDate.format(commission.createdAt) },
                ]}
                footer={
                  commission.cancellationReason || commission.rejectionReason ? (
                    <p className="text-xs text-caution">
                      {commission.cancellationReason ?? commission.rejectionReason}
                    </p>
                  ) : null
                }
              />
            ))}
          </MobileCardList>

          <Pagination page={page} pages={pages} total={total} />
        </>
      )}
    </div>
  );
}
