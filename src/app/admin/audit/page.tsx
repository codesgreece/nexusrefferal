import type { Metadata } from "next";
import { FileClock } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { AuditDetails } from "@/components/admin/audit-details";
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
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { like } from "@/lib/services/query";
import { isoDate, oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Audit logs" };

const ENTITY_TYPES = [
  "Affiliate",
  "ReferralCode",
  "Lead",
  "Customer",
  "Sale",
  "Commission",
  "Payout",
  "Service",
  "AffiliateResource",
  "ProgramSettings",
  "User",
] as const;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const page = pageNumber(params);
  const perPage = 40;
  const action = oneOf(params, "action", AUDIT_ACTIONS);
  const entityType = oneOf(params, "entityType", ENTITY_TYPES);
  const query = single(params, "q")?.trim();
  const from = isoDate(params, "from");
  const to = isoDate(params, "to");

  const where = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
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
            { actorEmail: like(query) },
            { entityId: like(query) },
            { newValue: like(query) },
            { previousValue: like(query) },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const formatDateTime = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="space-y-5">
      <PageHeader title={t("admin.audit.title")} description={t("admin.audit.subtitle")} />

      <FilterBar
        showDateRange
        selects={[
          {
            name: "action",
            label: t("admin.audit.action"),
            options: [
              { value: "", label: t("common.all") },
              ...AUDIT_ACTIONS.map((entry) => ({
                value: entry,
                label: t(`audit.action.${entry}`),
              })),
            ],
          },
          {
            name: "entityType",
            label: t("admin.audit.entity"),
            options: [
              { value: "", label: t("common.all") },
              ...ENTITY_TYPES.map((entry) => ({ value: entry, label: entry })),
            ],
          },
        ]}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<FileClock className="size-6" />}
            title={t("admin.audit.emptyTitle")}
            body={t("admin.audit.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("admin.audit.when")}</Th>
              <Th>{t("admin.audit.action")}</Th>
              <Th>{t("admin.audit.actor")}</Th>
              <Th>{t("admin.audit.entity")}</Th>
              <Th>{t("admin.audit.ip")}</Th>
              <Th align="right">{t("admin.audit.viewDetails")}</Th>
            </Thead>
            <Tbody>
              {rows.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDateTime.format(entry.createdAt)}
                  </Td>
                  <Td>
                    <Badge tone="violet">{t(`audit.action.${entry.action}`)}</Badge>
                  </Td>
                  <Td>
                    <p className="truncate text-sm text-ink/90">
                      {entry.actorEmail ?? t("common.system")}
                    </p>
                    {entry.actorRole ? (
                      <p className="text-[0.65rem] text-muted-2">{entry.actorRole}</p>
                    ) : null}
                  </Td>
                  <Td>
                    <p className="text-sm text-muted">{entry.entityType}</p>
                    {entry.entityId ? (
                      <p className="truncate font-mono text-[0.65rem] text-muted-2">
                        {entry.entityId}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="font-mono text-[0.68rem] text-muted-2">{entry.ip ?? "—"}</Td>
                  <Td align="right">
                    <AuditDetails
                      entry={{
                        id: entry.id,
                        action: entry.action,
                        entityType: entry.entityType,
                        entityId: entry.entityId,
                        actorEmail: entry.actorEmail,
                        previousValue: entry.previousValue,
                        newValue: entry.newValue,
                        metadata: entry.metadata,
                        ip: entry.ip,
                        userAgent: entry.userAgent,
                        createdAt: entry.createdAt.toISOString(),
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {rows.map((entry) => (
              <MobileCard
                key={entry.id}
                title={t(`audit.action.${entry.action}`)}
                subtitle={entry.actorEmail ?? t("common.system")}
                badge={<Badge tone="neutral">{entry.entityType}</Badge>}
                rows={[
                  {
                    label: t("admin.audit.when"),
                    value: formatDateTime.format(entry.createdAt),
                  },
                  { label: t("admin.audit.ip"), value: entry.ip ?? "—" },
                ]}
                footer={
                  <AuditDetails
                    entry={{
                      id: entry.id,
                      action: entry.action,
                      entityType: entry.entityType,
                      entityId: entry.entityId,
                      actorEmail: entry.actorEmail,
                      previousValue: entry.previousValue,
                      newValue: entry.newValue,
                      metadata: entry.metadata,
                      ip: entry.ip,
                      userAgent: entry.userAgent,
                      createdAt: entry.createdAt.toISOString(),
                    }}
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
