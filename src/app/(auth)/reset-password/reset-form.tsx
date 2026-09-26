"use client";

import * as React from "react";
import Link from "next/link";

import { resetPasswordAction } from "@/app/actions/auth";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [done, setDone] = React.useState(false);
  const form = useActionForm(resetPasswordAction, { onSuccess: () => setDone(true) });

  if (!token) {
    return (
      <div className="space-y-4">
        <FormAlert message={t("errors.resetTokenInvalid")} />
        <Button asChild variant="secondary" block>
          <Link href="/forgot-password">{t("auth.forgotCta")}</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success" message={t("auth.resetDone")} />
        <Button asChild size="lg" block>
          <Link href="/login">{t("auth.loginCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormAlert message={form.formError} />

      <Field
        label={t("auth.newPassword")}
        htmlFor="password"
        required
        error={form.errorFor("password")}
        description={t("validation.password")}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={Boolean(form.errorFor("password"))}
        />
      </Field>

      <Field
        label={t("auth.confirmPassword")}
        htmlFor="confirmPassword"
        required
        error={form.errorFor("confirmPassword")}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(form.errorFor("confirmPassword"))}
        />
      </Field>

      <Button type="submit" size="lg" block disabled={form.pending}>
        {form.pending ? t("common.saving") : t("auth.resetCta")}
      </Button>
    </form>
  );
}
