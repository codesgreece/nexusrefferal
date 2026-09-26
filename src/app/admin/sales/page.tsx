import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  ConfirmPaymentButton,
  CreateSaleButton,
  EditSaleButton,
  RefundSaleButton,
} from "@/components/admin/sale-actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
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
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { centsToEuroInput, formatMoney } from "@/lib/money";
import { activeAffiliateOptions } from "@/lib/services/affiliates";
import { listActiveServices, serviceName } from "@/lib/services/catalog";
import { listSales } from "@/lib/services/sales";
import { getSettings } from "@/lib/services/settings";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Sales" };

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const [result, services, affiliates, settings, customers] = await Promise.all([
    listSales({
      query: single(params, "q"),
      paymentStatus: oneOf(params, "paymentStatus", PAYMENT_STATUSES),
      orderStatus: oneOf(params, "orderStatus", ORDER_STATUSES),
      affiliateId: single(params, "affiliateId"),
      serviceId: single(params, "serviceId"),
      from: isoDate(params, "from"),
      to: isoDate(params, "to"),
      page: pageNumber(params),
      perPage: 20,
    }),
    listActiveServices(),
    activeAffiliateOptions(),
    getSettings(),
    prisma.customer.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: { affiliate: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: locale === "el" ? service.nameEl : service.nameEn,
    startingPriceCents: service.startingPriceCents,
    commissionType: service.commissionType,
    commissionFixedCents: service.commissionFixedCents,
    commissionPercent: service.commissionPercent,
  }));

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: `${customer.fullName}${customer.businessName ? ` · ${customer.businessName}` : ""} · ${customer.email}`,
    affiliateName: customer.affiliate?.fullName ?? null,
    referralCode: customer.referralCode,
  }));

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const createButton = (
    <CreateSaleButton
      customers={customerOptions}
      services={serviceOptions}
      domainFeeCents={settings.domainFeeCents}
    />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.sales.title")}
        description={t("admin.sales.subtitle")}
        action={createButton}
      />

      {result.total > 0 ? (
        <StatGrid cols={3}>
          <StatCard label={t("admin.stats.totalSales")} value={result.total} />
          <StatCard
            label={t("common.total")}
            value={formatMoney(result.totalAmountCents, locale)}
            tone="violet"
          />
          <StatCard
            label={t("status.payment.PAID")}
            value={result.rows.filter((sale) => sale.paymentStatus === "PAID").length}
            tone="positive"
          />
        </StatGrid>
      ) : null}

      <FilterBar
        showDateRange
        selects={[
          {
            name: "paymentStatus",
            label: t("admin.sales.paymentStatus"),
            options: [
              { value: "", label: t("common.all") },
              ...PAYMENT_STATUSES.map((status) => ({
                value: status,
                label: t(`status.payment.${status}`),
              })),
            ],
          },
          {
            name: "orderStatus",
            label: t("admin.sales.orderStatus"),
            options: [
              { value: "", label: t("common.all") },
              ...ORDER_STATUSES.map((status) => ({
                value: status,
                label: t(`status.order.${status}`),
              })),
            ],
          },
          {
            name: "affiliateId",
            label: t("admin.leads.affiliate"),
            options: [
              { value: "", label: t("common.all") },
              { value: "NONE", label: t("common.unassigned") },
              ...affiliates.map((affiliate) => ({
                value: affiliate.id,
                label: affiliate.name,
              })),
            ],
          },
          {
            name: "serviceId",
            label: t("common.service"),
            options: [
              { value: "", label: t("common.all") },
              ...serviceOptions.map((service) => ({
                value: service.id,
                label: service.name,
              })),
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title={t("admin.sales.emptyTitle")}
            body={t("admin.sales.emptyBody")}
            action={createButton}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("admin.sales.customer")}</Th>
              <Th>{t("common.service")}</Th>
              <Th align="right">{t("common.amount")}</Th>
              <Th>{t("admin.leads.affiliate")}</Th>
              <Th>{t("admin.sales.paymentStatus")}</Th>
              <Th>{t("admin.sales.orderStatus")}</Th>
              <Th align="right">{t("admin.commissions.commission")}</Th>
              <Th>{t("admin.sales.saleDate")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {result.rows.map((sale) => (
                <Tr key={sale.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{sale.customer.fullName}</p>
                      <p className="truncate text-xs text-muted-2">
                        {sale.customer.businessName ?? ""}
                      </p>
                      <p className="truncate font-mono text-[0.68rem] text-muted-2">
                        {sale.reference}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-muted">{serviceName(sale.service, locale)}</Td>
                  <Td align="right" className="tabular-nums">
                    {formatMoney(sale.amountCents + sale.domainFeeCents, locale)}
                    {sale.domainIncluded ? (
                      <p className="text-[0.65rem] text-muted-2">
                        +{formatMoney(sale.domainFeeCents, locale)}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    {sale.affiliate ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{sale.affiliate.fullName}</p>
                        {sale.referralCode ? (
                          <p className="font-mono text-[0.68rem] text-violet-300">
                            {sale.referralCode}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <Badge tone="muted">{t("common.unassigned")}</Badge>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={sale.paymentStatus}
                      label={t(`status.payment.${sale.paymentStatus}`)}
                    />
                  </Td>
                  <Td>
                    <StatusBadge
                      status={sale.orderStatus}
                      label={t(`status.order.${sale.orderStatus}`)}
                    />
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {sale.commission ? (
                      <div>
                        <p className="font-semibold">
                          {formatMoney(sale.commission.commissionAmountCents, locale)}
                        </p>
                        <StatusBadge
                          status={sale.commission.status}
                          label={t(`status.commission.${sale.commission.status}`)}
                        />
                      </div>
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(sale.saleDate)}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      {sale.paymentStatus === "PENDING" ? (
                        <ConfirmPaymentButton
                          saleId={sale.id}
                          amountLabel={formatMoney(
                            sale.amountCents + sale.domainFeeCents,
                            locale,
                          )}
                        />
                      ) : null}
                      <EditSaleButton
                        saleId={sale.id}
                        hasCommission={Boolean(sale.commission)}
                        services={serviceOptions}
                        domainFeeCents={settings.domainFeeCents}
                        initial={{
                          serviceId: sale.serviceId,
                          amount: centsToEuroInput(sale.amountCents),
                          domainIncluded: sale.domainIncluded,
                          saleDate: sale.saleDate.toISOString().slice(0, 10),
                          orderStatus: sale.orderStatus,
                          paymentReference: sale.paymentReference ?? "",
                          internalNotes: sale.internalNotes ?? "",
                        }}
                      />
                      {sale.paymentStatus === "PAID" ? (
                        <RefundSaleButton saleId={sale.id} />
                      ) : null}
                    </div>
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
                subtitle={sale.reference}
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
                    label: t("admin.leads.affiliate"),
                    value: sale.affiliate?.fullName ?? t("common.unassigned"),
                  },
                  {
                    label: t("admin.commissions.commission"),
                    value: sale.commission
                      ? formatMoney(sale.commission.commissionAmountCents, locale)
                      : "—",
                  },
                ]}
                footer={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sale.paymentStatus === "PENDING" ? (
                      <ConfirmPaymentButton
                        saleId={sale.id}
                        amountLabel={formatMoney(
                          sale.amountCents + sale.domainFeeCents,
                          locale,
                        )}
                      />
                    ) : null}
                    <EditSaleButton
                      saleId={sale.id}
                      hasCommission={Boolean(sale.commission)}
                      services={serviceOptions}
                      domainFeeCents={settings.domainFeeCents}
                      initial={{
                        serviceId: sale.serviceId,
                        amount: centsToEuroInput(sale.amountCents),
                        domainIncluded: sale.domainIncluded,
                        saleDate: sale.saleDate.toISOString().slice(0, 10),
                        orderStatus: sale.orderStatus,
                        paymentReference: sale.paymentReference ?? "",
                        internalNotes: sale.internalNotes ?? "",
                      }}
                    />
                    {sale.paymentStatus === "PAID" ? (
                      <RefundSaleButton saleId={sale.id} />
                    ) : null}
                  </div>
                }
              />
            ))}
          </MobileCardList>

          <Pagination page={result.page} pages={result.pages} total={result.total} />
        </>
      )}
    </div>
  );
}
