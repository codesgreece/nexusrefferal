"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  checkDuplicateCustomerAction,
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from "@/app/actions/admin-pipeline";
import { ActionModal } from "@/components/admin/action-modal";
import { FormAlert } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { ATTRIBUTION_METHODS, CUSTOMER_STATUSES } from "@/lib/domain";
import type { AffiliateOption, ServiceOption } from "./lead-actions";

export type CustomerFormValues = {
  customerId?: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  serviceId: string;
  affiliateId: string;
  attributionMethod: string;
  source: string;
  status: string;
  internalNotes: string;
};

const EMPTY: CustomerFormValues = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  serviceId: "",
  affiliateId: "",
  attributionMethod: "",
  source: "",
  status: "ACTIVE",
  internalNotes: "",
};

function CustomerFields({
  values,
  affiliates,
  services,
  errorFor,
  showDuplicateCheck,
}: {
  values: CustomerFormValues;
  affiliates: AffiliateOption[];
  services: ServiceOption[];
  errorFor: (name: string) => string | undefined;
  showDuplicateCheck: boolean;
}) {
  const { t } = useI18n();
  const [email, setEmail] = React.useState(values.email);
  const [phone, setPhone] = React.useState(values.phone);
  const [duplicates, setDuplicates] = React.useState<
    Array<{ id: string; fullName: string; email: string; phone: string | null }>
  >([]);

  const canCheck = showDuplicateCheck && email.includes("@");
  const visibleDuplicates = canCheck ? duplicates : [];

  // Duplicate detection runs while typing so the admin sees the clash before
  // submitting rather than as a rejection afterwards.
  React.useEffect(() => {
    if (!canCheck) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkDuplicateCustomerAction(email, phone || undefined);
      if (!cancelled && result.ok) setDuplicates(result.data);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, phone, canCheck]);

  return (
    <div className="space-y-5">
      {visibleDuplicates.length > 0 ? (
        <FormAlert tone="warning" message={t("admin.customers.duplicateWarning")}>
          <ul className="mt-1 space-y-1">
            {visibleDuplicates.map((duplicate) => (
              <li key={duplicate.id} className="text-xs">
                {duplicate.fullName} · {duplicate.email}
                {duplicate.phone ? ` · ${duplicate.phone}` : ""}
              </li>
            ))}
          </ul>
          <Checkbox
            name="acknowledgeDuplicate"
            value="on"
            className="mt-2"
            label={<span className="text-xs">{t("common.confirm")}</span>}
          />
        </FormAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("common.fullName")}
          htmlFor="customerFullName"
          required
          error={errorFor("fullName")}
        >
          <Input
            id="customerFullName"
            name="fullName"
            defaultValue={values.fullName}
            required
          />
        </Field>
        <Field
          label={t("common.businessName")}
          htmlFor="customerBusinessName"
          hint={t("common.optional")}
          error={errorFor("businessName")}
        >
          <Input
            id="customerBusinessName"
            name="businessName"
            defaultValue={values.businessName}
          />
        </Field>
        <Field
          label={t("common.email")}
          htmlFor="customerEmail"
          required
          error={errorFor("email")}
        >
          <Input
            id="customerEmail"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field
          label={t("common.phone")}
          htmlFor="customerPhone"
          hint={t("common.optional")}
          error={errorFor("phone")}
        >
          <Input
            id="customerPhone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field
          label={t("common.service")}
          htmlFor="customerServiceId"
          error={errorFor("serviceId")}
        >
          <Select id="customerServiceId" name="serviceId" defaultValue={values.serviceId}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("common.status")}
          htmlFor="customerStatus"
          required
          error={errorFor("status")}
        >
          <Select id="customerStatus" name="status" defaultValue={values.status}>
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.customer.${status}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("admin.leads.affiliate")}
          htmlFor="customerAffiliateId"
          error={errorFor("affiliateId")}
        >
          <Select
            id="customerAffiliateId"
            name="affiliateId"
            defaultValue={values.affiliateId}
          >
            <option value="">{t("common.unassigned")}</option>
            {affiliates.map((affiliate) => (
              <option key={affiliate.id} value={affiliate.id}>
                {affiliate.name}
                {affiliate.code ? ` · ${affiliate.code}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("attribution.label")}
          htmlFor="customerAttributionMethod"
          error={errorFor("attributionMethod")}
        >
          <Select
            id="customerAttributionMethod"
            name="attributionMethod"
            defaultValue={values.attributionMethod}
          >
            <option value="">{t("common.selectPlaceholder")}</option>
            {ATTRIBUTION_METHODS.map((method) => (
              <option key={method} value={method}>
                {t(`attribution.${method}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("admin.customers.source")}
          htmlFor="customerSource"
          hint={t("common.optional")}
          error={errorFor("source")}
          className="sm:col-span-2"
        >
          <Input
            id="customerSource"
            name="source"
            defaultValue={values.source}
            placeholder="Instagram DM"
          />
        </Field>
      </div>

      <Field
        label={t("common.internalNotes")}
        htmlFor="customerNotes"
        error={errorFor("internalNotes")}
      >
        <Textarea
          id="customerNotes"
          name="internalNotes"
          rows={2}
          defaultValue={values.internalNotes}
        />
      </Field>
    </div>
  );
}

export function CreateCustomerButton({
  affiliates,
  services,
}: {
  affiliates: AffiliateOption[];
  services: ServiceOption[];
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={createCustomerAction}
      title={t("admin.customers.createTitle")}
      confirmLabel={t("common.create")}
      successMessage={t("common.saved")}
      size="lg"
      trigger={(open) => (
        <Button size="sm" onClick={open}>
          <Plus />
          {t("admin.customers.create")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <CustomerFields
          values={EMPTY}
          affiliates={affiliates}
          services={services}
          errorFor={errorFor}
          showDuplicateCheck
        />
      )}
    </ActionModal>
  );
}

export function EditCustomerButton({
  values,
  affiliates,
  services,
}: {
  values: CustomerFormValues;
  affiliates: AffiliateOption[];
  services: ServiceOption[];
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={updateCustomerAction}
      hiddenFields={{ customerId: values.customerId! }}
      title={t("admin.customers.editTitle")}
      confirmLabel={t("common.save")}
      successMessage={t("common.saved")}
      size="lg"
      trigger={(open) => (
        <Button variant="ghost" size="icon-sm" onClick={open} aria-label={t("common.edit")}>
          <Pencil />
        </Button>
      )}
    >
      {({ errorFor }) => (
        <CustomerFields
          values={values}
          affiliates={affiliates}
          services={services}
          errorFor={errorFor}
          showDuplicateCheck={false}
        />
      )}
    </ActionModal>
  );
}

export function DeleteCustomerButton({
  customerId,
  name,
}: {
  customerId: string;
  name: string;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={deleteCustomerAction}
      hiddenFields={{ customerId }}
      title={t("admin.customers.deleteTitle")}
      description={`${name} — ${t("admin.customers.deleteBody")}`}
      confirmLabel={t("common.delete")}
      confirmVariant="danger"
      trigger={(open) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={open}
          aria-label={t("common.delete")}
          className="text-muted-2 hover:text-danger"
        >
          <Trash2 />
        </Button>
      )}
    />
  );
}
