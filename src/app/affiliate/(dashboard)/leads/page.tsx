import type { Metadata } from "next";
import { ListChecks } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MobileCard,
  MobileCardList,
  Tbody,
  Td,
  Th,
  Thead,
  TableShell,
  Tr,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { LEAD_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { serviceName } from "@/lib/services/catalog";
import { listLeads } from "@/lib/services/leads";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "My leads" };

export default async function AffiliateLeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireActiveAffiliatePage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  // The affiliate id comes from the session, never from the query string.
  const result = await listLeads(
    {
      query: single(params, "q"),
      status: oneOf(params, "status", LEAD_STATUSES),
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

  const paidSaleFor = (lead: (typeof result.rows)[number]) =>
    lead.sales.find((sale) => sale.paymentStatus === "PAID") ?? lead.sales[0] ?? null;

  return (
    <div className="space-y-5">
      <PageHeader title={t("affiliate.leads.title")} description={t("affiliate.leads.subtitle")} />

      <FilterBar
        searchPlaceholder={t("common.search")}
        showDateRange
        selects={[
          {
            name: "status",
            label: t("common.status"),
            options: [
              { value: "", label: t("common.all") },
              ...LEAD_STATUSES.map((status) => ({
                value: status,
                label: t(`status.lead.${status}`),
              })),
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks className="size-6" />}
            title={t("affiliate.leads.emptyTitle")}
            body={t("affiliate.leads.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("affiliate.leads.customer")}</Th>
              <Th>{t("affiliate.leads.business")}</Th>
              <Th>{t("common.service")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("attribution.label")}</Th>
              <Th align="right">{t("affiliate.leads.saleAmount")}</Th>
              <Th align="right">{t("affiliate.leads.commission")}</Th>
              <Th>{t("common.created")}</Th>
            </Thead>
            <Tbody>
              {result.rows.map((lead) => {
                const sale = paidSaleFor(lead);
                return (
                  <Tr key={lead.id}>
                    <Td>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{lead.customerName}</p>
                        <p className="truncate font-mono text-[0.7rem] text-muted-2">
                          {lead.reference}
                        </p>
                      </div>
                    </Td>
                    <Td className="text-muted">{lead.businessName ?? "—"}</Td>
                    <Td className="text-muted">{serviceName(lead.service, locale)}</Td>
                    <Td>
                      <StatusBadge status={lead.status} label={t(`status.lead.${lead.status}`)} />
                    </Td>
                    <Td className="text-muted">
                      {lead.attributionMethod
                        ? t(`attribution.${lead.attributionMethod}`)
                        : "—"}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {sale ? formatMoney(sale.amountCents, locale) : "—"}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {sale?.commission ? (
                        <span className="inline-flex items-center gap-2">
                          {formatMoney(sale.commission.commissionAmountCents, locale)}
                          <StatusBadge
                            status={sale.commission.status}
                            label={t(`status.commission.${sale.commission.status}`)}
                          />
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate.format(lead.createdAt)}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {result.rows.map((lead) => {
              const sale = paidSaleFor(lead);
              return (
                <MobileCard
                  key={lead.id}
                  title={lead.customerName}
                  subtitle={lead.businessName ?? lead.reference}
                  badge={
                    <StatusBadge status={lead.status} label={t(`status.lead.${lead.status}`)} />
                  }
                  rows={[
                    { label: t("common.service"), value: serviceName(lead.service, locale) },
                    { label: t("common.created"), value: formatDate.format(lead.createdAt) },
                    {
                      label: t("affiliate.leads.saleAmount"),
                      value: sale ? formatMoney(sale.amountCents, locale) : "—",
                    },
                    {
                      label: t("affiliate.leads.commission"),
                      value: sale?.commission
                        ? formatMoney(sale.commission.commissionAmountCents, locale)
                        : "—",
                    },
                  ]}
                />
              );
            })}
          </MobileCardList>

          <Pagination page={result.page} pages={result.pages} total={result.total} />
          <p className="px-1 text-xs text-muted-2">{t("affiliate.leads.noteLocked")}</p>
        </>
      )}
    </div>
  );
}
