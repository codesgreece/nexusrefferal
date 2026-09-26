"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

import {
  assignLeadAction,
  changeLeadStatusAction,
  convertLeadAction,
  createLeadAction,
  deleteLeadAction,
  updateLeadAction,
} from "@/app/actions/admin-pipeline";
import { ActionModal } from "@/components/admin/action-modal";
import { FormAlert } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { ATTRIBUTION_METHODS, LEAD_STATUSES } from "@/lib/domain";

export type AffiliateOption = {
  id: string;
  name: string;
  code: string | null;
};

export type ServiceOption = { id: string; name: string };

export type LeadFormValues = {
  leadId?: string;
  customerName: string;
  businessName: string;
  email: string;
  phone: string;
  serviceId: string;
  message: string;
  status: string;
  estimatedAmount: string;
  internalNotes: string;
  affiliateId: string;
  attributionMethod: string;
  attributionSource: string;
  attributionNotes: string;
};

const EMPTY_LEAD: LeadFormValues = {
  customerName: "",
  businessName: "",
  email: "",
  phone: "",
  serviceId: "",
  message: "",
  status: "NEW",
  estimatedAmount: "",
  internalNotes: "",
  affiliateId: "",
  attributionMethod: "",
  attributionSource: "",
  attributionNotes: "",
};

function LeadFields({
  values,
  affiliates,
  services,
  errorFor,
}: {
  values: LeadFormValues;
  affiliates: AffiliateOption[];
  services: ServiceOption[];
  errorFor: (name: string) => string | undefined;
}) {
  const { t } = useI18n();
  const [affiliateId, setAffiliateId] = React.useState(values.affiliateId);
  const selected = affiliates.find((entry) => entry.id === affiliateId);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("common.fullName")}
          htmlFor="leadCustomerName"
          required
          error={errorFor("customerName")}
        >
          <Input
            id="leadCustomerName"
            name="customerName"
            defaultValue={values.customerName}
            required
          />
        </Field>
        <Field
          label={t("common.businessName")}
          htmlFor="leadBusinessName"
          hint={t("common.optional")}
          error={errorFor("businessName")}
        >
          <Input
            id="leadBusinessName"
            name="businessName"
            defaultValue={values.businessName}
          />
        </Field>
        <Field
          label={t("common.email")}
          htmlFor="leadEmail"
          required
          error={errorFor("email")}
        >
          <Input
            id="leadEmail"
            name="email"
            type="email"
            defaultValue={values.email}
            required
          />
        </Field>
        <Field
          label={t("common.phone")}
          htmlFor="leadPhone"
          hint={t("common.optional")}
          error={errorFor("phone")}
        >
          <Input id="leadPhone" name="phone" type="tel" defaultValue={values.phone} />
        </Field>
        <Field label={t("common.service")} htmlFor="leadServiceId" error={errorFor("serviceId")}>
          <Select id="leadServiceId" name="serviceId" defaultValue={values.serviceId}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.status")} htmlFor="leadStatus" required error={errorFor("status")}>
          <Select id="leadStatus" name="status" defaultValue={values.status}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.lead.${status}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("admin.leads.estimatedAmount")}
          htmlFor="leadEstimatedAmount"
          hint="€"
          error={errorFor("estimatedAmount")}
        >
          <Input
            id="leadEstimatedAmount"
            name="estimatedAmount"
            inputMode="decimal"
            defaultValue={values.estimatedAmount}
            placeholder="200"
          />
        </Field>
      </div>

      <Field label={t("contact.messageLabel")} htmlFor="leadMessage" error={errorFor("message")}>
        <Textarea id="leadMessage" name="message" rows={3} defaultValue={values.message} />
      </Field>

      <div className="space-y-4 rounded-2xl border border-violet-500/22 bg-violet-500/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/85">
          {t("attribution.label")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("admin.leads.affiliate")}
            htmlFor="leadAffiliateId"
            error={errorFor("affiliateId")}
          >
            <Select
              id="leadAffiliateId"
              name="affiliateId"
              value={affiliateId}
              onChange={(event) => setAffiliateId(event.target.value)}
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
            htmlFor="leadAttributionMethod"
            error={errorFor("attributionMethod")}
          >
            <Select
              id="leadAttributionMethod"
              name="attributionMethod"
              defaultValue={values.attributionMethod}
              disabled={!affiliateId}
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
            label={t("admin.tracking.source")}
            htmlFor="leadAttributionSource"
            hint={t("common.optional")}
            error={errorFor("attributionSource")}
          >
            <Input
              id="leadAttributionSource"
              name="attributionSource"
              defaultValue={values.attributionSource}
              placeholder="TikTok DM"
              disabled={!affiliateId}
            />
          </Field>
          <Field
            label={t("admin.leads.referralCode")}
            htmlFor="leadReferralCodePreview"
            description={t("admin.leads.assignBody")}
          >
            <Input
              id="leadReferralCodePreview"
              value={selected?.code ?? ""}
              readOnly
              disabled
              placeholder="—"
              className="font-mono uppercase opacity-70"
            />
          </Field>
        </div>

        <Field
          label={t("common.notes")}
          htmlFor="leadAttributionNotes"
          hint={t("common.optional")}
          error={errorFor("attributionNotes")}
        >
          <Textarea
            id="leadAttributionNotes"
            name="attributionNotes"
            rows={2}
            defaultValue={values.attributionNotes}
            disabled={!affiliateId}
          />
        </Field>
      </div>

      <Field
        label={t("common.internalNotes")}
        htmlFor="leadInternalNotes"
        error={errorFor("internalNotes")}
      >
        <Textarea
          id="leadInternalNotes"
          name="internalNotes"
          rows={2}
          defaultValue={values.internalNotes}
        />
      </Field>
    </div>
  );
}

