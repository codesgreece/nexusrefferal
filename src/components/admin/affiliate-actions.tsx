"use client";

import * as React from "react";
import { BadgeCheck, Ban, Play, Ticket, XCircle } from "lucide-react";

import {
  approveAffiliateAction,
  changeReferralCodeAction,
  reactivateAffiliateAction,
  rejectAffiliateAction,
  suspendAffiliateAction,
  toggleReferralCodeAction,
} from "@/app/actions/admin-affiliates";
import { ActionModal, ReasonModal } from "@/components/admin/action-modal";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

type Size = ButtonProps["size"];

export function ApproveAffiliateButton({
  affiliateId,
  name,
  suggestedCode,
  size = "sm",
}: {
  affiliateId: string;
  name: string;
  suggestedCode: string;
  size?: Size;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={approveAffiliateAction}
      hiddenFields={{ affiliateId }}
      title={t("admin.affiliates.approveTitle")}
      description={t("admin.affiliates.approveBody", { name })}
      confirmLabel={t("admin.affiliates.approve")}
      confirmVariant="positive"
      successMessage={t("admin.affiliates.approve")}
      trigger={(open) => (
        <Button variant="positive" size={size} onClick={open}>
          <BadgeCheck />
          {t("admin.affiliates.approve")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <div className="space-y-4">
          <Field
            label={t("admin.affiliates.approveCodeLabel")}
            htmlFor="referralCode"
            required
            description={t("admin.affiliates.approveCodeHint")}
            error={errorFor("referralCode")}
          >
            <Input
              id="referralCode"
              name="referralCode"
              defaultValue={suggestedCode}
              maxLength={20}
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono tracking-[0.14em] uppercase"
              required
            />
          </Field>
          <Field
            label={t("common.internalNotes")}
            htmlFor="internalNotes"
            hint={t("common.optional")}
            error={errorFor("internalNotes")}
          >
            <Textarea id="internalNotes" name="internalNotes" rows={2} maxLength={1000} />
          </Field>
        </div>
      )}
    </ActionModal>
  );
}

export function RejectAffiliateButton({
  affiliateId,
  name,
  size = "sm",
}: {
  affiliateId: string;
  name: string;
  size?: Size;
}) {
  const { t } = useI18n();

  return (
    <ReasonModal
      action={rejectAffiliateAction}
      hiddenFields={{ affiliateId }}
      title={t("admin.affiliates.rejectTitle")}
      description={t("admin.affiliates.rejectBody", { name })}
      confirmLabel={t("admin.affiliates.reject")}
      confirmVariant="danger"
      trigger={(open) => (
        <Button variant="danger" size={size} onClick={open}>
          <XCircle />
          {t("admin.affiliates.reject")}
        </Button>
      )}
    />
  );
}

export function SuspendAffiliateButton({
  affiliateId,
  name,
  size = "sm",
}: {
  affiliateId: string;
  name: string;
  size?: Size;
}) {
  const { t } = useI18n();

  return (
    <ReasonModal
      action={suspendAffiliateAction}
      hiddenFields={{ affiliateId }}
      title={t("admin.affiliates.suspendTitle")}
      description={t("admin.affiliates.suspendBody", { name })}
      confirmLabel={t("admin.affiliates.suspend")}
      confirmVariant="danger"
      trigger={(open) => (
        <Button variant="danger" size={size} onClick={open}>
          <Ban />
          {t("admin.affiliates.suspend")}
        </Button>
      )}
    />
  );
}

export function ReactivateAffiliateButton({
  affiliateId,
  name,
  size = "sm",
}: {
  affiliateId: string;
  name: string;
  size?: Size;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={reactivateAffiliateAction}
      hiddenFields={{ affiliateId }}
      title={t("admin.affiliates.reactivateTitle")}
      description={t("admin.affiliates.reactivateBody", { name })}
      confirmLabel={t("admin.affiliates.reactivate")}
      confirmVariant="positive"
      trigger={(open) => (
        <Button variant="positive" size={size} onClick={open}>
          <Play />
          {t("admin.affiliates.reactivate")}
        </Button>
      )}
    />
  );
}

export function ChangeReferralCodeButton({
  affiliateId,
  currentCode,
}: {
  affiliateId: string;
  currentCode: string | null;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={changeReferralCodeAction}
      hiddenFields={{ affiliateId }}
      title={t("admin.affiliates.changeCodeTitle")}
      description={t("admin.affiliates.changeCodeBody")}
      confirmLabel={t("common.update")}
      trigger={(open) => (
        <Button variant="secondary" size="sm" onClick={open}>
          <Ticket />
          {t("admin.affiliates.changeCodeTitle")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <Field
          label={t("admin.affiliates.code")}
          htmlFor="newReferralCode"
          required
          description={t("admin.affiliates.approveCodeHint")}
          error={errorFor("referralCode")}
        >
          <Input
            id="newReferralCode"
            name="referralCode"
            defaultValue={currentCode ?? ""}
            maxLength={20}
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono tracking-[0.14em] uppercase"
            required
          />
        </Field>
      )}
    </ActionModal>
  );
}

export function ToggleReferralCodeButton({
  referralCodeId,
  isActive,
}: {
  referralCodeId: string;
  isActive: boolean;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={toggleReferralCodeAction}
      hiddenFields={
        isActive ? { referralCodeId } : { referralCodeId, isActive: "on" }
      }
      title={
        isActive ? t("admin.affiliates.disableCode") : t("admin.affiliates.enableCode")
      }
      description={t("admin.affiliates.changeCodeBody")}
      confirmLabel={t("common.confirm")}
      confirmVariant={isActive ? "danger" : "positive"}
      trigger={(open) => (
        <Button variant={isActive ? "danger" : "positive"} size="sm" onClick={open}>
          {isActive ? t("admin.affiliates.disableCode") : t("admin.affiliates.enableCode")}
        </Button>
      )}
    />
  );
}
