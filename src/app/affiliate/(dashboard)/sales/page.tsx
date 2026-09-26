import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";

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
import { PAYMENT_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { serviceName } from "@/lib/services/catalog";
import { listSales } from "@/lib/services/sales";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "My sales" };

export default async function AffiliateSalesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireActiveAffiliatePage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const result = await listSales(
    {
      query: single(params, "q"),
      paymentStatus: oneOf(params, "paymentStatus", PAYMENT_STATUSES),
      from: isoDate(params, "from"),
      to: isoDate(params, "to"),
      page: pageNumber(params),
      perPage: 20,
    },
    user.affiliateId,
  );

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const paidCount = result.rows.filter((sale) => sale.paymentStatus === "PAID").length;

  return (
    <div className="space-y-5">
      <PageHeader title={t("affiliate.sales.title")} description={t("affiliate.sales.subtitle")} />

      {result.total > 0 ? (
        <StatGrid cols={3}>
          <StatCard label={t("admin.stats.totalSales")} value={result.total} />
          <StatCard
            label={t("common.total")}
            value={formatMoney(result.totalAmountCents, locale)}
            tone="violet"
          />
          <StatCard label={t("status.payment.PAID")} value={paidCount} tone="positive" />
        </StatGrid>
      ) : null}

      <FilterBar
        showDateRange
        selects={[
          {
            name: "paymentStatus",
            label: t("affiliate.sales.paymentStatus"),
            options: [
              { value: "", label: t("common.all") },
              ...PAYMENT_STATUSES.map((status) => ({
                value: status,
                label: t(`status.payment.${status}`),
              })),
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title={t("affiliate.sales.emptyTitle")}
            body={t("affiliate.sales.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("affiliate.leads.customer")}</Th>
              <Th>{t("affiliate.leads.business")}</Th>
              <Th>{t("common.service")}</Th>
              <Th align="right">{t("common.amount")}</Th>
              <Th>{t("affiliate.sales.saleDate")}</Th>
              <Th>{t("affiliate.sales.paymentStatus")}</Th>
              <Th align="right">{t("affiliate.leads.commission")}</Th>
              <Th>{t("affiliate.sales.commissionStatus")}</Th>
            </Thead>
            <Tbody>
              {result.rows.map((sale) => (
                <Tr key={sale.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{sale.customer.fullName}</p>
                      <p className="truncate font-mono text-[0.7rem] text-muted-2">
                        {sale.reference}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-muted">{sale.customer.businessName ?? "—"}</Td>
                  <Td className="text-muted">{serviceName(sale.service, locale)}</Td>
                  <Td align="right" className="tabular-nums">
                    {formatMoney(sale.amountCents + sale.domainFeeCents, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(sale.saleDate)}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={sale.paymentStatus}
                      label={t(`status.payment.${sale.paymentStatus}`)}
                    />
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {sale.commission
                      ? formatMoney(sale.commission.commissionAmountCents, locale)
                      : "—"}
                  </Td>
                  <Td>
                    {sale.commission ? (
                      <StatusBadge
                        status={sale.commission.status}
                        label={t(`status.commission.${sale.commission.status}`)}
                      />
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {result.rows.map((sale) => (
              <MobileCard
                key={sale.id}
                title={sale.customer.fullName}
                subtitle={sale.customer.businessName ?? sale.reference}
                badge={
                  <StatusBadge
                    status={sale.paymentStatus}
                    label={t(`status.payment.${sale.paymentStatus}`)}
                  />
                }
                rows={[
                  { label: t("common.service"), value: serviceName(sale.service, locale) },
                  {
                    label: t("common.amount"),
                    value: formatMoney(sale.amountCents + sale.domainFeeCents, locale),
                  },
                  {
                    label: t("affiliate.sales.saleDate"),
                    value: formatDate.format(sale.saleDate),
                  },
                  {
                    label: t("affiliate.leads.commission"),
                    value: sale.commission
                      ? formatMoney(sale.commission.commissionAmountCents, locale)
                      : "—",
                  },
                ]}
              />
            ))}
          </MobileCardList>

          <Pagination page={result.page} pages={result.pages} total={result.total} />
        </>
      )}
    </div>
  );
}
