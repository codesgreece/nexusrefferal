"use client";

import { Save } from "lucide-react";

import { updateAffiliateAction } from "@/app/actions/admin-affiliates";
import { FormAlert } from "@/components/forms/form-error";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

export function AffiliateDetailsForm({
  affiliateId,
  initial,
}: {
  affiliateId: string;
  initial: {
    fullName: string;
    phone: string;
    bio: string;
    internalNotes: string;
    tiktok: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}) {
  const { t } = useI18n();
  const form = useActionForm(updateAffiliateAction, {
    successMessage: t("common.saved"),
  });

  return (
    <Card>
      <CardHeader title={t("common.edit")} description={t("admin.affiliates.internalNotesHint")} />
      <CardBody>
        <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
          <input type="hidden" name="affiliateId" value={affiliateId} />
          <FormAlert message={form.formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("common.fullName")}
              htmlFor="adminFullName"
              required
              error={form.errorFor("fullName")}
            >
              <Input
                id="adminFullName"
                name="fullName"
                defaultValue={initial.fullName}
                required
              />
            </Field>
            <Field
              label={t("common.phone")}
              htmlFor="adminPhone"
              required
              error={form.errorFor("phone")}
            >
              <Input id="adminPhone" name="phone" defaultValue={initial.phone} required />
            </Field>
            <Field label={t("auth.tiktok")} htmlFor="adminTiktok">
              <Input id="adminTiktok" name="tiktok" defaultValue={initial.tiktok} />
            </Field>
            <Field label={t("auth.instagram")} htmlFor="adminInstagram">
              <Input id="adminInstagram" name="instagram" defaultValue={initial.instagram} />
            </Field>
            <Field label={t("auth.facebook")} htmlFor="adminFacebook">
              <Input id="adminFacebook" name="facebook" defaultValue={initial.facebook} />
            </Field>
            <Field label={t("auth.youtube")} htmlFor="adminYoutube">
              <Input id="adminYoutube" name="youtube" defaultValue={initial.youtube} />
            </Field>
          </div>

          <Field label={t("auth.bio")} htmlFor="adminBio" error={form.errorFor("bio")}>
            <Textarea id="adminBio" name="bio" rows={3} defaultValue={initial.bio} />
          </Field>

          <Field
            label={t("common.internalNotes")}
            htmlFor="adminNotes"
            description={t("admin.affiliates.internalNotesHint")}
            error={form.errorFor("internalNotes")}
          >
            <Textarea
              id="adminNotes"
              name="internalNotes"
              rows={3}
              defaultValue={initial.internalNotes}
            />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.pending}>
              {form.pending ? t("common.saving") : t("common.save")}
              {form.pending ? null : <Save />}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
