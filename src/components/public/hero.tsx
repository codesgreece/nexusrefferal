"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Globe2,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { formatMoney } from "@/lib/money";

/**
 * Static illustration of the affiliate dashboard. Deliberately not wired to
 * live data — it is a product visual on a public marketing page, and the
 * numbers shown are the published service prices and commission rates.
 */
function DashboardPreview({
  samplePriceCents,
  sampleCommissionCents,
}: {
  samplePriceCents: number;
  sampleCommissionCents: number;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-tr from-violet-700/25 via-violet-500/10 to-transparent blur-3xl"
      />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong shadow-glow">
        <div className="flex items-center gap-2 border-b border-white/8 px-5 py-3.5">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-caution/70" />
          <span className="size-2.5 rounded-full bg-positive/70" />
          <div className="ml-3 min-w-0">
            <p className="truncate text-xs font-medium text-ink">
              {t("landing.dashboardPreviewTitle")}
            </p>
            <p className="truncate text-[0.65rem] text-muted-2">
              {t("landing.dashboardPreviewSubtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
              {t("affiliate.referral.title")}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold tracking-[0.18em] text-violet-100">
              MARIA
            </p>
            <p className="mt-1 text-[0.7rem] text-muted">
              nexusdevstudio.com/ref/MARIA
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("affiliate.stats.totalLeads"), value: "—" },
              { label: t("affiliate.stats.successfulSales"), value: "—" },
              { label: t("affiliate.stats.totalEarnings"), value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
              >
                <p className="truncate text-[0.58rem] uppercase tracking-[0.1em] text-muted-2">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink/50">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">
                {t("landing.commissionTitle")}
              </p>
              <BadgeCheck className="size-4 text-positive" />
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-2">{t("admin.sales.amount")}</span>
                <span className="font-medium text-ink tabular-nums">
                  {formatMoney(samplePriceCents, locale)}
                </span>
              </div>
              <div className="h-px bg-white/6" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-2">{t("admin.commissions.commission")}</span>
                <span className="font-semibold text-positive tabular-nums">
                  {formatMoney(sampleCommissionCents, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  programActive,
  samplePriceCents,
  sampleCommissionCents,
}: {
  programActive: boolean;
  samplePriceCents: number;
  sampleCommissionCents: number;
}) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-violet-700/22 blur-[120px] animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-20 size-[28rem] rounded-full bg-violet-500/14 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-void to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[0.7rem] font-medium tracking-wide text-violet-200">
            <Sparkles className="size-3.5" />
            {t("landing.heroBadge")}
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            <span className="text-gradient">{t("landing.heroTitle")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>

          {!programActive ? (
            <p className="mt-5 rounded-xl border border-caution/30 bg-caution/10 px-4 py-3 text-sm text-caution">
              {t("landing.programPaused")}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="sm:w-auto" disabled={!programActive}>
              <Link href={programActive ? "/affiliate/register" : "/login"}>
                {t("landing.heroPrimary")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">{t("landing.heroSecondary")}</Link>
            </Button>
          </div>

          <ul className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Globe2 className="size-4" />, label: t("landing.heroRemote") },
              { icon: <Wallet className="size-4" />, label: t("landing.heroNoInvestment") },
              { icon: <TrendingUp className="size-4" />, label: t("landing.heroApproval") },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3 text-xs text-muted"
              >
                <span className="text-violet-300">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-muted-2">{t("landing.trustLine")}</p>
        </div>

        <div className="mt-14 animate-fade-in lg:mt-0">
          <DashboardPreview
            samplePriceCents={samplePriceCents}
            sampleCommissionCents={sampleCommissionCents}
          />
        </div>
      </div>
    </section>
  );
}
