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
    <div className="relative mx-auto w-full max-w-lg overflow-hidden lg:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-linear-to-tr from-violet-700/25 via-violet-500/10 to-transparent blur-2xl sm:-inset-6 sm:rounded-[2.5rem] sm:blur-3xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 glass-strong shadow-glow sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 sm:px-5 sm:py-3.5">
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

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-3.5 sm:p-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
              {t("affiliate.referral.title")}
            </p>
            <p className="mt-1.5 break-all font-mono text-xl font-semibold tracking-[0.12em] text-violet-100 sm:text-2xl sm:tracking-[0.18em]">
              MARIA
            </p>
            <p className="mt-1 truncate text-[0.7rem] text-muted">
              nexusdevstudio.com/ref/MARIA
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { label: t("affiliate.stats.totalLeads"), value: "—" },
              { label: t("affiliate.stats.successfulSales"), value: "—" },
              { label: t("affiliate.stats.totalEarnings"), value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 sm:block sm:p-3"
              >
                <p className="min-w-0 text-[0.62rem] uppercase tracking-[0.08em] text-muted-2 sm:truncate sm:text-[0.58rem] sm:tracking-[0.1em]">
                  {stat.label}
                </p>
                <p className="shrink-0 text-base font-semibold text-ink/50 sm:mt-1 sm:text-lg">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs font-medium text-muted">
                {t("landing.commissionTitle")}
              </p>
              <BadgeCheck className="size-4 shrink-0 text-positive" />
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="shrink-0 text-muted-2">{t("admin.sales.amount")}</span>
                <span className="min-w-0 truncate text-right font-medium text-ink tabular-nums">
                  {formatMoney(samplePriceCents, locale)}
                </span>
              </div>
              <div className="h-px bg-white/6" />
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="shrink-0 text-muted-2">{t("admin.commissions.commission")}</span>
                <span className="min-w-0 truncate text-right font-semibold text-positive tabular-nums">
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
    <section className="relative overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[22rem] rounded-full bg-violet-700/22 blur-[90px] motion-safe:animate-float sm:-left-40 sm:-top-40 sm:size-[34rem] sm:blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-16 size-[18rem] rounded-full bg-violet-500/14 blur-[80px] sm:-right-32 sm:top-20 sm:size-[28rem] sm:blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-void to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-20 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[0.7rem] font-medium tracking-wide text-violet-200">
            <Sparkles className="size-3.5 shrink-0" />
            <span className="truncate">{t("landing.heroBadge")}</span>
          </span>

          <h1 className="mt-5 text-[1.85rem] font-semibold leading-[1.12] tracking-tight sm:mt-6 sm:text-5xl sm:leading-[1.06] lg:text-[3.6rem]">
            <span className="text-gradient">{t("landing.heroTitle")}</span>
          </h1>

          <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>

          {!programActive ? (
            <p className="mt-5 rounded-xl border border-caution/30 bg-caution/10 px-4 py-3 text-sm text-caution">
              {t("landing.programPaused")}
            </p>
          ) : null}

          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row">
            <Button
              asChild
              size="lg"
              block
              className="sm:w-auto sm:flex-none"
              disabled={!programActive}
            >
              <Link href={programActive ? "/affiliate/register" : "/login"}>
                {t("landing.heroPrimary")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" block className="sm:w-auto sm:flex-none">
              <Link href="/login">{t("landing.heroSecondary")}</Link>
            </Button>
          </div>

          <ul className="mt-8 grid gap-2.5 sm:mt-9 sm:grid-cols-3 sm:gap-3">
            {[
              { icon: <Globe2 className="size-4" />, label: t("landing.heroRemote") },
              { icon: <Wallet className="size-4" />, label: t("landing.heroNoInvestment") },
              { icon: <TrendingUp className="size-4" />, label: t("landing.heroApproval") },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3 text-xs text-muted"
              >
                <span className="shrink-0 text-violet-300">{item.icon}</span>
                <span className="min-w-0 leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-muted-2">{t("landing.trustLine")}</p>
        </div>

        <div className="mt-12 animate-fade-in sm:mt-14 lg:mt-0">
          <DashboardPreview
            samplePriceCents={samplePriceCents}
            sampleCommissionCents={sampleCommissionCents}
          />
        </div>
      </div>
    </section>
  );
}
