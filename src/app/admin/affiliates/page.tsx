import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AFFILIATE_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { listAffiliates } from "@/lib/services/affiliates";
import { oneOf, pageNumber, single, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Affiliates" };

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const result = await listAffiliates({
    query: single(params, "q"),
    status: oneOf(params, "status", AFFILIATE_STATUSES),
    sort: oneOf(params, "sort", ["newest", "oldest", "name"] as const) ?? "newest",
    page: pageNumber(params),
    perPage: 20,
  });

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.affiliates.title")}
        description={t("admin.affiliates.subtitle")}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/applications">{t("admin.nav.applications")}</Link>
          </Button>
        }
      />

      <FilterBar
        selects={[
          {
            name: "status",
            label: t("common.status"),
            options: [
              { value: "", label: t("common.all") },
              ...AFFILIATE_STATUSES.map((status) => ({
                value: status,
                label: t(`status.affiliate.${status}`),
              })),
            ],
          },
          {
            name: "sort",
            label: t("common.sortBy"),
            options: [
              { value: "", label: t("common.newest") },
              { value: "oldest", label: t("common.oldest") },
              { value: "name", label: t("common.name") },
            ],
          },
        ]}
      />

      {result.total === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-6" />}
            title={t("admin.affiliates.emptyTitle")}
            body={t("admin.affiliates.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <TableShell>
            <Thead>
              <Th>{t("common.name")}</Th>
              <Th>{t("admin.affiliates.code")}</Th>
              <Th>{t("common.status")}</Th>
              <Th align="right">{t("admin.affiliates.leads")}</Th>
              <Th align="right">{t("admin.affiliates.sales")}</Th>
              <Th align="right">{t("admin.affiliates.earnings")}</Th>
              <Th>{t("admin.affiliates.joined")}</Th>
              <Th />
            </Thead>
            <Tbody>
              {result.rows.map((affiliate) => (
                <Tr key={affiliate.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{affiliate.fullName}</p>
                      <p className="truncate text-xs text-muted-2">{affiliate.email}</p>
                    </div>
                  </Td>
                  <Td>
                    {affiliate.code ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-xs text-violet-200">
                          {affiliate.code}
                        </span>
                        {!affiliate.codeActive ? (
                          <Badge tone="danger">{t("status.affiliate.SUSPENDED")}</Badge>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={affiliate.status}
                      label={t(`status.affiliate.${affiliate.status}`)}
                    />
                  </Td>
                  <Td align="right" className="tabular-nums text-muted">
                    {affiliate.leadCount}
                  </Td>
                  <Td align="right" className="tabular-nums text-muted">
                    {affiliate.saleCount}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatMoney(affiliate.earningsCents, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate.format(affiliate.appliedAt)}
                  </Td>
                  <Td align="right">
                    <Button asChild variant="ghost" size="xs">
                      <Link href={`/admin/affiliates/${affiliate.id}`}>
                        {t("common.view")}
                      </Link>
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableShell>

          <MobileCardList>
            {result.rows.map((affiliate) => (
              <MobileCard
                key={affiliate.id}
                href={`/admin/affiliates/${affiliate.id}`}
                title={affiliate.fullName}
                subtitle={affiliate.email}
                badge={
                  <StatusBadge
                    status={affiliate.status}
                    label={t(`status.affiliate.${affiliate.status}`)}
                  />
                }
                rows={[
                  { label: t("admin.affiliates.code"), value: affiliate.code ?? "—" },
                  {
                    label: t("admin.affiliates.earnings"),
                    value: formatMoney(affiliate.earningsCents, locale),
                  },
                  { label: t("admin.affiliates.leads"), value: affiliate.leadCount },
                  { label: t("admin.affiliates.sales"), value: affiliate.saleCount },
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
