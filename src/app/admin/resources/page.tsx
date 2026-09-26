import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  CreateResourceButton,
  DeleteResourceButton,
  EditResourceButton,
} from "@/components/admin/resource-form";
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
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Resources" };

export default async function AdminResourcesPage() {
  await requireAdminPage();
  const { t, locale } = await getI18n();

  const resources = await prisma.affiliateResource.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const toValues = (resource: (typeof resources)[number]) => ({
    resourceId: resource.id,
    titleEn: resource.titleEn,
    titleEl: resource.titleEl,
    descriptionEn: resource.descriptionEn,
    descriptionEl: resource.descriptionEl,
    type: resource.type,
    contentEn: resource.contentEn ?? "",
    contentEl: resource.contentEl ?? "",
    url: resource.url ?? "",
    thumbnailUrl: resource.thumbnailUrl ?? "",
    isActive: resource.isActive,
    sortOrder: String(resource.sortOrder),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.resources.title")}
        description={t("admin.resources.subtitle")}
        action={<CreateResourceButton />}
      />

      {resources.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title={t("admin.resources.emptyTitle")}
            body={t("admin.resources.emptyBody")}
            action={<CreateResourceButton />}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("common.name")}</Th>
              <Th>{t("admin.resources.type")}</Th>
              <Th align="center">{t("admin.resources.sortOrder")}</Th>
              <Th>{t("common.status")}</Th>
              <Th>{t("common.created")}</Th>
              <Th align="right">{t("common.actions")}</Th>
            </Thead>
            <Tbody>
              {resources.map((resource) => (
                <Tr key={resource.id}>
                  <Td>
                    <p className="font-medium text-ink">
                      {locale === "el" ? resource.titleEl : resource.titleEn}
                    </p>
                    <p className="max-w-lg truncate text-xs text-muted-2">
                      {locale === "el" ? resource.descriptionEl : resource.descriptionEn}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone="violet">{t(`resourceType.${resource.type}`)}</Badge>
                  </Td>
                  <Td align="center" className="text-muted">
                    {resource.sortOrder}
                  </Td>
                  <Td>
                    {resource.isActive ? (
                      <Badge tone="positive" dot>
                        {t("admin.resources.active")}
                      </Badge>
                    ) : (
                      <Badge tone="muted" dot>
                        {t("status.customer.INACTIVE")}
                      </Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(resource.createdAt)}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <EditResourceButton values={toValues(resource)} />
                      <DeleteResourceButton
                        resourceId={resource.id}
                        title={locale === "el" ? resource.titleEl : resource.titleEn}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {resources.map((resource) => (
              <MobileCard
                key={resource.id}
                title={locale === "el" ? resource.titleEl : resource.titleEn}
                subtitle={t(`resourceType.${resource.type}`)}
                badge={
                  resource.isActive ? (
                    <Badge tone="positive" dot>
                      {t("admin.resources.active")}
                    </Badge>
                  ) : (
                    <Badge tone="muted" dot>
                      {t("status.customer.INACTIVE")}
                    </Badge>
                  )
                }
                rows={[
                  { label: t("admin.resources.sortOrder"), value: resource.sortOrder },
                  { label: t("common.created"), value: formatDate.format(resource.createdAt) },
                ]}
                footer={
                  <div className="flex items-center gap-1.5">
                    <EditResourceButton values={toValues(resource)} />
                    <DeleteResourceButton
                      resourceId={resource.id}
                      title={locale === "el" ? resource.titleEl : resource.titleEn}
                    />
                  </div>
                }
              />
            ))}
          </MobileCardList>
        </>
      )}
    </div>
  );
}
