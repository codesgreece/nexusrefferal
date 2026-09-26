"use client";

import * as React from "react";
import { BadgeCheck, Loader2, Send, Ticket } from "lucide-react";

import { submitPublicLeadAction, validateReferralCodeAction } from "@/app/actions/leads";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

type CodeState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid"; affiliateName: string }
  | { status: "invalid" };

export function ContactForm({
  services,
  presetService,
  presetCode,
  hasCookieAttribution,
}: {
  services: Array<{ id: string; name: string }>;
  presetService: string;
  presetCode: string;
  hasCookieAttribution: boolean;
}) {
  const { t } = useI18n();
  const [code, setCode] = React.useState(presetCode);
  const [codeState, setCodeState] = React.useState<CodeState>({ status: "idle" });
  const [success, setSuccess] = React.useState<{
    reference: string;
    attributed: boolean;
    affiliateName: string | null;
  } | null>(null);

  const form = useActionForm(submitPublicLeadAction, {
    onSuccess: (data) => setSuccess(data),
  });

  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const tooShort = normalizedCode.length < 3;
  // A code that is too short to be valid never shows feedback, so the state is
  // derived rather than written back from the effect.
  const visibleCodeState: CodeState = tooShort ? { status: "idle" } : codeState;

  // Debounced server-side validation of the referral code.
  React.useEffect(() => {
    if (normalizedCode.length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setCodeState({ status: "checking" });
      const result = await validateReferralCodeAction(normalizedCode);
      if (cancelled) return;
      setCodeState(
        result.ok
          ? { status: "valid", affiliateName: result.data.affiliateName }
          : { status: "invalid" },
      );
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedCode]);

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="relative mx-auto grid size-16 place-items-center">
          <div
            aria-hidden
            className="absolute size-16 rounded-full bg-positive/20 blur-xl animate-pulse-glow"
          />
          <div className="relative grid size-14 place-items-center rounded-2xl border border-positive/30 bg-positive/10 text-positive">
            <BadgeCheck className="size-7" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-ink">{t("contact.successTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted">{t("contact.successBody")}</p>
        </div>
        <div className="mx-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <Ticket className="size-4 text-violet-300" />
          <span className="text-xs uppercase tracking-wide text-muted-2">
            {t("contact.successReference")}
          </span>
          <span className="font-mono text-sm font-semibold text-ink">{success.reference}</span>
        </div>
        {success.attributed && success.affiliateName ? (
          <FormAlert tone="info" message={t("contact.referredBanner")} />
        ) : null}
        <Button
          variant="secondary"
          block
          onClick={() => {
            setSuccess(null);
            setCode("");
            setCodeState({ status: "idle" });
          }}
        >
          {t("contact.another")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
      {hasCookieAttribution && !code ? (
        <FormAlert tone="info" message={t("contact.referredBanner")} />
      ) : null}

      <FormAlert
        message={
          form.formError && Object.keys(form.fieldErrors).length === 0 ? form.formError : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("common.fullName")}
          htmlFor="customerName"
          required
          error={form.errorFor("customerName")}
        >
          <Input
            id="customerName"
            name="customerName"
            autoComplete="name"
            required
            aria-invalid={Boolean(form.errorFor("customerName"))}
          />
        </Field>
        <Field
          label={t("common.businessName")}
          htmlFor="businessName"
          hint={t("common.optional")}
          error={form.errorFor("businessName")}
        >
          <Input id="businessName" name="businessName" autoComplete="organization" />
        </Field>
        <Field
          label={t("common.email")}
          htmlFor="email"
          required
          error={form.errorFor("email")}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(form.errorFor("email"))}
          />
        </Field>
        <Field
          label={t("common.phone")}
          htmlFor="phone"
          hint={t("common.optional")}
          error={form.errorFor("phone")}
        >
          <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </Field>
      </div>

      <Field
        label={t("contact.serviceLabel")}
        htmlFor="serviceId"
        hint={t("common.optional")}
        error={form.errorFor("serviceId")}
      >
        <Select id="serviceId" name="serviceId" defaultValue={presetService}>
          <option value="">{t("common.selectPlaceholder")}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t("contact.messageLabel")}
        htmlFor="message"
        required
        error={form.errorFor("message")}
      >
        <Textarea
          id="message"
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder={t("contact.messagePlaceholder")}
          aria-invalid={Boolean(form.errorFor("message"))}
        />
      </Field>

      <Field
        label={t("contact.referralLabel")}
        htmlFor="referralCode"
        hint={t("common.optional")}
        description={t("contact.referralHint")}
        error={form.errorFor("referralCode")}
      >
        <div className="relative">
          <Input
            id="referralCode"
            name="referralCode"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t("contact.referralPlaceholder")}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            className="pr-11 font-mono tracking-[0.12em]"
            aria-invalid={visibleCodeState.status === "invalid"}
          />
          {visibleCodeState.status === "checking" ? (
            <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />
          ) : null}
          {visibleCodeState.status === "valid" ? (
            <BadgeCheck className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-positive" />
          ) : null}
        </div>
      </Field>

      {visibleCodeState.status === "valid" ? (
        <p className="flex items-center gap-1.5 text-xs text-positive">
          <BadgeCheck className="size-3.5" />
          {t("contact.referralValid")} · {visibleCodeState.affiliateName}
        </p>
      ) : null}
      {visibleCodeState.status === "invalid" ? (
        <p className="text-xs text-caution">{t("contact.referralInvalid")}</p>
      ) : null}

      <Button type="submit" size="lg" block disabled={form.pending}>
        {form.pending ? t("common.submitting") : t("contact.submit")}
        {form.pending ? null : <Send />}
      </Button>
    </form>
  );
}
