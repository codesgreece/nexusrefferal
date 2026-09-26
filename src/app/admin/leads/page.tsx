import type { Metadata } from "next";
import { ListChecks } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  AssignLeadButton,
  ConvertLeadButton,
  CreateLeadButton,
  DeleteLeadButton,
  EditLeadButton,
  LeadStatusSelect,
} from "@/components/admin/lead-actions";
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
import { ATTRIBUTION_METHODS, LEAD_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { centsToEuroInput, formatMoney } from "@/lib/money";
import { activeAffiliateOptions } from "@/lib/services/affiliates";
import { listActiveServices, serviceName } from "@/lib/services/catalog";
import { listLeads } from "@/lib/services/leads";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const [result, affiliates, services] = await Promise.all([
    listLeads({
      query: single(params, "q"),
      status: oneOf(params, "status", LEAD_STATUSES),
      attributionMethod: oneOf(params, "method", ATTRIBUTION_METHODS),
      affiliateId: single(params, "affiliateId"),
      referralCode: single(params, "code"),
      from: isoDate(params, "from"),
      to: isoDate(params, "to"),
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
        title={t("admin.leads.title")}
        description={t("admin.leads.subtitle")}
        action={<CreateLeadButton affiliates={affiliateOptions} services={serviceOptions} />}
      />

      <FilterBar
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
          {
            name: "method",
            label: t("attribution.label"),
            options: [
              { value: "", label: t("common.all") },
              ...ATTRIBUTION_METHODS.map((method) => ({
                value: method,
                label: t(`attribution.${method}`),
              })),
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks className="size-6" />}
            title={t("admin.leads.emptyTitle")}
            body={t("admin.leads.emptyBody")}
            action={
              <CreateLeadButton affiliates={affiliateOptions} services={serviceOptions} />
            }
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("affiliate.leads.customer")}</Th>
              <Th>{t("common.service")}</Th>
              <Th>{t("admin.leads.affiliate")}</Th>
              <Th>{t("attribution.label")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.created")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {result.rows.map((lead) => (
                <Tr key={lead.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{lead.customerName}</p>
                      <p className="truncate text-xs text-muted-2">
                        {lead.businessName ? `${lead.businessName} · ` : ""}
                        {lead.email}
                      </p>
                      <p className="truncate font-mono text-[0.68rem] text-muted-2">
                        {lead.reference}
                        {lead.origin === "PUBLIC_FORM"
                          ? ` · ${t("admin.leads.originPublic")}`
                          : ` · ${t("admin.leads.originAdmin")}`}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-muted">{serviceName(lead.service, locale)}</Td>
                  <Td>
                    {lead.affiliate ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{lead.affiliate.fullName}</p>
                        {lead.referralCodeRaw ? (
                          <p className="font-mono text-[0.68rem] text-violet-300">
                            {lead.referralCodeRaw}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <Badge tone="muted">{t("admin.leads.noAttribution")}</Badge>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {lead.attributionMethod ? t(`attribution.${lead.attributionMethod}`) : "—"}
                  </Td>
                  <Td>
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(lead.createdAt)}
                    {lead.estimatedAmountCents ? (
                      <p className="text-[0.68rem] text-muted-2">
                        {formatMoney(lead.estimatedAmountCents, locale)}
                      </p>
                    ) : null}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <AssignLeadButton
                        leadId={lead.id}
                        currentAffiliateId={lead.affiliateId ?? ""}
                        currentMethod={lead.attributionMethod ?? ""}
                        affiliates={affiliateOptions}
                      />
                      <ConvertLeadButton leadId={lead.id} customerId={lead.customerId} />
                      <EditLeadButton
                        affiliates={affiliateOptions}
                        services={serviceOptions}
                        values={{
                          leadId: lead.id,
                          customerName: lead.customerName,
                          businessName: lead.businessName ?? "",
                          email: lead.email,
                          phone: lead.phone ?? "",
                          serviceId: lead.serviceId ?? "",
                          message: lead.message ?? "",
                          status: lead.status,
                          estimatedAmount: lead.estimatedAmountCents
                            ? centsToEuroInput(lead.estimatedAmountCents)
                            : "",
                          internalNotes: lead.internalNotes ?? "",
                          affiliateId: lead.affiliateId ?? "",
                          attributionMethod: lead.attributionMethod ?? "",
                          attributionSource: lead.attributionSource ?? "",
                          attributionNotes: lead.attributionNotes ?? "",
                        }}
                      />
                      <DeleteLeadButton leadId={lead.id} reference={lead.reference} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {result.rows.map((lead) => (
              <MobileCard
                key={lead.id}
                title={lead.customerName}
                subtitle={lead.email}
                badge={
                  <StatusBadge status={lead.status} label={t(`status.lead.${lead.status}`)} />
                }
                rows={[
                  { label: t("common.service"), value: serviceName(lead.service, locale) },
                  {
                    label: t("admin.leads.affiliate"),
                    value: lead.affiliate?.fullName ?? t("common.unassigned"),
                  },
                  {
                    label: t("attribution.label"),
                    value: lead.attributionMethod
                      ? t(`attribution.${lead.attributionMethod}`)
                      : "—",
                  },
                  { label: t("common.created"), value: formatDate.format(lead.createdAt) },
                ]}
                footer={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AssignLeadButton
                      leadId={lead.id}
                      currentAffiliateId={lead.affiliateId ?? ""}
                      currentMethod={lead.attributionMethod ?? ""}
                      affiliates={affiliateOptions}
                    />
                    <ConvertLeadButton leadId={lead.id} customerId={lead.customerId} />
                    <EditLeadButton
                      affiliates={affiliateOptions}
                      services={serviceOptions}
                      values={{
                        leadId: lead.id,
                        customerName: lead.customerName,
                        businessName: lead.businessName ?? "",
                        email: lead.email,
                        phone: lead.phone ?? "",
                        serviceId: lead.serviceId ?? "",
                        message: lead.message ?? "",
                        status: lead.status,
                        estimatedAmount: lead.estimatedAmountCents
                          ? centsToEuroInput(lead.estimatedAmountCents)
                          : "",
                        internalNotes: lead.internalNotes ?? "",
                        affiliateId: lead.affiliateId ?? "",
                        attributionMethod: lead.attributionMethod ?? "",
                        attributionSource: lead.attributionSource ?? "",
                        attributionNotes: lead.attributionNotes ?? "",
                      }}
                    />
                    <DeleteLeadButton leadId={lead.id} reference={lead.reference} />
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
