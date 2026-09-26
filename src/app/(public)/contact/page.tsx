import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { listActiveServices, localizeService } from "@/lib/services/catalog";
import { readReferralCookie } from "@/lib/services/referral";
import { getSettings } from "@/lib/services/settings";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Start your project" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; service?: string }>;
}) {
  const { ref, service } = await searchParams;
  const [{ t, locale }, settings, services, cookieCode] = await Promise.all([
    getI18n(),
    getSettings(),
    listActiveServices(),
    readReferralCookie(),
  ]);

  const localized = services.map((entry) => localizeService(entry, locale, settings));
  const presetService = service
    ? (localized.find((entry) => entry.slug === service)?.id ?? "")
    : "";

  return (
    <div className="relative overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 size-[16rem] rounded-full bg-violet-700/16 blur-[80px] sm:-left-40 sm:size-[28rem] sm:blur-[120px]"
      />
      <div className="relative mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
        <Card glow className="min-w-0 overflow-hidden">
          <CardHeader title={t("contact.title")} description={t("contact.subtitle")} />
          <CardBody>
            <ContactForm
              services={localized.map((entry) => ({ id: entry.id, name: entry.name }))}
              presetService={presetService}
              presetCode={(ref ?? cookieCode ?? "").toUpperCase()}
              hasCookieAttribution={Boolean(cookieCode)}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
