import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LegalProse } from "@/components/public/prose";
import { getI18n } from "@/lib/i18n/server";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Program terms" };

export default async function TermsPage() {
  const [{ t, locale }, settings] = await Promise.all([getI18n(), getSettings()]);
  const content = locale === "el" ? settings.termsContentEl : settings.termsContentEn;
  const updated = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(settings.updatedAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <Card>
        <CardHeader
          title={t("legal.termsTitle")}
          description={t("legal.lastUpdated", { date: updated })}
        />
        <CardBody>
          <LegalProse content={content} />
        </CardBody>
      </Card>
    </div>
  );
}
