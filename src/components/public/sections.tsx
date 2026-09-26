"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Eye,
  Globe2,
  Handshake,
  HeartHandshake,
  Percent,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-3",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-violet-400/90">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="text-base leading-relaxed text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function Benefits() {
  const { t } = useI18n();

  const items = [
    {
      icon: <Globe2 className="size-5" />,
      title: t("landing.benefitRemoteTitle"),
      body: t("landing.benefitRemoteBody"),
    },
    {
      icon: <Percent className="size-5" />,
      title: t("landing.benefitCommissionTitle"),
      body: t("landing.benefitCommissionBody"),
    },
    {
      icon: <Wallet className="size-5" />,
      title: t("landing.benefitNoInvestmentTitle"),
      body: t("landing.benefitNoInvestmentBody"),
    },
    {
      icon: <HeartHandshake className="size-5" />,
      title: t("landing.benefitSupportTitle"),
      body: t("landing.benefitSupportBody"),
    },
  ];

  return (
    <section className="relative border-t border-white/6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("brand.program")}
          title={t("landing.benefitsTitle")}
          subtitle={t("landing.benefitsSubtitle")}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-surface/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/35 hover:shadow-glow-sm"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-violet-600/12 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="relative grid size-11 place-items-center rounded-xl border border-violet-500/28 bg-violet-500/10 text-violet-300">
                {item.icon}
              </span>
              <h3 className="relative mt-5 text-base font-semibold uppercase tracking-[0.1em] text-ink">
                {item.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useI18n();

  const steps = [1, 2, 3, 4, 5, 6].map((index) => ({
    number: String(index).padStart(2, "0"),
    title: t(`landing.howStep${index}Title`),
    body: t(`landing.howStep${index}Body`),
  }));

  return (
    <section id="how" className="relative scroll-mt-20 border-t border-white/6 py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 rounded-full bg-violet-700/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("nav.howItWorks")}
          title={t("landing.howTitle")}
          subtitle={t("landing.howSubtitle")}
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-surface/70 p-6 transition-colors hover:border-violet-500/30"
            >
              <span className="pointer-events-none absolute right-4 top-2 font-mono text-5xl font-bold text-white/[0.045]">
                {step.number}
              </span>
              <span className="inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-violet-300">
                {step.number}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CommissionExplainer() {
  const { t } = useI18n();

  const points = [
    {
      icon: <BadgeCheck className="size-5" />,
      title: t("landing.commissionPoint1Title"),
      body: t("landing.commissionPoint1Body"),
    },
    {
      icon: <ShieldCheck className="size-5" />,
      title: t("landing.commissionPoint2Title"),
      body: t("landing.commissionPoint2Body"),
    },
    {
      icon: <Eye className="size-5" />,
      title: t("landing.commissionPoint3Title"),
      body: t("landing.commissionPoint3Body"),
    },
    {
      icon: <Handshake className="size-5" />,
      title: t("landing.commissionPoint4Title"),
      body: t("landing.commissionPoint4Body"),
    },
  ];

  return (
    <section className="relative border-t border-white/6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading
            eyebrow={t("admin.commissions.commission")}
            title={t("landing.commissionTitle")}
            subtitle={t("landing.commissionSubtitle")}
            align="left"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {points.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-white/8 bg-surface/70 p-5"
              >
                <span className="grid size-10 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300">
                  {point.icon}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 text-center text-sm leading-relaxed text-muted-2">
          {t("landing.commissionNoClaims")}
        </p>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-surface/70 transition-colors",
        open ? "border-violet-500/30" : "border-white/8",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-violet-300 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const { t } = useI18n();
  const keys = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <section id="faq" className="relative scroll-mt-20 border-t border-white/6 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("nav.faq")}
          title={t("landing.faqTitle")}
          subtitle={t("landing.faqSubtitle")}
        />
        <div className="mt-10 space-y-3">
          {keys.map((index) => (
            <FaqItem
              key={index}
              question={t(`faq.q${index}`)}
              answer={t(`faq.a${index}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({
  programActive,
  termsUrl,
}: {
  programActive: boolean;
  termsUrl: string;
}) {
  const { t } = useI18n();

  return (
    <section className="relative border-t border-white/6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-linear-to-br from-violet-800/25 via-surface to-surface p-8 text-center shadow-glow sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-violet-600/25 blur-[90px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-violet-500/18 blur-[90px]"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              {t("landing.ctaBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {programActive ? (
                <Button asChild size="lg">
                  <Link href="/affiliate/register">
                    {t("landing.ctaPrimary")}
                    <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <p className="rounded-xl border border-caution/30 bg-caution/10 px-4 py-3 text-sm text-caution">
                  {t("landing.programPaused")}
                </p>
              )}
              <Button asChild variant="secondary" size="lg">
                <Link href={termsUrl}>{t("landing.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
