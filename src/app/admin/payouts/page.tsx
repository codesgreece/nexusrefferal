import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { PayoutActions } from "@/components/admin/payout-actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { PAYOUT_STATUSES } from "@/lib/domain";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { oneOf, pageNumber, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Payouts" };

function parseSnapshot(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string | null>;
  } catch {
    return null;
  }
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const { t, locale } = await getI18n();

  const page = pageNumber(params);
  const perPage = 15;
  const status = oneOf(params, "status", PAYOUT_STATUSES);
  const where = status ? { status } : {};

  const [total, rows, totals] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      include: {
        affiliate: { select: { id: true, fullName: true, email: true } },
        commissions: {
          select: {
            id: true,
            commissionAmountCents: true,
            status: true,
            customer: { select: { fullName: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.payout.groupBy({
      by: ["status"],
      _sum: { amountCents: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const byStatus = new Map(totals.map((row) => [row.status, row._sum.amountCents ?? 0]));
  const formatDateTime = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <PageHeader title={t("admin.payouts.title")} description={t("admin.payouts.subtitle")} />

      <StatGrid>
        <StatCard
          label={t("status.payout.REQUESTED")}
          value={formatMoney(byStatus.get("REQUESTED") ?? 0, locale)}
          tone="caution"
          icon={<Wallet />}
        />
        <StatCard
          label={t("status.payout.APPROVED")}
          value={formatMoney(byStatus.get("APPROVED") ?? 0, locale)}
          tone="violet"
        />
        <StatCard
          label={t("status.payout.PAID")}
          value={formatMoney(byStatus.get("PAID") ?? 0, locale)}
          tone="positive"
        />
        <StatCard
          label={t("status.payout.REJECTED")}
          value={formatMoney(byStatus.get("REJECTED") ?? 0, locale)}
        />
      </StatGrid>

      <FilterBar
        selects={[
          {
            name: "status",
            label: t("common.status"),
            options: [
              { value: "", label: t("common.all") },
              ...PAYOUT_STATUSES.map((entry) => ({
                value: entry,
                label: t(`status.payout.${entry}`),
              })),
            ],
          },
        ]}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="size-6" />}
            title={t("admin.payouts.emptyTitle")}
            body={t("admin.payouts.emptyBody")}
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {rows.map((payout) => {
              const snapshot = parseSnapshot(payout.methodDetailsSnapshot);
              return (
                <Card key={payout.id}>
                  <CardHeader
                    title={payout.affiliate.fullName}
                    description={`${payout.reference} · ${payout.affiliate.email}`}
                    action={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold tabular-nums">
                          {formatMoney(payout.amountCents, locale)}
                        </span>
                        <StatusBadge
                          status={payout.status}
                          label={t(`status.payout.${payout.status}`)}
                        />
                      </div>
                    }
                  />

                  <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-3">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                        {t("admin.payouts.payoutDetails")}
                      </p>
                      {snapshot ? (
                        <dl className="mt-2 space-y-1.5 text-sm">
                          {snapshot.method ? (
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-2">{t("payoutMethod.label")}</dt>
                              <dd className="text-ink/90">
                                {t(`payoutMethod.${snapshot.method}`)}
                              </dd>
                            </div>
                          ) : null}
                          {snapshot.accountName ? (
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-2">
                                {t("affiliate.payoutDetails.accountName")}
                              </dt>
                              <dd className="text-right text-ink/90">
                                {snapshot.accountName}
                              </dd>
                            </div>
                          ) : null}
                          {snapshot.iban ? (
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-2">
                                {t("affiliate.payoutDetails.iban")}
                              </dt>
                              <dd className="break-all text-right font-mono text-xs text-ink/90">
                                {snapshot.iban}
                              </dd>
                            </div>
                          ) : null}
                          {snapshot.paypalEmail ? (
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-2">
                                {t("affiliate.payoutDetails.paypalEmail")}
                              </dt>
                              <dd className="break-all text-right text-ink/90">
                                {snapshot.paypalEmail}
                              </dd>
                            </div>
                          ) : null}
                          {snapshot.otherDetails ? (
                            <p className="text-ink/90">{snapshot.otherDetails}</p>
                          ) : null}
                        </dl>
                      ) : (
                        <p className="mt-2 text-sm text-muted-2">
                          {t("admin.affiliates.payoutInfoEmpty")}
                        </p>
                      )}
                      {payout.transactionReference ? (
                        <p className="mt-3 text-xs text-muted">
                          {t("affiliate.payouts.transactionRef")}:{" "}
                          <span className="font-mono text-ink/90">
                            {payout.transactionReference}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                        {t("admin.payouts.commissions")} ({payout.commissions.length})
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {payout.commissions.map((commission) => (
                          <li
                            key={commission.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="truncate text-muted">
                              {commission.customer.fullName}
                            </span>
                            <span className="shrink-0 tabular-nums text-ink/90">
                              {formatMoney(commission.commissionAmountCents, locale)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                        {t("admin.payouts.history")}
                      </p>
                      <ol className="mt-2 space-y-2">
                        {payout.statusHistory.map((entry) => (
                          <li key={entry.id} className="flex items-start gap-2.5">
                            <Badge tone="violet" className="mt-0.5 shrink-0">
                              {t(`status.payout.${entry.toStatus}`)}
                            </Badge>
                            <div className="min-w-0">
                              <p className="text-[0.68rem] text-muted-2">
                                {formatDateTime.format(entry.createdAt)}
                              </p>
                              {entry.actorEmail ? (
                                <p className="truncate text-[0.68rem] text-muted-2">
                                  {entry.actorEmail}
                                </p>
                              ) : null}
                              {entry.note ? (
                                <p className="text-xs text-muted">{entry.note}</p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-white/8 px-5 py-4 sm:px-6">
                    <PayoutActions
                      payoutId={payout.id}
                      status={payout.status}
                      affiliateName={payout.affiliate.fullName}
                      amountLabel={formatMoney(payout.amountCents, locale)}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination page={page} pages={pages} total={total} />
        </>
      )}
    </div>
  );
}
