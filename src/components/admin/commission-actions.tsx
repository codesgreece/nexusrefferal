"use client";

import { BadgeCheck, Ban, CircleDollarSign, XCircle } from "lucide-react";

import {
  approveCommissionAction,
  cancelCommissionAction,
  markCommissionPaidAction,
  rejectCommissionAction,
} from "@/app/actions/admin-money";
import { ActionModal, ReasonModal } from "@/components/admin/action-modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function CommissionActions({
  commissionId,
  status,
  amountLabel,
}: {
  commissionId: string;
  status: string;
  amountLabel: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status === "PENDING" ? (
        <>
          <ActionModal
            action={approveCommissionAction}
            hiddenFields={{ commissionId }}
            title={t("admin.commissions.approveTitle")}
            description={`${amountLabel} — ${t("admin.commissions.approveBody")}`}
            confirmLabel={t("admin.commissions.approve")}
            confirmVariant="positive"
            trigger={(open) => (
              <Button variant="positive" size="xs" onClick={open}>
                <BadgeCheck />
                {t("admin.commissions.approve")}
              </Button>
            )}
          >
            {({ errorFor }) => (
              <Field
                label={t("common.internalNotes")}
                htmlFor="approveNotes"
                hint={t("common.optional")}
                error={errorFor("internalNotes")}
              >
                <Textarea id="approveNotes" name="internalNotes" rows={2} maxLength={1000} />
              </Field>
            )}
          </ActionModal>

          <ReasonModal
            action={rejectCommissionAction}
            hiddenFields={{ commissionId }}
            title={t("admin.commissions.rejectTitle")}
            description={t("admin.commissions.rejectBody")}
            confirmLabel={t("admin.commissions.reject")}
            confirmVariant="danger"
            trigger={(open) => (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={open}
                aria-label={t("admin.commissions.reject")}
                className="text-muted-2 hover:text-danger"
              >
                <XCircle />
              </Button>
            )}
          />
        </>
      ) : null}

      {status === "APPROVED" ? (
        <ActionModal
          action={markCommissionPaidAction}
          hiddenFields={{ commissionId }}
          title={t("admin.commissions.markPaidTitle")}
          description={`${amountLabel} — ${t("admin.commissions.markPaidBody")}`}
          confirmLabel={t("admin.commissions.markPaid")}
          trigger={(open) => (
            <Button variant="outline" size="xs" onClick={open}>
              <CircleDollarSign />
              {t("admin.commissions.markPaid")}
            </Button>
          )}
        >
          {({ errorFor }) => (
            <Field
              label={t("admin.commissions.paymentReference")}
              htmlFor="commissionPaymentReference"
              hint={t("common.optional")}
              error={errorFor("paymentReference")}
            >
              <Input
                id="commissionPaymentReference"
                name="paymentReference"
                maxLength={120}
              />
            </Field>
          )}
        </ActionModal>
      ) : null}

      {status !== "PAID" && status !== "CANCELLED" ? (
        <ReasonModal
          action={cancelCommissionAction}
          hiddenFields={{ commissionId }}
          title={t("admin.commissions.cancelTitle")}
          description={t("admin.commissions.cancelBody")}
          confirmLabel={t("admin.commissions.cancel")}
          confirmVariant="danger"
          trigger={(open) => (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={open}
              aria-label={t("admin.commissions.cancel")}
              className="text-muted-2 hover:text-caution"
            >
              <Ban />
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}
