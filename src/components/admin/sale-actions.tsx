"use client";

import * as React from "react";
import { BadgeEuro, Pencil, Plus, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  confirmPaymentAction,
  createSaleAction,
  refundSaleAction,
  updateSaleAction,
} from "@/app/actions/admin-pipeline";
import { ActionModal, ReasonModal } from "@/components/admin/action-modal";
import { FormAlert } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/domain";
import { formatMoney, parseEurosToCents } from "@/lib/money";

export type CustomerOption = {
  id: string;
  label: string;
  affiliateName: string | null;
  referralCode: string | null;
};

export type SaleServiceOption = {
  id: string;
  name: string;
  startingPriceCents: number;
  commissionType: string;
  commissionFixedCents: number | null;
  commissionPercent: number | null;
};

/**
 * Mirrors the server-side commission calculation so the administrator can see
 * what will be generated. The authoritative value is always recomputed on the
 * server when the payment is confirmed.
 */
function previewCommission(service: SaleServiceOption | undefined, amountCents: number) {
  if (!service) return 0;
  if (service.commissionType === "PERCENT") {
    return Math.round((amountCents * (service.commissionPercent ?? 0)) / 100);
  }
  return service.commissionFixedCents ?? 0;
}

function SaleFields({
  customers,
  services,
  domainFeeCents,
  errorFor,
  initial,
  lockAmount = false,
  showPaymentStatus = true,
}: {
  customers: CustomerOption[];
  services: SaleServiceOption[];
  domainFeeCents: number;
  errorFor: (name: string) => string | undefined;
  initial?: {
    customerId?: string;
    serviceId?: string;
    amount?: string;
    domainIncluded?: boolean;
    saleDate?: string;
    paymentStatus?: string;
    orderStatus?: string;
    paymentReference?: string;
    internalNotes?: string;
  };
  lockAmount?: boolean;
  showPaymentStatus?: boolean;
}) {
  const { t, locale } = useI18n();
  const [customerId, setCustomerId] = React.useState(initial?.customerId ?? "");
  const [serviceId, setServiceId] = React.useState(initial?.serviceId ?? services[0]?.id ?? "");
  const [amount, setAmount] = React.useState(initial?.amount ?? "");
  const [domainIncluded, setDomainIncluded] = React.useState(initial?.domainIncluded ?? false);

  const service = services.find((entry) => entry.id === serviceId);
  const customer = customers.find((entry) => entry.id === customerId);

  // Default the amount to the service's published starting price.
  React.useEffect(() => {
    if (lockAmount || initial?.amount) return;
    if (service) setAmount((service.startingPriceCents / 100).toFixed(2));
  }, [service, lockAmount, initial?.amount]);

  const amountCents = parseEurosToCents(amount) ?? 0;
  const totalCents = amountCents + (domainIncluded ? domainFeeCents : 0);
  const commissionCents = previewCommission(service, amountCents);

  return (
    <div className="space-y-5">
      {customers.length > 0 ? (
        <Field
          label={t("admin.sales.customer")}
          htmlFor="saleCustomerId"
          required
          error={errorFor("customerId")}
        >
          <Select
            id="saleCustomerId"
            name="customerId"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
          >
            <option value="">{t("admin.sales.selectCustomer")}</option>
            {customers.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {customer ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-xs">
          <p className="text-muted-2">{t("admin.sales.attributionFromCustomer")}</p>
          <p className="mt-1 text-ink/90">
            {customer.affiliateName
              ? `${customer.affiliateName}${customer.referralCode ? ` · ${customer.referralCode}` : ""}`
              : t("admin.sales.noAffiliateNoCommission")}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("common.service")}
          htmlFor="saleServiceId"
          required
          error={errorFor("serviceId")}
        >
          <Select
            id="saleServiceId"
            name="serviceId"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            disabled={lockAmount}
            required
          >
            {services.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("admin.sales.amount")}
          htmlFor="saleAmount"
          hint="€"
          required
          error={errorFor("amount")}
        >
          <Input
            id="saleAmount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            readOnly={lockAmount}
            disabled={lockAmount}
            required
          />
        </Field>
        <Field
          label={t("admin.sales.saleDate")}
          htmlFor="saleDate"
          required
          error={errorFor("saleDate")}
        >
          <Input
            id="saleDate"
            name="saleDate"
            type="date"
            defaultValue={initial?.saleDate ?? new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>
        <Field
          label={t("admin.sales.orderStatus")}
          htmlFor="saleOrderStatus"
          required
          error={errorFor("orderStatus")}
        >
          <Select
            id="saleOrderStatus"
            name="orderStatus"
            defaultValue={initial?.orderStatus ?? "OPEN"}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.order.${status}`)}
              </option>
            ))}
          </Select>
        </Field>
        {showPaymentStatus ? (
          <Field
            label={t("admin.sales.paymentStatus")}
            htmlFor="salePaymentStatus"
            required
            error={errorFor("paymentStatus")}
          >
            <Select
              id="salePaymentStatus"
              name="paymentStatus"
              defaultValue={initial?.paymentStatus ?? "PENDING"}
            >
              {PAYMENT_STATUSES.filter(
                (status) => status === "PENDING" || status === "PAID",
              ).map((status) => (
                <option key={status} value={status}>
                  {t(`status.payment.${status}`)}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field
          label={t("admin.sales.paymentReference")}
          htmlFor="salePaymentReference"
          hint={t("common.optional")}
          error={errorFor("paymentReference")}
        >
          <Input
            id="salePaymentReference"
            name="paymentReference"
            defaultValue={initial?.paymentReference ?? ""}
          />
        </Field>
      </div>

      <Checkbox
        name="domainIncluded"
        value="on"
        defaultChecked={domainIncluded}
        onChange={(event) => setDomainIncluded(event.currentTarget.checked)}
        label={`${t("admin.sales.domainIncluded")} (+${formatMoney(domainFeeCents, locale)})`}
      />

      <div className="space-y-2 rounded-2xl border border-violet-500/22 bg-violet-500/[0.05] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("admin.sales.totalAmount")}</span>
          <span className="font-semibold text-ink tabular-nums">
            {formatMoney(totalCents, locale)}
          </span>
        </div>
        <div className="h-px bg-white/8" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("admin.sales.commissionPreview")}</span>
          <span className="font-semibold tabular-nums text-positive">
            {customer?.affiliateName
              ? formatMoney(commissionCents, locale)
              : t("admin.sales.noAffiliateNoCommission")}
          </span>
        </div>
      </div>

      <Field
        label={t("common.internalNotes")}
        htmlFor="saleNotes"
        error={errorFor("internalNotes")}
      >
        <Textarea
          id="saleNotes"
          name="internalNotes"
          rows={2}
          defaultValue={initial?.internalNotes ?? ""}
        />
      </Field>
    </div>
  );
}

export function CreateSaleButton({
  customers,
  services,
  domainFeeCents,
  leadId,
  label,
}: {
  customers: CustomerOption[];
  services: SaleServiceOption[];
  domainFeeCents: number;
  leadId?: string;
  label?: string;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={createSaleAction}
      hiddenFields={leadId ? { leadId } : undefined}
      title={t("admin.sales.createTitle")}
      confirmLabel={t("common.create")}
      size="lg"
      onDone={(data) => {
        if (data.commissionCreated) toast.success(t("admin.sales.commissionGenerated"));
      }}
      trigger={(open) => (
        <Button size="sm" onClick={open} disabled={customers.length === 0}>
          <Plus />
          {label ?? t("admin.sales.create")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <SaleFields
          customers={customers}
          services={services}
          domainFeeCents={domainFeeCents}
          errorFor={errorFor}
        />
      )}
    </ActionModal>
  );
}

export function EditSaleButton({
  saleId,
  hasCommission,
  services,
  domainFeeCents,
  initial,
}: {
  saleId: string;
  hasCommission: boolean;
  services: SaleServiceOption[];
  domainFeeCents: number;
  initial: {
    serviceId: string;
    amount: string;
    domainIncluded: boolean;
    saleDate: string;
    orderStatus: string;
    paymentReference: string;
    internalNotes: string;
  };
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={updateSaleAction}
      hiddenFields={{ saleId }}
      title={t("admin.sales.editTitle")}
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
        <div className="space-y-4">
          {hasCommission ? (
            <FormAlert tone="info" message={t("affiliate.leads.noteLocked")} />
          ) : null}
          <SaleFields
            customers={[]}
            services={services}
            domainFeeCents={domainFeeCents}
            errorFor={errorFor}
            initial={initial}
            lockAmount={hasCommission}
            showPaymentStatus={false}
          />
        </div>
      )}
    </ActionModal>
  );
}

export function ConfirmPaymentButton({
  saleId,
  amountLabel,
}: {
  saleId: string;
  amountLabel: string;
}) {
  const { t } = useI18n();

  return (
    <ActionModal
      action={confirmPaymentAction}
      hiddenFields={{ saleId }}
      title={t("admin.sales.confirmPaymentTitle")}
      description={`${amountLabel} — ${t("admin.sales.confirmPaymentBody")}`}
      confirmLabel={t("admin.sales.confirmPayment")}
      confirmVariant="positive"
      onDone={(data) => {
        if (data.commissionCreated) toast.success(t("admin.sales.commissionGenerated"));
      }}
      trigger={(open) => (
        <Button variant="positive" size="xs" onClick={open}>
          <BadgeEuro />
          {t("admin.sales.confirmPayment")}
        </Button>
      )}
    >
      {({ errorFor }) => (
        <Field
          label={t("admin.sales.paymentReference")}
          htmlFor="confirmPaymentReference"
          hint={t("common.optional")}
          error={errorFor("paymentReference")}
        >
          <Input id="confirmPaymentReference" name="paymentReference" maxLength={120} />
        </Field>
      )}
    </ActionModal>
  );
}

export function RefundSaleButton({ saleId }: { saleId: string }) {
  const { t } = useI18n();

  return (
    <ReasonModal
      action={refundSaleAction}
      hiddenFields={{ saleId }}
      title={t("admin.sales.refundTitle")}
      description={t("admin.sales.refundBody")}
      confirmLabel={t("admin.sales.refund")}
      confirmVariant="danger"
      trigger={(open) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={open}
          aria-label={t("admin.sales.refund")}
          className="text-muted-2 hover:text-danger"
        >
          <Undo2 />
        </Button>
      )}
    />
  );
}
