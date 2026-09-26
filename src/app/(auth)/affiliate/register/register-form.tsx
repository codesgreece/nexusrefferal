"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { registerAffiliateAction } from "@/app/actions/auth";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormSection, Input, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function RegisterForm({
  termsUrl,
  privacyUrl,
}: {
  termsUrl: string;
  privacyUrl: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [done, setDone] = React.useState(false);

  const form = useActionForm(registerAffiliateAction, {
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="space-y-5">
        <FormAlert tone="success" message={t("auth.registerDoneBody")} />
        <Button
          size="lg"
          block
          onClick={() => {
            router.push("/affiliate/status");
            router.refresh();
          }}
        >
          {t("common.dashboard")}
        </Button>
      </div>
    );
  }

  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);

  return (
    <form onSubmit={form.onSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <FormAlert
        message={
          form.formError && Object.keys(form.fieldErrors).length === 0
            ? form.formError
            : Object.keys(form.fieldErrors).length > 0
              ? t("errors.validation")
              : null
        }
      />

      <FormSection title={t("auth.sectionPersonal")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("common.fullName")}
            htmlFor="fullName"
            required
            error={form.errorFor("fullName")}
          >
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              aria-invalid={Boolean(form.errorFor("fullName"))}
            />
          </Field>
          <Field
            label={t("common.phone")}
            htmlFor="phone"
            required
            error={form.errorFor("phone")}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              placeholder="+30 69XXXXXXXX"
              aria-invalid={Boolean(form.errorFor("phone"))}
            />
          </Field>
          <Field
            label={t("auth.dateOfBirth")}
            htmlFor="dateOfBirth"
            required
            error={form.errorFor("dateOfBirth")}
            className="sm:col-span-2 sm:max-w-xs"
          >
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              max={maxBirthDate.toISOString().slice(0, 10)}
              aria-invalid={Boolean(form.errorFor("dateOfBirth"))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("auth.sectionAccount")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("common.email")}
            htmlFor="email"
            required
            error={form.errorFor("email")}
            className="sm:col-span-2"
          >
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
          <Field
            label={t("common.password")}
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
        </div>
      </FormSection>

      <FormSection title={t("auth.sectionSocial")} description={t("auth.socialHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("auth.tiktok")} htmlFor="tiktok" error={form.errorFor("tiktok")}>
            <Input id="tiktok" name="tiktok" placeholder="@handle" />
          </Field>
          <Field
            label={t("auth.instagram")}
            htmlFor="instagram"
            error={form.errorFor("instagram")}
          >
            <Input id="instagram" name="instagram" placeholder="@handle" />
          </Field>
          <Field label={t("auth.facebook")} htmlFor="facebook" error={form.errorFor("facebook")}>
            <Input id="facebook" name="facebook" placeholder="facebook.com/…" />
          </Field>
          <Field
            label={t("auth.youtube")}
            htmlFor="youtube"
            hint={t("common.optional")}
            error={form.errorFor("youtube")}
          >
            <Input id="youtube" name="youtube" placeholder="@channel" />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("auth.sectionAbout")}>
        <div className="space-y-4">
          <Field label={t("auth.bio")} htmlFor="bio" required error={form.errorFor("bio")}>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              required
              maxLength={1000}
              placeholder={t("auth.bioPlaceholder")}
              aria-invalid={Boolean(form.errorFor("bio"))}
            />
          </Field>
          <Field
            label={t("auth.motivation")}
            htmlFor="motivation"
            required
            error={form.errorFor("motivation")}
          >
            <Textarea
              id="motivation"
              name="motivation"
              rows={4}
              required
              maxLength={1000}
              placeholder={t("auth.motivationPlaceholder")}
              aria-invalid={Boolean(form.errorFor("motivation"))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t("auth.sectionLegal")}>
        <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <Checkbox name="adultConfirm" value="on" label={t("auth.adultConfirm")} />
          {form.errorFor("adultConfirm") ? (
            <p className="pl-8 text-xs text-danger">{t(form.errorFor("adultConfirm")!)}</p>
          ) : null}

          <Checkbox
            name="acceptTerms"
            value="on"
            label={
              <>
                {t("auth.termsAccept")}{" "}
                <Link
                  href={termsUrl}
                  target="_blank"
                  className="text-violet-300 underline underline-offset-2"
                >
                  {t("nav.terms")}
                </Link>
              </>
            }
          />
          {form.errorFor("acceptTerms") ? (
            <p className="pl-8 text-xs text-danger">{t(form.errorFor("acceptTerms")!)}</p>
          ) : null}

          <Checkbox
            name="acceptPrivacy"
            value="on"
            label={
              <>
                {t("auth.privacyAccept")}{" "}
                <Link
                  href={privacyUrl}
                  target="_blank"
                  className="text-violet-300 underline underline-offset-2"
                >
                  {t("nav.privacy")}
                </Link>
              </>
            }
          />
          {form.errorFor("acceptPrivacy") ? (
            <p className="pl-8 text-xs text-danger">{t(form.errorFor("acceptPrivacy")!)}</p>
          ) : null}
        </div>
      </FormSection>

      <div className="flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-violet-300 transition-colors hover:text-violet-200"
          >
            {t("auth.loginLink")}
          </Link>
        </p>
        <Button type="submit" size="lg" disabled={form.pending} className="sm:min-w-52">
          {form.pending ? t("common.submitting") : t("auth.registerCta")}
          {form.pending ? null : <Send />}
        </Button>
      </div>
    </form>
  );
}
