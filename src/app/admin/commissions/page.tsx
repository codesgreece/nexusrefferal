import type { Metadata } from "next";
import { Coins } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { CommissionActions } from "@/components/admin/commission-actions";
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
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { ATTRIBUTION_METHODS, COMMISSION_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { activeAffiliateOptions } from "@/lib/services/affiliates";
import { commissionTotals } from "@/lib/services/commissions";
import { serviceName } from "@/lib/services/catalog";
import { like } from "@/lib/services/query";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Commissions" };

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const page = pageNumber(params);
  const perPage = 20;
  const status = oneOf(params, "status", COMMISSION_STATUSES);
  const method = oneOf(params, "method", ATTRIBUTION_METHODS);
  const affiliateId = single(params, "affiliateId");
  const query = single(params, "q")?.trim();
  const from = isoDate(params, "from");
  const to = isoDate(params, "to");

  const where = {
    ...(status ? { status } : {}),
    ...(method ? { attributionMethod: method } : {}),
    ...(affiliateId ? { affiliateId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { referralCode: like(query) },
            { customer: { fullName: like(query) } },
            { customer: { email: like(query) } },
            { affiliate: { fullName: like(query) } },
            { sale: { reference: like(query) } },
          ],
        }
      : {}),
  };

  const [total, rows, totals, affiliates] = await Promise.all([
    prisma.commission.count({ where }),
    prisma.commission.findMany({
      where,
      include: {
        affiliate: { select: { id: true, fullName: true } },
        customer: { select: { fullName: true, businessName: true } },
        service: { select: { nameEn: true, nameEl: true } },
        sale: { select: { reference: true, paymentReference: true } },
        payout: { select: { reference: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    commissionTotals(),
    activeAffiliateOptions(),
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
        title={t("admin.commissions.title")}
        description={t("admin.commissions.subtitle")}
      />

      <StatGrid>
        <StatCard
          label={t("affiliate.commissions.summaryPending")}
          value={formatMoney(totals.pendingCents, locale)}
          tone="caution"
          icon={<Coins />}
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
            name: "affiliateId",
            label: t("admin.commissions.affiliate"),
            options: [
              { value: "", label: t("common.all") },
              ...affiliates.map((affiliate) => ({
                value: affiliate.id,
                label: affiliate.name,
              })),
            ],
          },
          {
            name: "method",
            label: t("attribution.label"),
            options: [
              { value: "", label: t("common.all") },
              ...ATTRIBUTION_METHODS.map((entry) => ({
                value: entry,
                label: t(`attribution.${entry}`),
              })),
            ],
          },
        ]}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Coins className="size-6" />}
            title={t("admin.commissions.emptyTitle")}
            body={t("admin.commissions.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("admin.commissions.affiliate")}</Th>
              <Th>{t("affiliate.leads.customer")}</Th>
              <Th>{t("common.service")}</Th>
              <Th align="right">{t("admin.commissions.saleAmount")}</Th>
              <Th align="right">{t("admin.commissions.commission")}</Th>
              <Th>{t("admin.leads.referralCode")}</Th>
              <Th>{t("attribution.label")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.created")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {rows.map((commission) => (
                <Tr key={commission.id}>
                  <Td>
                    <p className="truncate font-medium text-ink">
                      {commission.affiliate.fullName}
                    </p>
                    <p className="truncate font-mono text-[0.68rem] text-muted-2">
                      {commission.sale.reference}
                    </p>
                  </Td>
                  <Td>
                    <p className="truncate text-sm text-ink">{commission.customer.fullName}</p>
                    {commission.customer.businessName ? (
                      <p className="truncate text-[0.68rem] text-muted-2">
                        {commission.customer.businessName}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="text-muted">{serviceName(commission.service, locale)}</Td>
                  <Td align="right" className="tabular-nums text-muted">
                    {formatMoney(commission.saleAmountCents, locale)}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatMoney(commission.commissionAmountCents, locale)}
                    <p className="text-[0.65rem] font-normal text-muted-2">
                      {commission.commissionType === "PERCENT"
                        ? `${commission.commissionRate}%`
                        : t("admin.services.commissionTypeFixed")}
                    </p>
                  </Td>
                  <Td>
                    {commission.referralCode ? (
                      <span className="font-mono text-xs text-violet-300">
                        {commission.referralCode}
                      </span>
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {commission.attributionMethod
                      ? t(`attribution.${commission.attributionMethod}`)
                      : "—"}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={commission.status}
                      label={t(`status.commission.${commission.status}`)}
                    />
                    {commission.payout ? (
                      <p className="mt-1 font-mono text-[0.65rem] text-muted-2">
                        {commission.payout.reference}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(commission.createdAt)}
                    {commission.approvedAt ? (
                      <p className="text-[0.65rem] text-muted-2">
                        {t("admin.commissions.approvedDate")}:{" "}
                        {formatDate.format(commission.approvedAt)}
                      </p>
                    ) : null}
                    {commission.paidAt ? (
                      <p className="text-[0.65rem] text-muted-2">
                        {t("admin.commissions.paidDate")}:{" "}
                        {formatDate.format(commission.paidAt)}
                      </p>
                    ) : null}
                  </Td>
                  <Td align="right">
                    <CommissionActions
                      commissionId={commission.id}
                      status={commission.status}
                      amountLabel={formatMoney(commission.commissionAmountCents, locale)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {rows.map((commission) => (
              <MobileCard
                key={commission.id}
                title={commission.affiliate.fullName}
                subtitle={`${commission.customer.fullName} · ${commission.sale.reference}`}
                badge={
                  <StatusBadge
                    status={commission.status}
                    label={t(`status.commission.${commission.status}`)}
                  />
                }
                rows={[
                  {
                    label: t("admin.commissions.saleAmount"),
                    value: formatMoney(commission.saleAmountCents, locale),
                  },
                  {
                    label: t("admin.commissions.commission"),
                    value: formatMoney(commission.commissionAmountCents, locale),
                  },
                  {
                    label: t("admin.leads.referralCode"),
                    value: commission.referralCode ?? "—",
                  },
                  {
                    label: t("common.created"),
                    value: formatDate.format(commission.createdAt),
                  },
                ]}
                footer={
                  <CommissionActions
                    commissionId={commission.id}
                    status={commission.status}
                    amountLabel={formatMoney(commission.commissionAmountCents, locale)}
                  />
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
