import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { ChangePasswordForm } from "@/app/affiliate/(dashboard)/profile/profile-forms";
import { requireAdminPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { centsToEuroInput } from "@/lib/money";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const { t } = await getI18n();
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <PageHeader title={t("admin.settings.title")} description={t("admin.settings.subtitle")} />

      <SettingsForm
        initial={{
          programName: settings.programName,
          programActive: settings.programActive,
          minPayout: centsToEuroInput(settings.minPayoutCents),
          referralCookieDays: String(settings.referralCookieDays),
          domainFee: centsToEuroInput(settings.domainFeeCents),
          defaultCommissionType: settings.defaultCommissionType,
          defaultCommissionFixed: centsToEuroInput(settings.defaultCommissionFixedCents),
          defaultCommissionPercent: String(settings.defaultCommissionPercent),
          contactEmail: settings.contactEmail,
          termsUrl: settings.termsUrl,
          privacyUrl: settings.privacyUrl,
          paymentInstructionsEn: settings.paymentInstructionsEn,
          paymentInstructionsEl: settings.paymentInstructionsEl,
          termsContentEn: settings.termsContentEn,
          termsContentEl: settings.termsContentEl,
          privacyContentEn: settings.privacyContentEn,
          privacyContentEl: settings.privacyContentEl,
        }}
      />

      <ChangePasswordForm />
    </div>
  );
}
