"use client";

import { BadgeCheck, CircleDollarSign, XCircle } from "lucide-react";

import {
  approvePayoutAction,
  markPayoutPaidAction,
  rejectPayoutAction,
} from "@/app/actions/admin-money";
import { ActionModal, ReasonModal } from "@/components/admin/action-modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function PayoutActions({
  payoutId,
  status,
  affiliateName,
  amountLabel,
}: {
  payoutId: string;
  status: string;
  affiliateName: string;
  amountLabel: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status === "REQUESTED" ? (
        <ActionModal
          action={approvePayoutAction}
          hiddenFields={{ payoutId }}
          title={t("admin.payouts.approveTitle")}
          description={t("admin.payouts.approveBody", {
            name: affiliateName,
            amount: amountLabel,
          })}
          confirmLabel={t("admin.payouts.approve")}
          confirmVariant="positive"
          trigger={(open) => (
            <Button variant="positive" size="xs" onClick={open}>
              <BadgeCheck />
              {t("admin.payouts.approve")}
            </Button>
          )}
        >
          {({ errorFor }) => (
            <Field
              label={t("common.notes")}
              htmlFor="payoutApproveNote"
              hint={t("common.optional")}
              error={errorFor("note")}
            >
              <Textarea id="payoutApproveNote" name="note" rows={2} maxLength={1000} />
            </Field>
          )}
        </ActionModal>
      ) : null}

      {status === "APPROVED" ? (
        <ActionModal
          action={markPayoutPaidAction}
          hiddenFields={{ payoutId }}
          title={t("admin.payouts.markPaidTitle")}
          description={`${amountLabel} — ${t("admin.payouts.markPaidBody")}`}
          confirmLabel={t("admin.payouts.markPaid")}
          trigger={(open) => (
            <Button variant="outline" size="xs" onClick={open}>
              <CircleDollarSign />
              {t("admin.payouts.markPaid")}
            </Button>
          )}
        >
          {({ errorFor }) => (
            <div className="space-y-4">
              <Field
                label={t("affiliate.payouts.transactionRef")}
                htmlFor="payoutTransactionReference"
                required
                error={errorFor("transactionReference")}
              >
                <Input
                  id="payoutTransactionReference"
                  name="transactionReference"
                  required
                  maxLength={120}
                />
              </Field>
              <Field
                label={t("common.notes")}
                htmlFor="payoutPaidNote"
                hint={t("common.optional")}
                error={errorFor("note")}
              >
                <Textarea id="payoutPaidNote" name="note" rows={2} maxLength={1000} />
              </Field>
            </div>
          )}
        </ActionModal>
      ) : null}

      {status === "REQUESTED" || status === "APPROVED" ? (
        <ReasonModal
          action={rejectPayoutAction}
          hiddenFields={{ payoutId }}
          title={t("admin.payouts.rejectTitle")}
          description={t("admin.payouts.rejectBody")}
          confirmLabel={t("admin.payouts.reject")}
          confirmVariant="danger"
          trigger={(open) => (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={open}
              aria-label={t("admin.payouts.reject")}
              className="text-muted-2 hover:text-danger"
            >
              <XCircle />
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}
