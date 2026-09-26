"use client";

import * as React from "react";
import { Save } from "lucide-react";

import { updateSettingsAction } from "@/app/actions/admin-config";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, FormSection, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { COMMISSION_TYPES } from "@/lib/domain";

export type SettingsValues = {
  programName: string;
  programActive: boolean;
  minPayout: string;
  referralCookieDays: string;
  domainFee: string;
  defaultCommissionType: string;
  defaultCommissionFixed: string;
  defaultCommissionPercent: string;
  contactEmail: string;
  termsUrl: string;
  privacyUrl: string;
  paymentInstructionsEn: string;
  paymentInstructionsEl: string;
  termsContentEn: string;
  termsContentEl: string;
  privacyContentEn: string;
  privacyContentEl: string;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const { t } = useI18n();
  const form = useActionForm(updateSettingsAction, { successMessage: t("common.saved") });

  return (
    <Card>
      <CardHeader
        title={t("admin.settings.programSection")}
        description={t("admin.settings.subtitle")}
      />
      <form onSubmit={form.onSubmit} noValidate>
        <CardBody className="space-y-8">
          <FormAlert
            message={
              form.formError && Object.keys(form.fieldErrors).length === 0
                ? form.formError
                : Object.keys(form.fieldErrors).length > 0
                  ? t("errors.validation")
                  : null
            }
          />

          <FormSection title={t("admin.settings.programSection")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("admin.settings.programName")}
                htmlFor="programName"
                required
                error={form.errorFor("programName")}
              >
                <Input
                  id="programName"
                  name="programName"
                  defaultValue={initial.programName}
                  required
                />
              </Field>
              <Field
                label={t("admin.settings.contactEmail")}
                htmlFor="contactEmail"
                required
                error={form.errorFor("contactEmail")}
              >
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={initial.contactEmail}
                  required
                />
              </Field>
            </div>
            <Checkbox
              name="programActive"
              value="on"
              defaultChecked={initial.programActive}
              label={
                <span>
                  {t("admin.settings.programActive")}
                  <span className="mt-0.5 block text-xs text-muted-2">
                    {t("admin.settings.programActiveHint")}
                  </span>
                </span>
              }
            />
          </FormSection>

          <FormSection title={t("admin.settings.payoutSection")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label={t("admin.settings.minPayout")}
                htmlFor="minPayout"
                required
                error={form.errorFor("minPayout")}
              >
                <Input
                  id="minPayout"
                  name="minPayout"
                  inputMode="decimal"
                  defaultValue={initial.minPayout}
                  required
                />
              </Field>
              <Field
                label={t("admin.settings.referralCookieDays")}
                htmlFor="referralCookieDays"
                required
                error={form.errorFor("referralCookieDays")}
              >
                <Input
                  id="referralCookieDays"
                  name="referralCookieDays"
                  inputMode="numeric"
                  defaultValue={initial.referralCookieDays}
                  required
                />
              </Field>
              <Field
                label={t("admin.settings.domainFee")}
                htmlFor="domainFee"
                required
                error={form.errorFor("domainFee")}
              >
                <Input
                  id="domainFee"
                  name="domainFee"
                  inputMode="decimal"
                  defaultValue={initial.domainFee}
                  required
                />
              </Field>
              <Field
                label={t("admin.settings.defaultCommissionType")}
                htmlFor="defaultCommissionType"
                error={form.errorFor("defaultCommissionType")}
              >
                <Select
                  id="defaultCommissionType"
                  name="defaultCommissionType"
                  defaultValue={initial.defaultCommissionType}
                >
                  {COMMISSION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "FIXED"
                        ? t("admin.services.commissionTypeFixed")
                        : t("admin.services.commissionTypePercent")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t("admin.settings.defaultCommissionFixed")}
                htmlFor="defaultCommissionFixed"
                error={form.errorFor("defaultCommissionFixed")}
              >
                <Input
                  id="defaultCommissionFixed"
                  name="defaultCommissionFixed"
                  inputMode="decimal"
                  defaultValue={initial.defaultCommissionFixed}
                />
              </Field>
              <Field
                label={t("admin.settings.defaultCommissionPercent")}
                htmlFor="defaultCommissionPercent"
                error={form.errorFor("defaultCommissionPercent")}
              >
                <Input
                  id="defaultCommissionPercent"
                  name="defaultCommissionPercent"
                  inputMode="decimal"
                  defaultValue={initial.defaultCommissionPercent}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t("admin.settings.contentSection")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("admin.settings.termsUrl")}
                htmlFor="termsUrl"
                required
                error={form.errorFor("termsUrl")}
              >
                <Input id="termsUrl" name="termsUrl" defaultValue={initial.termsUrl} required />
              </Field>
              <Field
                label={t("admin.settings.privacyUrl")}
                htmlFor="privacyUrl"
                required
                error={form.errorFor("privacyUrl")}
              >
                <Input
                  id="privacyUrl"
                  name="privacyUrl"
                  defaultValue={initial.privacyUrl}
                  required
                />
              </Field>
              <Field
                label={t("admin.settings.paymentInstructionsEn")}
                htmlFor="paymentInstructionsEn"
                error={form.errorFor("paymentInstructionsEn")}
              >
                <Textarea
                  id="paymentInstructionsEn"
                  name="paymentInstructionsEn"
                  rows={3}
                  defaultValue={initial.paymentInstructionsEn}
                />
              </Field>
              <Field
                label={t("admin.settings.paymentInstructionsEl")}
                htmlFor="paymentInstructionsEl"
                error={form.errorFor("paymentInstructionsEl")}
              >
                <Textarea
                  id="paymentInstructionsEl"
                  name="paymentInstructionsEl"
                  rows={3}
                  defaultValue={initial.paymentInstructionsEl}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t("admin.settings.legalSection")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("admin.settings.termsContentEn")}
                htmlFor="termsContentEn"
                error={form.errorFor("termsContentEn")}
              >
                <Textarea
                  id="termsContentEn"
                  name="termsContentEn"
                  rows={10}
                  defaultValue={initial.termsContentEn}
                  className="font-mono text-xs"
                />
              </Field>
              <Field
                label={t("admin.settings.termsContentEl")}
                htmlFor="termsContentEl"
                error={form.errorFor("termsContentEl")}
              >
                <Textarea
                  id="termsContentEl"
                  name="termsContentEl"
                  rows={10}
                  defaultValue={initial.termsContentEl}
                  className="font-mono text-xs"
                />
              </Field>
              <Field
                label={t("admin.settings.privacyContentEn")}
                htmlFor="privacyContentEn"
                error={form.errorFor("privacyContentEn")}
              >
                <Textarea
                  id="privacyContentEn"
                  name="privacyContentEn"
                  rows={8}
                  defaultValue={initial.privacyContentEn}
                  className="font-mono text-xs"
                />
              </Field>
              <Field
                label={t("admin.settings.privacyContentEl")}
                htmlFor="privacyContentEl"
                error={form.errorFor("privacyContentEl")}
              >
                <Textarea
                  id="privacyContentEl"
                  name="privacyContentEl"
                  rows={8}
                  defaultValue={initial.privacyContentEl}
                  className="font-mono text-xs"
                />
              </Field>
            </div>
          </FormSection>
        </CardBody>

        <CardFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? t("common.saving") : t("common.save")}
            {form.pending ? null : <Save />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
