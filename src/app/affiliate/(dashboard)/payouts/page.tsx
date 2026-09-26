import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
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
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { getPayoutBalance, listPayouts } from "@/lib/services/payouts";
import { getSettings } from "@/lib/services/settings";
import { RequestPayoutButton } from "./request-payout";

export const metadata: Metadata = { title: "Payouts" };

export default async function AffiliatePayoutsPage() {
  const user = await requireActiveAffiliatePage();
  const { t, locale } = await getI18n();

  const [balance, payouts, settings] = await Promise.all([
    getPayoutBalance(user.affiliateId),
    listPayouts({ affiliateId: user.affiliateId, perPage: 50 }),
    getSettings(),
  ]);

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const instructions =
    locale === "el" ? settings.paymentInstructionsEl : settings.paymentInstructionsEn;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("affiliate.payouts.title")}
        description={t("affiliate.payouts.subtitle")}
      />

      <StatGrid cols={3}>
        <StatCard
          label={t("affiliate.stats.availableBalance")}
          value={formatMoney(balance.availableCents, locale)}
          tone="violet"
          icon={<Wallet />}
          sublabel={t("affiliate.payouts.minimum", {
            amount: formatMoney(balance.minPayoutCents, locale),
          })}
        />
        <StatCard
          label={t("affiliate.stats.pendingBalance")}
          value={formatMoney(balance.pendingCents, locale)}
          tone="caution"
        />
        <StatCard
          label={t("affiliate.stats.paidTotal")}
          value={formatMoney(balance.paidCents, locale)}
          tone="positive"
        />
      </StatGrid>

      <Card>
        <CardBody>
          <RequestPayoutButton balance={balance} />
          {instructions ? (
            <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-relaxed text-muted-2">
              {instructions}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("affiliate.payouts.historyTitle")} />
        {payouts.total === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title={t("affiliate.payouts.emptyTitle")}
            body={t("affiliate.payouts.emptyBody")}
            compact
          />
        ) : (
          <>
            <TableShell className="border-0 shadow-none">
              <Thead>
                <Th>{t("affiliate.payouts.reference")}</Th>
                <Th align="right">{t("common.amount")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("affiliate.payouts.requestedAt")}</Th>
                <Th>{t("common.paid")}</Th>
                <Th>{t("affiliate.payouts.transactionRef")}</Th>
                <Th>{t("affiliate.nav.commissions")}</Th>
              </Thead>
              <Tbody>
                {payouts.rows.map((payout) => (
                  <Tr key={payout.id}>
                    <Td>
                      <span className="font-mono text-xs text-muted">{payout.reference}</span>
                    </Td>
                    <Td align="right" className="font-semibold tabular-nums">
                      {formatMoney(payout.amountCents, locale)}
                    </Td>
                    <Td>
                      <StatusBadge
                        status={payout.status}
                        label={t(`status.payout.${payout.status}`)}
                      />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate.format(payout.requestedAt)}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {payout.paidAt ? formatDate.format(payout.paidAt) : "—"}
                    </Td>
                    <Td className="text-muted">
                      {payout.transactionReference ?? "—"}
                    </Td>
                    <Td className="text-muted">{payout._count.commissions}</Td>
                  </Tr>
                ))}
              </Tbody>
            </TableShell>

            <MobileCardList className="p-4">
              {payouts.rows.map((payout) => (
                <MobileCard
                  key={payout.id}
                  title={formatMoney(payout.amountCents, locale)}
                  subtitle={payout.reference}
                  badge={
                    <StatusBadge
                      status={payout.status}
                      label={t(`status.payout.${payout.status}`)}
                    />
                  }
                  rows={[
                    {
                      label: t("affiliate.payouts.requestedAt"),
                      value: formatDate.format(payout.requestedAt),
                    },
                    {
                      label: t("common.paid"),
                      value: payout.paidAt ? formatDate.format(payout.paidAt) : "—",
                    },
                    {
                      label: t("affiliate.nav.commissions"),
                      value: payout._count.commissions,
                    },
                    {
                      label: t("affiliate.payouts.transactionRef"),
                      value: payout.transactionReference ?? "—",
                    },
                  ]}
                  footer={
                    payout.rejectionReason ? (
                      <p className="text-xs text-danger">{payout.rejectionReason}</p>
                    ) : null
                  }
                />
              ))}
            </MobileCardList>
          </>
        )}
      </Card>
    </div>
  );
}
