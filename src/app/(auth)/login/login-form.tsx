"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { loginAction } from "@/app/actions/auth";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const form = useActionForm(loginAction, {
    onSuccess: (data) => {
      router.replace(data.redirectTo);
      // Ensures server components re-read the new session.
      router.refresh();
    },
  });

  return (
    <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormAlert message={form.formError} />

      <Field label={t("common.email")} htmlFor="email" required error={form.errorFor("email")}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="name@example.com"
          aria-invalid={Boolean(form.errorFor("email"))}
        />
      </Field>

      <Field
        label={t("common.password")}
        htmlFor="password"
        required
        error={form.errorFor("password")}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(form.errorFor("password"))}
        />
      </Field>

      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-violet-300 transition-colors hover:text-violet-200"
        >
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <Button type="submit" size="lg" block disabled={form.pending}>
        {form.pending ? t("common.loading") : t("auth.loginCta")}
        {form.pending ? null : <LogIn />}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link
          href="/affiliate/register"
          className="font-medium text-violet-300 transition-colors hover:text-violet-200"
        >
          {t("auth.registerLink")}
        </Link>
      </p>
    </form>
  );
}
