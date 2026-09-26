"use client";

import * as React from "react";
import { Lock, Save, ShieldCheck } from "lucide-react";

import { changePasswordAction } from "@/app/actions/auth";
import {
  updateAffiliateProfileAction,
  updatePayoutDetailsAction,
} from "@/app/actions/affiliate";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { PAYOUT_METHODS } from "@/lib/domain";

export function ProfileForm({
  initial,
}: {
  initial: {
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    locale: string;
    tiktok: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}) {
  const { t } = useI18n();
  const form = useActionForm(updateAffiliateProfileAction, {
    successMessage: t("affiliate.profile.updated"),
  });

  return (
    <Card>
      <CardHeader
        title={t("affiliate.profile.accountSection")}
        description={t("affiliate.profile.subtitle")}
      />
      <CardBody>
        <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
          <FormAlert message={form.formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("common.fullName")}
              htmlFor="fullName"
              required
              error={form.errorFor("fullName")}
            >
              <Input
                id="fullName"
                name="fullName"
                defaultValue={initial.fullName}
                required
                aria-invalid={Boolean(form.errorFor("fullName"))}
              />
            </Field>
            <Field
              label={t("common.email")}
              htmlFor="emailReadonly"
              description={t("affiliate.payoutDetails.securityNote")}
            >
              <Input
                id="emailReadonly"
                value={initial.email}
                readOnly
                disabled
                className="opacity-70"
              />
            </Field>
            <Field
              label={t("common.phone")}
              htmlFor="phone"
              required
              error={form.errorFor("phone")}
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={initial.phone}
                required
                aria-invalid={Boolean(form.errorFor("phone"))}
              />
            </Field>
            <Field
              label={t("affiliate.profile.languageSection")}
              htmlFor="locale"
              error={form.errorFor("locale")}
            >
              <Select id="locale" name="locale" defaultValue={initial.locale}>
                {LOCALES.map((locale) => (
                  <option key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t("auth.bio")} htmlFor="bio" error={form.errorFor("bio")}>
            <Textarea id="bio" name="bio" rows={3} defaultValue={initial.bio} maxLength={1000} />
          </Field>

          <div className="space-y-4 border-t border-white/8 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
              {t("affiliate.profile.socialSection")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("auth.tiktok")} htmlFor="tiktok">
                <Input id="tiktok" name="tiktok" defaultValue={initial.tiktok} placeholder="@handle" />
              </Field>
              <Field label={t("auth.instagram")} htmlFor="instagram">
                <Input
                  id="instagram"
                  name="instagram"
                  defaultValue={initial.instagram}
                  placeholder="@handle"
                />
              </Field>
              <Field label={t("auth.facebook")} htmlFor="facebook">
                <Input id="facebook" name="facebook" defaultValue={initial.facebook} />
              </Field>
              <Field label={t("auth.youtube")} htmlFor="youtube">
                <Input id="youtube" name="youtube" defaultValue={initial.youtube} />
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.pending}>
              {form.pending ? t("common.saving") : t("common.save")}
              {form.pending ? null : <Save />}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function PayoutDetailsForm({
  initial,
}: {
  initial: {
    payoutMethod: string;
    payoutAccountName: string;
    payoutIban: string;
    payoutBankName: string;
    payoutPaypalEmail: string;
    payoutOtherDetails: string;
  };
}) {
  const { t } = useI18n();
  const [method, setMethod] = React.useState(initial.payoutMethod || "BANK_TRANSFER");
  const form = useActionForm(updatePayoutDetailsAction, {
    successMessage: t("common.saved"),
  });

  return (
    <Card id="payout">
      <CardHeader
        icon={<ShieldCheck className="size-4" />}
        title={t("affiliate.payoutDetails.title")}
        description={t("affiliate.payoutDetails.subtitle")}
      />
      <CardBody>
        <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
          <FormAlert message={form.formError} />

          <Field
            label={t("payoutMethod.label")}
            htmlFor="payoutMethod"
            required
            error={form.errorFor("payoutMethod")}
          >
            <Select
              id="payoutMethod"
              name="payoutMethod"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              {PAYOUT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {t(`payoutMethod.${option}`)}
                </option>
              ))}
            </Select>
          </Field>

          {method === "BANK_TRANSFER" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("affiliate.payoutDetails.accountName")}
                htmlFor="payoutAccountName"
                required
                error={form.errorFor("payoutAccountName")}
              >
                <Input
                  id="payoutAccountName"
                  name="payoutAccountName"
                  defaultValue={initial.payoutAccountName}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={t("affiliate.payoutDetails.bankName")}
                htmlFor="payoutBankName"
                error={form.errorFor("payoutBankName")}
              >
                <Input
                  id="payoutBankName"
                  name="payoutBankName"
                  defaultValue={initial.payoutBankName}
                  autoComplete="off"
                />
              </Field>
              <Field
                label={t("affiliate.payoutDetails.iban")}
                htmlFor="payoutIban"
                required
                error={form.errorFor("payoutIban")}
                className="sm:col-span-2"
              >
                <Input
                  id="payoutIban"
                  name="payoutIban"
                  defaultValue={initial.payoutIban}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </Field>
            </div>
          ) : null}

          {method === "PAYPAL" ? (
            <Field
              label={t("affiliate.payoutDetails.paypalEmail")}
              htmlFor="payoutPaypalEmail"
              required
              error={form.errorFor("payoutPaypalEmail")}
            >
              <Input
                id="payoutPaypalEmail"
                name="payoutPaypalEmail"
                type="email"
                defaultValue={initial.payoutPaypalEmail}
                autoComplete="off"
              />
            </Field>
          ) : null}

          {method === "OTHER" ? (
            <Field
              label={t("affiliate.payoutDetails.otherDetails")}
              htmlFor="payoutOtherDetails"
              required
              error={form.errorFor("payoutOtherDetails")}
            >
              <Textarea
                id="payoutOtherDetails"
                name="payoutOtherDetails"
                rows={3}
                defaultValue={initial.payoutOtherDetails}
                placeholder={t("affiliate.payoutDetails.otherPlaceholder")}
              />
            </Field>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={form.pending}>
              {form.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function ChangePasswordForm() {
  const { t } = useI18n();
  const formRef = React.useRef<HTMLFormElement>(null);
  const form = useActionForm(changePasswordAction, {
    successMessage: t("common.saved"),
    onSuccess: () => formRef.current?.reset(),
  });

  return (
    <Card>
      <CardHeader
        icon={<Lock className="size-4" />}
        title={t("affiliate.profile.securitySection")}
      />
      <CardBody>
        <form ref={formRef} onSubmit={form.onSubmit} className="space-y-5" noValidate>
          <FormAlert message={form.formError} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("auth.currentPassword")}
              htmlFor="currentPassword"
              required
              error={form.errorFor("currentPassword")}
            >
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field
              label={t("auth.newPassword")}
              htmlFor="newPassword"
              required
              error={form.errorFor("password")}
            >
              <Input
                id="newPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </Field>
            <Field
              label={t("auth.confirmPassword")}
              htmlFor="confirmNewPassword"
              required
              error={form.errorFor("confirmPassword")}
            >
              <Input
                id="confirmNewPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={form.pending}>
              {form.pending ? t("common.saving") : t("auth.changePassword")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
