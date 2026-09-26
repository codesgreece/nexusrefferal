import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  CreateCustomerButton,
  DeleteCustomerButton,
  EditCustomerButton,
} from "@/components/admin/customer-actions";
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
import { requireAdminPage } from "@/lib/auth/guards";
import { CUSTOMER_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { activeAffiliateOptions } from "@/lib/services/affiliates";
import { listActiveServices } from "@/lib/services/catalog";
import { listCustomers } from "@/lib/services/customers";
import { oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const [result, affiliates, services] = await Promise.all([
    listCustomers({
      query: single(params, "q"),
      status: oneOf(params, "status", CUSTOMER_STATUSES),
      affiliateId: single(params, "affiliateId"),
      page: pageNumber(params),
      perPage: 20,
    }),
    activeAffiliateOptions(),
    listActiveServices(),
  ]);

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: locale === "el" ? service.nameEl : service.nameEn,
  }));
  const affiliateOptions = affiliates.map((affiliate) => ({
    id: affiliate.id,
    name: affiliate.name,
    code: affiliate.code,
  }));

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.customers.title")}
        description={t("admin.customers.subtitle")}
        action={
          <CreateCustomerButton affiliates={affiliateOptions} services={serviceOptions} />
        }
      />

      <FilterBar
        selects={[
          {
            name: "status",
            label: t("common.status"),
            options: [
              { value: "", label: t("common.all") },
              ...CUSTOMER_STATUSES.map((status) => ({
                value: status,
                label: t(`status.customer.${status}`),
              })),
            ],
          },
          {
            name: "affiliateId",
            label: t("admin.leads.affiliate"),
            options: [
              { value: "", label: t("common.all") },
              { value: "NONE", label: t("common.unassigned") },
              ...affiliateOptions.map((affiliate) => ({
                value: affiliate.id,
                label: affiliate.name,
              })),
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-6" />}
            title={t("admin.customers.emptyTitle")}
            body={t("admin.customers.emptyBody")}
            action={
              <CreateCustomerButton affiliates={affiliateOptions} services={serviceOptions} />
            }
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("common.name")}</Th>
              <Th>{t("common.businessName")}</Th>
              <Th>{t("admin.leads.affiliate")}</Th>
              <Th>{t("admin.customers.source")}</Th>
              <Th align="right">{t("admin.customers.salesCount")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.created")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {result.rows.map((customer) => (
                <Tr key={customer.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{customer.fullName}</p>
                      <p className="truncate text-xs text-muted-2">{customer.email}</p>
                    </div>
                  </Td>
                  <Td className="text-muted">{customer.businessName ?? "—"}</Td>
                  <Td>
                    {customer.affiliate ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">
                          {customer.affiliate.fullName}
                        </p>
                        {customer.referralCode ? (
                          <p className="font-mono text-[0.68rem] text-violet-300">
                            {customer.referralCode}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <Badge tone="muted">{t("common.unassigned")}</Badge>
                    )}
                  </Td>
                  <Td className="text-muted">{customer.source ?? "—"}</Td>
                  <Td align="right" className="tabular-nums text-muted">
                    {customer._count.sales}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={customer.status}
                      label={t(`status.customer.${customer.status}`)}
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(customer.createdAt)}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <EditCustomerButton
                        affiliates={affiliateOptions}
                        services={serviceOptions}
                        values={{
                          customerId: customer.id,
                          fullName: customer.fullName,
                          businessName: customer.businessName ?? "",
                          email: customer.email,
                          phone: customer.phone ?? "",
                          serviceId: customer.serviceId ?? "",
                          affiliateId: customer.affiliateId ?? "",
                          attributionMethod: "",
                          source: customer.source ?? "",
                          status: customer.status,
                          internalNotes: customer.internalNotes ?? "",
                        }}
                      />
                      {customer._count.sales === 0 ? (
                        <DeleteCustomerButton
                          customerId={customer.id}
                          name={customer.fullName}
                        />
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {result.rows.map((customer) => (
              <MobileCard
                key={customer.id}
                title={customer.fullName}
                subtitle={customer.email}
                badge={
                  <StatusBadge
                    status={customer.status}
                    label={t(`status.customer.${customer.status}`)}
                  />
                }
                rows={[
                  { label: t("common.businessName"), value: customer.businessName ?? "—" },
                  {
                    label: t("admin.leads.affiliate"),
                    value: customer.affiliate?.fullName ?? t("common.unassigned"),
                  },
                  { label: t("admin.customers.salesCount"), value: customer._count.sales },
                  { label: t("common.created"), value: formatDate.format(customer.createdAt) },
                ]}
                footer={
                  <div className="flex items-center gap-1.5">
                    <EditCustomerButton
                      affiliates={affiliateOptions}
                      services={serviceOptions}
                      values={{
                        customerId: customer.id,
                        fullName: customer.fullName,
                        businessName: customer.businessName ?? "",
                        email: customer.email,
                        phone: customer.phone ?? "",
                        serviceId: customer.serviceId ?? "",
                        affiliateId: customer.affiliateId ?? "",
                        attributionMethod: "",
                        source: customer.source ?? "",
                        status: customer.status,
                        internalNotes: customer.internalNotes ?? "",
                      }}
                    />
                    {customer._count.sales === 0 ? (
                      <DeleteCustomerButton customerId={customer.id} name={customer.fullName} />
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
