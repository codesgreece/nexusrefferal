"use client";

import * as React from "react";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/actions/auth";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [done, setDone] = React.useState(false);
  const [resetPath, setResetPath] = React.useState<string | null>(null);

  const form = useActionForm(forgotPasswordAction, {
    onSuccess: (data) => {
      setDone(true);
      setResetPath(data.resetPath);
    },
  });

  if (done) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success" message={t("auth.forgotDone")} />
        {resetPath ? (
          <FormAlert tone="info">
            <p className="text-xs">{t("auth.forgotDevLink")}</p>
            <Link
              href={resetPath}
              className="block break-all text-xs font-medium underline underline-offset-2"
            >
              {resetPath}
            </Link>
          </FormAlert>
        ) : null}
        <Button asChild variant="secondary" block>
          <Link href="/login">{t("auth.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
      <FormAlert message={form.formError} />

      <Field label={t("common.email")} htmlFor="email" required error={form.errorFor("email")}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@example.com"
          aria-invalid={Boolean(form.errorFor("email"))}
        />
      </Field>

      <Button type="submit" size="lg" block disabled={form.pending}>
        {form.pending ? t("common.loading") : t("auth.forgotCta")}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="text-violet-300 transition-colors hover:text-violet-200"
        >
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
