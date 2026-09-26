"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

import { requestPayoutAction } from "@/app/actions/affiliate";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";
import { formatMoney } from "@/lib/money";
import type { PayoutBalance } from "@/lib/services/payouts";

export function RequestPayoutButton({ balance }: { balance: PayoutBalance }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const form = useActionForm(requestPayoutAction, {
    successMessage: t("affiliate.payouts.requested"),
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const blockingReason = !balance.hasPayoutDetails
    ? t("affiliate.payouts.detailsMissing")
    : balance.hasOpenRequest
      ? t("affiliate.payouts.pendingRequestExists")
      : balance.availableCents < balance.minPayoutCents
        ? t("affiliate.payouts.belowMinimum", {
            amount: formatMoney(balance.minPayoutCents, locale),
          })
        : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setOpen(true)} disabled={!balance.canRequest}>
          <Wallet />
          {t("affiliate.payouts.requestCta")}
        </Button>
        {!balance.hasPayoutDetails ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/affiliate/profile#payout">{t("affiliate.payouts.addDetails")}</Link>
          </Button>
        ) : null}
      </div>

      {blockingReason ? (
        <p className="mt-2 text-xs text-caution">{blockingReason}</p>
      ) : null}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t("affiliate.payouts.requestTitle")}
        description={t("affiliate.payouts.requestBody", {
          amount: formatMoney(balance.availableCents, locale),
        })}
        size="sm"
      >
        <form id="request-payout" onSubmit={form.onSubmit} className="space-y-4">
          <input type="hidden" name="confirm" value="on" />
          <FormAlert message={form.formError} />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("affiliate.stats.availableBalance")}</span>
              <span className="font-semibold text-ink tabular-nums">
                {formatMoney(balance.availableCents, locale)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-2">{t("affiliate.nav.commissions")}</span>
              <span className="text-muted">
                {t("affiliate.payouts.commissionsIncluded", {
                  count: balance.availableCommissionCount,
                })}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.pending}>
              {form.pending ? t("common.submitting") : t("common.confirm")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
