import type { Metadata } from "next";
import { Package } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { CreateServiceButton, EditServiceButton } from "@/components/admin/service-form";
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
import { requireAdminPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { centsToEuroInput, formatMoney } from "@/lib/money";
import { listAllServices } from "@/lib/services/catalog";

export const metadata: Metadata = { title: "Services & pricing" };

function parseFeatures(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default async function AdminServicesPage() {
  await requireAdminPage();
  const { t, locale } = await getI18n();
  const services = await listAllServices();

  const commissionLabel = (service: (typeof services)[number]) =>
    service.commissionType === "PERCENT"
      ? `${service.commissionPercent ?? 0}%`
      : formatMoney(service.commissionFixedCents ?? 0, locale);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.services.title")}
        description={t("admin.services.subtitle")}
        action={<CreateServiceButton />}
      />

      {services.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package className="size-6" />}
            title={t("admin.services.emptyTitle")}
            body={t("admin.services.emptyBody")}
            action={<CreateServiceButton />}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("common.name")}</Th>
              <Th>{t("admin.services.slug")}</Th>
              <Th align="right">{t("admin.services.startingPrice")}</Th>
              <Th align="right">{t("admin.services.commissionColumn")}</Th>
              <Th>{t("admin.services.commissionType")}</Th>
              <Th align="center">{t("admin.services.sortOrder")}</Th>
              <Th>{t("common.status")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {services.map((service) => (
                <Tr key={service.id}>
                  <Td>
                    <p className="font-medium text-ink">
                      {locale === "el" ? service.nameEl : service.nameEn}
                    </p>
                    <p className="text-xs text-muted-2">
                      {locale === "el" ? service.nameEn : service.nameEl}
                    </p>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-muted-2">{service.slug}</span>
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatMoney(service.startingPriceCents, locale)}
                    {service.priceFrom ? (
                      <span className="text-violet-400">+</span>
                    ) : null}
                  </Td>
                  <Td align="right" className="tabular-nums text-positive">
                    {commissionLabel(service)}
                  </Td>
                  <Td className="text-muted">
                    {service.commissionType === "PERCENT"
                      ? t("admin.services.commissionTypePercent")
                      : t("admin.services.commissionTypeFixed")}
                  </Td>
                  <Td align="center" className="text-muted">
                    {service.sortOrder}
                  </Td>
                  <Td>
                    {service.isActive ? (
                      <Badge tone="positive" dot>
                        {t("admin.services.active")}
                      </Badge>
                    ) : (
                      <Badge tone="muted" dot>
                        {t("status.customer.INACTIVE")}
                      </Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <EditServiceButton
                      values={{
                        serviceId: service.id,
                        nameEn: service.nameEn,
                        nameEl: service.nameEl,
                        descriptionEn: service.descriptionEn,
                        descriptionEl: service.descriptionEl,
                        featuresEn: parseFeatures(service.featuresEn).join("\n"),
                        featuresEl: parseFeatures(service.featuresEl).join("\n"),
                        startingPrice: centsToEuroInput(service.startingPriceCents),
                        priceFrom: service.priceFrom,
                        commissionType: service.commissionType,
                        commissionFixed: centsToEuroInput(service.commissionFixedCents ?? 0),
                        commissionPercent: String(service.commissionPercent ?? 10),
                        isActive: service.isActive,
                        sortOrder: String(service.sortOrder),
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {services.map((service) => (
              <MobileCard
                key={service.id}
                title={locale === "el" ? service.nameEl : service.nameEn}
                subtitle={service.slug}
                badge={
                  service.isActive ? (
                    <Badge tone="positive" dot>
                      {t("admin.services.active")}
                    </Badge>
                  ) : (
                    <Badge tone="muted" dot>
                      {t("status.customer.INACTIVE")}
                    </Badge>
                  )
                }
                rows={[
                  {
                    label: t("admin.services.startingPrice"),
                    value: `${formatMoney(service.startingPriceCents, locale)}${service.priceFrom ? "+" : ""}`,
                  },
                  {
                    label: t("admin.services.commissionColumn"),
                    value: commissionLabel(service),
                  },
                ]}
                footer={
                  <EditServiceButton
                    values={{
                      serviceId: service.id,
                      nameEn: service.nameEn,
                      nameEl: service.nameEl,
                      descriptionEn: service.descriptionEn,
                      descriptionEl: service.descriptionEl,
                      featuresEn: parseFeatures(service.featuresEn).join("\n"),
                      featuresEl: parseFeatures(service.featuresEl).join("\n"),
                      startingPrice: centsToEuroInput(service.startingPriceCents),
                      priceFrom: service.priceFrom,
                      commissionType: service.commissionType,
                      commissionFixed: centsToEuroInput(service.commissionFixedCents ?? 0),
                      commissionPercent: String(service.commissionPercent ?? 10),
                      isActive: service.isActive,
                      sortOrder: String(service.sortOrder),
                    }}
                  />
                }
              />
            ))}
          </MobileCardList>
        </>
      )}
    </div>
  );
}
