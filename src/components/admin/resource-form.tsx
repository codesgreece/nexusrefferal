"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createResourceAction,
  deleteResourceAction,
  updateResourceAction,
} from "@/app/actions/admin-config";
import { ActionModal } from "@/components/admin/action-modal";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { RESOURCE_TYPES } from "@/lib/domain";

export type ResourceFormValues = {
  resourceId?: string;
  titleEn: string;
  titleEl: string;
  descriptionEn: string;
  descriptionEl: string;
  type: string;
  contentEn: string;
  contentEl: string;
  url: string;
  thumbnailUrl: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY: ResourceFormValues = {
  titleEn: "",
  titleEl: "",
  descriptionEn: "",
  descriptionEl: "",
  type: "IDEA",
  contentEn: "",
  contentEl: "",
  url: "",
  thumbnailUrl: "",
  isActive: true,
  sortOrder: "0",
};

function ResourceFields({
  values,
  errorFor,
}: {
  values: ResourceFormValues;
  errorFor: (name: string) => string | undefined;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.resources.titleEn")}
          htmlFor="resourceTitleEn"
          required
          error={errorFor("titleEn")}
        >
          <Input id="resourceTitleEn" name="titleEn" defaultValue={values.titleEn} required />
        </Field>
        <Field
          label={t("admin.resources.titleEl")}
          htmlFor="resourceTitleEl"
          required
          error={errorFor("titleEl")}
        >
          <Input id="resourceTitleEl" name="titleEl" defaultValue={values.titleEl} required />
        </Field>
        <Field
          label={t("admin.resources.descriptionEn")}
          htmlFor="resourceDescriptionEn"
          required
          error={errorFor("descriptionEn")}
        >
          <Textarea
            id="resourceDescriptionEn"
            name="descriptionEn"
            rows={3}
            defaultValue={values.descriptionEn}
            required
          />
        </Field>
        <Field
          label={t("admin.resources.descriptionEl")}
          htmlFor="resourceDescriptionEl"
          required
          error={errorFor("descriptionEl")}
        >
          <Textarea
            id="resourceDescriptionEl"
            name="descriptionEl"
            rows={3}
            defaultValue={values.descriptionEl}
            required
          />
        </Field>
        <Field
          label={t("admin.resources.contentEn")}
          htmlFor="resourceContentEn"
          hint={t("common.optional")}
          error={errorFor("contentEn")}
        >
          <Textarea
            id="resourceContentEn"
            name="contentEn"
            rows={5}
            defaultValue={values.contentEn}
          />
        </Field>
        <Field
          label={t("admin.resources.contentEl")}
          htmlFor="resourceContentEl"
          hint={t("common.optional")}
          error={errorFor("contentEl")}
        >
          <Textarea
            id="resourceContentEl"
            name="contentEl"
            rows={5}
            defaultValue={values.contentEl}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.resources.type")}
          htmlFor="resourceType"
          required
          error={errorFor("type")}
        >
          <Select id="resourceType" name="type" defaultValue={values.type}>
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`resourceType.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("admin.resources.sortOrder")}
          htmlFor="resourceSortOrder"
          error={errorFor("sortOrder")}
        >
          <Input
            id="resourceSortOrder"
            name="sortOrder"
            inputMode="numeric"
            defaultValue={values.sortOrder}
          />
        </Field>
        <Field
          label={t("admin.resources.url")}
          htmlFor="resourceUrl"
          hint={t("common.optional")}
          error={errorFor("url")}
        >
          <Input id="resourceUrl" name="url" defaultValue={values.url} placeholder="https://" />
        </Field>
        <Field
          label={t("admin.resources.thumbnail")}
          htmlFor="resourceThumbnailUrl"
          hint={t("common.optional")}
          error={errorFor("thumbnailUrl")}
        >
          <Input
            id="resourceThumbnailUrl"
            name="thumbnailUrl"
            defaultValue={values.thumbnailUrl}
            placeholder="https://"
          />
        </Field>
      </div>

      <Checkbox
        name="isActive"
        value="on"
        defaultChecked={values.isActive}
        label={t("admin.resources.active")}
      />
    </div>
  );
}

export function CreateResourceButton() {
  const { t } = useI18n();

  return (
    <ActionModal
      action={createResourceAction}
      title={t("admin.resources.createTitle")}
      confirmLabel={t("common.create")}
      successMessage={t("common.saved")}
      size="xl"
      trigger={(open) => (
        <Button size="sm" onClick={open}>
          <Plus />
          {t("admin.resources.create")}
        </Button>
      )}
    >
      {({ errorFor }) => <ResourceFields values={EMPTY} errorFor={errorFor} />}
    </ActionModal>
  );
}

export function EditResourceButton({ values }: { values: ResourceFormValues }) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={updateResourceAction}
      hiddenFields={{ resourceId: values.resourceId! }}
      title={t("admin.resources.editTitle")}
      confirmLabel={t("common.save")}
      successMessage={t("common.saved")}
      size="xl"
      trigger={(open) => (
        <Button variant="ghost" size="icon-sm" onClick={open} aria-label={t("common.edit")}>
          <Pencil />
        </Button>
      )}
    >
      {({ errorFor }) => <ResourceFields values={values} errorFor={errorFor} />}
    </ActionModal>
  );
}

export function DeleteResourceButton({
  resourceId,
  title,
}: {
  resourceId: string;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={deleteResourceAction}
      hiddenFields={{ resourceId }}
      title={t("admin.resources.deleteTitle")}
      description={`${title} — ${t("admin.resources.deleteBody")}`}
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
