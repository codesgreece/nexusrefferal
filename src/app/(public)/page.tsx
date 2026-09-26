import { Hero } from "@/components/public/hero";
import { PricingSection } from "@/components/public/pricing";
import {
  Benefits,
  CommissionExplainer,
  Faq,
  FinalCta,
  HowItWorks,
} from "@/components/public/sections";
import { getLocale } from "@/lib/i18n/server";
import { listActiveServices, localizeService } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";

export default async function LandingPage() {
  const [locale, settings, services] = await Promise.all([
    getLocale(),
    getSettings(),
    listActiveServices(),
  ]);

  const localized = services.map((service) => localizeService(service, locale, settings));
  // The hero visual quotes a real published service and its configured commission.
  const sample = localized.find((service) => service.slug === "professional-website") ?? localized[0];

  return (
    <>
      <Hero
        programActive={settings.programActive}
        samplePriceCents={sample?.startingPriceCents ?? 20_000}
        sampleCommissionCents={sample?.commissionAmountCents ?? 2_500}
      />
      <Benefits />
      <HowItWorks />
      <PricingSection
        services={localized}
        domainFeeCents={settings.domainFeeCents}
        showCommission
      />
      <CommissionExplainer />
      <Faq />
      <FinalCta programActive={settings.programActive} termsUrl={settings.termsUrl} />
    </>
  );
}
