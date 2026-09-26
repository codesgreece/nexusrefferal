import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import { ReferralCard } from "@/components/affiliate/referral-card";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { getAffiliateContext } from "@/lib/services/affiliate-context";
import { getSettings } from "@/lib/services/settings";
import { ChangePasswordForm, PayoutDetailsForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function AffiliateProfilePage() {
  const user = await requireActiveAffiliatePage();
  const { t } = await getI18n();

  const [context, settings] = await Promise.all([
    getAffiliateContext(user.affiliateId),
    getSettings(),
  ]);
  const { affiliate } = context;

  const social = (platform: string) =>
    affiliate.socialProfiles.find((entry) => entry.platform === platform)?.handle ?? "";

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("affiliate.profile.title")}
        description={t("affiliate.profile.subtitle")}
      />

      {affiliate.status === "ACTIVE" ? (
        <ReferralCard
          code={context.primaryCode}
          referralUrl={context.referralUrl}
          codeActive={context.primaryCodeActive}
          cookieDays={settings.referralCookieDays}
        />
      ) : null}

      <ProfileForm
        initial={{
          fullName: affiliate.fullName,
          email: affiliate.email,
          phone: affiliate.phone,
          bio: affiliate.bio ?? "",
          locale: affiliate.user.locale,
          tiktok: social("TIKTOK"),
          instagram: social("INSTAGRAM"),
          facebook: social("FACEBOOK"),
          youtube: social("YOUTUBE"),
        }}
      />

      <PayoutDetailsForm
        initial={{
          payoutMethod: affiliate.payoutMethod ?? "",
          payoutAccountName: affiliate.payoutAccountName ?? "",
          payoutIban: affiliate.payoutIban ?? "",
          payoutBankName: affiliate.payoutBankName ?? "",
          payoutPaypalEmail: affiliate.payoutPaypalEmail ?? "",
          payoutOtherDetails: affiliate.payoutOtherDetails ?? "",
        }}
      />

      <ChangePasswordForm />
    </div>
  );
}
