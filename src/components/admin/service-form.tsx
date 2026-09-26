"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";

import { createServiceAction, updateServiceAction } from "@/app/actions/admin-config";
import { ActionModal } from "@/components/admin/action-modal";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { COMMISSION_TYPES } from "@/lib/domain";

export type ServiceFormValues = {
  serviceId?: string;
  nameEn: string;
  nameEl: string;
  descriptionEn: string;
  descriptionEl: string;
  featuresEn: string;
  featuresEl: string;
  startingPrice: string;
  priceFrom: boolean;
  commissionType: string;
  commissionFixed: string;
  commissionPercent: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY: ServiceFormValues = {
  nameEn: "",
  nameEl: "",
  descriptionEn: "",
  descriptionEl: "",
  featuresEn: "",
  featuresEl: "",
  startingPrice: "",
  priceFrom: false,
  commissionType: "FIXED",
  commissionFixed: "20.00",
  commissionPercent: "10",
  isActive: true,
  sortOrder: "0",
};

function ServiceFields({
  values,
  errorFor,
}: {
  values: ServiceFormValues;
  errorFor: (name: string) => string | undefined;
}) {
  const { t } = useI18n();
  const [commissionType, setCommissionType] = React.useState(values.commissionType);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.services.nameEn")}
          htmlFor="serviceNameEn"
          required
          error={errorFor("nameEn")}
        >
          <Input id="serviceNameEn" name="nameEn" defaultValue={values.nameEn} required />
        </Field>
        <Field
          label={t("admin.services.nameEl")}
          htmlFor="serviceNameEl"
          required
          error={errorFor("nameEl")}
        >
          <Input id="serviceNameEl" name="nameEl" defaultValue={values.nameEl} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.services.descriptionEn")}
          htmlFor="serviceDescriptionEn"
          required
          error={errorFor("descriptionEn")}
        >
          <Textarea
            id="serviceDescriptionEn"
            name="descriptionEn"
            rows={3}
            defaultValue={values.descriptionEn}
            required
          />
        </Field>
        <Field
          label={t("admin.services.descriptionEl")}
          htmlFor="serviceDescriptionEl"
          required
          error={errorFor("descriptionEl")}
        >
          <Textarea
            id="serviceDescriptionEl"
            name="descriptionEl"
            rows={3}
            defaultValue={values.descriptionEl}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.services.featuresEn")}
          htmlFor="serviceFeaturesEn"
          error={errorFor("featuresEn")}
        >
          <Textarea
            id="serviceFeaturesEn"
            name="featuresEn"
            rows={5}
            defaultValue={values.featuresEn}
          />
        </Field>
        <Field
          label={t("admin.services.featuresEl")}
          htmlFor="serviceFeaturesEl"
          error={errorFor("featuresEl")}
        >
          <Textarea
            id="serviceFeaturesEl"
            name="featuresEl"
            rows={5}
            defaultValue={values.featuresEl}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.services.startingPrice")}
          htmlFor="serviceStartingPrice"
          required
          error={errorFor("startingPrice")}
        >
          <Input
            id="serviceStartingPrice"
            name="startingPrice"
            inputMode="decimal"
            defaultValue={values.startingPrice}
            required
          />
        </Field>
        <Field
          label={t("admin.services.sortOrder")}
          htmlFor="serviceSortOrder"
          error={errorFor("sortOrder")}
        >
          <Input
            id="serviceSortOrder"
            name="sortOrder"
            inputMode="numeric"
            defaultValue={values.sortOrder}
          />
        </Field>
      </div>

      <div className="space-y-4 rounded-2xl border border-violet-500/22 bg-violet-500/[0.05] p-4">
        <Field
          label={t("admin.services.commissionType")}
          htmlFor="serviceCommissionType"
          required
          error={errorFor("commissionType")}
        >
          <Select
            id="serviceCommissionType"
            name="commissionType"
            value={commissionType}
            onChange={(event) => setCommissionType(event.target.value)}
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

        {commissionType === "FIXED" ? (
          <Field
            label={t("admin.services.commissionFixed")}
            htmlFor="serviceCommissionFixed"
            required
            error={errorFor("commissionFixed")}
          >
            <Input
              id="serviceCommissionFixed"
              name="commissionFixed"
              inputMode="decimal"
              defaultValue={values.commissionFixed}
            />
          </Field>
        ) : (
          <Field
            label={t("admin.services.commissionPercent")}
            htmlFor="serviceCommissionPercent"
            required
            error={errorFor("commissionPercent")}
          >
            <Input
              id="serviceCommissionPercent"
              name="commissionPercent"
              inputMode="decimal"
              defaultValue={values.commissionPercent}
            />
          </Field>
        )}
      </div>

      <div className="flex flex-wrap gap-5">
        <Checkbox
          name="isActive"
          value="on"
          defaultChecked={values.isActive}
          label={t("admin.services.active")}
        />
        <Checkbox
          name="priceFrom"
          value="on"
          defaultChecked={values.priceFrom}
          label={t("admin.services.priceFrom")}
        />
      </div>
    </div>
  );
}

export function CreateServiceButton() {
  const { t } = useI18n();

  return (
    <ActionModal
      action={createServiceAction}
      title={t("admin.services.createTitle")}
      confirmLabel={t("common.create")}
      successMessage={t("common.saved")}
      size="xl"
      trigger={(open) => (
        <Button size="sm" onClick={open}>
          <Plus />
          {t("admin.services.create")}
        </Button>
      )}
    >
      {({ errorFor }) => <ServiceFields values={EMPTY} errorFor={errorFor} />}
    </ActionModal>
  );
}

export function EditServiceButton({ values }: { values: ServiceFormValues }) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={updateServiceAction}
      hiddenFields={{ serviceId: values.serviceId! }}
      title={t("admin.services.editTitle")}
      confirmLabel={t("common.save")}
      successMessage={t("common.saved")}
      size="xl"
      trigger={(open) => (
        <Button variant="ghost" size="icon-sm" onClick={open} aria-label={t("common.edit")}>
          <Pencil />
        </Button>
      )}
    >
      {({ errorFor }) => <ServiceFields values={values} errorFor={errorFor} />}
    </ActionModal>
  );
}
