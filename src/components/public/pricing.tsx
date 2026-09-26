"use client";

import Link from "next/link";
import { ArrowRight, Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "./sections";
import { useI18n } from "@/lib/i18n/provider";
import { formatMoney } from "@/lib/money";
import type { PublicService } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

function PriceTag({
  cents,
  priceFrom,
  locale,
  fromLabel,
}: {
  cents: number;
  priceFrom: boolean;
  locale: string;
  fromLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {priceFrom ? (
        <span className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-2 sm:mb-1.5">
          {fromLabel}
        </span>
      ) : null}
      <span className="text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
        {formatMoney(cents, locale)}
      </span>
      {priceFrom ? (
        <span className="mb-1 text-xl font-semibold text-violet-400 sm:mb-1.5 sm:text-2xl">+</span>
      ) : null}
    </div>
  );
}

export function PricingSection({
  services,
  domainFeeCents,
  showCommission = false,
}: {
  services: PublicService[];
  domainFeeCents: number;
  showCommission?: boolean;
}) {
  const { t, locale } = useI18n();
  // The mid-tier card gets the visual emphasis.
  const featuredIndex = Math.min(2, Math.max(0, services.length - 1));

  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 overflow-x-clip border-t border-white/6 py-16 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 h-64 bg-linear-to-b from-violet-700/8 to-transparent"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("nav.pricing")}
          title={t("landing.pricingTitle")}
          subtitle={t("landing.pricingSubtitle")}
        />

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {services.map((service, index) => {
            const featured = index === featuredIndex;
            return (
              <article
                key={service.id}
                className={cn(
                  "group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6",
                  featured
                    ? "border-violet-500/45 bg-linear-to-b from-violet-800/22 via-surface to-surface shadow-glow"
                    : "border-white/8 bg-surface/70 hover:border-violet-500/30 hover:shadow-glow-sm",
                )}
              >
                {featured ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-600/22 blur-[70px]"
                  />
                ) : null}

                <div className="relative">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                    {service.name}
                  </h3>
                  <div className="mt-4">
                    <PriceTag
                      cents={service.startingPriceCents}
                      priceFrom={service.priceFrom}
                      locale={locale}
                      fromLabel={t("landing.pricingFrom")}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {service.description}
                  </p>
                </div>

                {service.features.length > 0 ? (
                  <ul className="relative mt-5 space-y-2.5 border-t border-white/8 pt-5">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                        <Check className="mt-0.5 size-4 shrink-0 text-violet-400" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {showCommission ? (
                  <div className="relative mt-5 rounded-xl border border-positive/25 bg-positive/8 px-3.5 py-2.5">
                    <p className="text-[0.65rem] uppercase tracking-[0.12em] text-positive/80">
                      {t("admin.commissions.commission")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-positive tabular-nums">
                      {formatMoney(service.commissionAmountCents, locale)}
                      {service.commissionType === "PERCENT" && service.commissionPercent
                        ? ` · ${service.commissionPercent}%`
                        : ""}
                    </p>
                  </div>
                ) : null}

                <div className="relative mt-6 flex-1" />
                <Button
                  asChild
                  variant={featured ? "primary" : "secondary"}
                  block
                  className="relative"
                >
                  <Link href={`/contact?service=${service.slug}`}>
                    {t("landing.pricingCta")}
                    <ArrowRight />
                  </Link>
                </Button>
              </article>
            );
          })}

          <article className="relative flex min-w-0 flex-col justify-center gap-3 rounded-3xl border border-dashed border-white/12 bg-white/[0.015] p-5 sm:p-6">
            <span className="grid size-11 place-items-center rounded-xl border border-violet-500/28 bg-violet-500/10 text-violet-300">
              <Globe className="size-5" />
            </span>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                {t("landing.pricingDomain")}
              </h3>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">
                +{formatMoney(domainFeeCents, locale)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("landing.pricingDomainBody")}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