export function CreateLeadButton({
  affiliates,
  services,
}: {
  affiliates: AffiliateOption[];
  services: ServiceOption[];
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={createLeadAction}
      title={t("admin.leads.createTitle")}
      confirmLabel={t("common.create")}
      successMessage={t("common.saved")}
      size="lg"
      trigger={(open) => (
        <Button size="sm" onClick={open}>
          <Plus />
          {t("admin.leads.create")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <LeadFields
          values={EMPTY_LEAD}
          affiliates={affiliates}
          services={services}
          errorFor={errorFor}
        />
      )}
    </ActionModal>
  );
}

export function EditLeadButton({
  values,
  affiliates,
  services,
}: {
  values: LeadFormValues;
  affiliates: AffiliateOption[];
  services: ServiceOption[];
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={updateLeadAction}
      hiddenFields={{ leadId: values.leadId! }}
      title={t("admin.leads.editTitle")}
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
        <LeadFields
          values={values}
          affiliates={affiliates}
          services={services}
          errorFor={errorFor}
        />
      )}
    </ActionModal>
  );
}

export function AssignLeadButton({
  leadId,
  currentAffiliateId,
  currentMethod,
  affiliates,
}: {
  leadId: string;
  currentAffiliateId: string;
  currentMethod: string;
  affiliates: AffiliateOption[];
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={assignLeadAction}
      hiddenFields={{ leadId }}
      title={t("admin.leads.assignTitle")}
      description={t("admin.leads.assignBody")}
      confirmLabel={t("common.confirm")}
      successMessage={t("common.saved")}
      size="md"
      trigger={(open) => (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={open}
          aria-label={t("admin.leads.assignTitle")}
        >
          <Users />
        </Button>
      )}
    >
      {({ errorFor }) => (
        <div className="space-y-4">
          <Field
            label={t("admin.leads.affiliate")}
            htmlFor="assignAffiliateId"
            error={errorFor("affiliateId")}
          >
            <Select
              id="assignAffiliateId"
              name="affiliateId"
              defaultValue={currentAffiliateId}
            >
              <option value="">{t("admin.leads.clearAttribution")}</option>
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
            htmlFor="assignMethod"
            error={errorFor("attributionMethod")}
          >
            <Select id="assignMethod" name="attributionMethod" defaultValue={currentMethod}>
              <option value="">{t("common.selectPlaceholder")}</option>
              {ATTRIBUTION_METHODS.map((method) => (
                <option key={method} value={method}>
                  {t(`attribution.${method}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("admin.tracking.source")}
            htmlFor="assignSource"
            hint={t("common.optional")}
            error={errorFor("attributionSource")}
          >
            <Input id="assignSource" name="attributionSource" placeholder="TikTok DM" />
          </Field>
          <Field
            label={t("common.notes")}
            htmlFor="assignNotes"
            hint={t("common.optional")}
            error={errorFor("attributionNotes")}
          >
            <Textarea id="assignNotes" name="attributionNotes" rows={2} />
          </Field>
        </div>
      )}
    </ActionModal>
  );
}

export function ConvertLeadButton({
  leadId,
  customerId,
}: {
  leadId: string;
  customerId: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [duplicates, setDuplicates] = React.useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);

  if (customerId) {
    return (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => router.push(`/admin/customers?q=${encodeURIComponent(customerId)}`)}
      >
        {t("admin.leads.customerRecord")}
      </Button>
    );
  }

  return (
    <ActionModal
      action={async (formData) => {
        const result = await convertLeadAction(formData);
        if (!result.ok && result.error === "errors.duplicateCustomer" && result.detail) {
          try {
            setDuplicates(JSON.parse(result.detail));
          } catch {
            setDuplicates([]);
          }
        }
        return result;
      }}
      hiddenFields={{ leadId }}
      title={t("admin.leads.convertTitle")}
      description={t("admin.leads.convertBody")}
      confirmLabel={t("admin.leads.convert")}
      successMessage={t("admin.leads.converted")}
      onDone={() => {
        setDuplicates([]);
        toast.success(t("admin.leads.converted"));
      }}
      trigger={(open) => (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={open}
          aria-label={t("admin.leads.convert")}
        >
          <UserCheck />
        </Button>
      )}
    >
      {duplicates.length > 0 ? (
        <div className="space-y-3">
          <FormAlert tone="warning" message={t("admin.customers.duplicateWarning")} />
          <ul className="space-y-2">
            {duplicates.map((duplicate) => (
              <li
                key={duplicate.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5"
              >
                <p className="text-sm text-ink">{duplicate.fullName}</p>
                <p className="text-xs text-muted-2">{duplicate.email}</p>
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              name="acknowledgeDuplicate"
              value="on"
              className="mt-0.5 size-4 rounded border-white/20 bg-surface-2"
              required
            />
            <span>{t("common.confirm")}</span>
          </label>
        </div>
      ) : null}
    </ActionModal>
  );
}

export function DeleteLeadButton({ leadId, reference }: { leadId: string; reference: string }) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={deleteLeadAction}
      hiddenFields={{ leadId }}
      title={t("admin.leads.deleteTitle")}
      description={`${reference} — ${t("admin.leads.deleteBody")}`}
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

export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Select
      value={status}
      disabled={pending}
      aria-label={t("common.status")}
      className="h-8 min-w-32 text-xs"
      onChange={async (event) => {
        setPending(true);
        const formData = new FormData();
        formData.set("leadId", leadId);
        formData.set("status", event.target.value);
        const result = await changeLeadStatusAction(formData);
        if (result.ok) {
          toast.success(t("common.saved"));
          router.refresh();
        } else {
          toast.error(t(result.error));
        }
        setPending(false);
      }}
    >
      {LEAD_STATUSES.map((entry) => (
        <option key={entry} value={entry}>
          {t(`status.lead.${entry}`)}
        </option>
      ))}
    </Select>
  );
}
