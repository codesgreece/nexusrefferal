import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, ShieldAlert, XCircle } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { requireAffiliatePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { dateLocaleTag } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Application status" };

export default async function AffiliateStatusPage() {
  const user = await requireAffiliatePage();
  if (!user.affiliateId) redirect("/login");
  if (user.affiliateStatus === "ACTIVE") redirect("/affiliate/dashboard");

  const [{ t, locale }, affiliate] = await Promise.all([
    getI18n(),
    prisma.affiliate.findUniqueOrThrow({
      where: { id: user.affiliateId },
      select: {
        status: true,
        appliedAt: true,
        rejectionReason: true,
        suspensionReason: true,
      },
    }),
  ]);

  const applied = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(affiliate.appliedAt);

  const view = {
    PENDING: {
      icon: <Clock className="size-7" />,
      tone: "border-caution/30 bg-caution/10 text-caution",
      title: t("affiliate.pendingTitle"),
      body: t("affiliate.pendingBody"),
      reason: null as string | null,
    },
    REJECTED: {
      icon: <XCircle className="size-7" />,
      tone: "border-danger/30 bg-danger/10 text-danger",
      title: t("affiliate.rejectedTitle"),
      body: t("affiliate.rejectedBody"),
      reason: affiliate.rejectionReason,
    },
    SUSPENDED: {
      icon: <ShieldAlert className="size-7" />,
      tone: "border-danger/30 bg-danger/10 text-danger",
      title: t("affiliate.suspendedTitle"),
      body: t("affiliate.suspendedBody"),
      reason: affiliate.suspensionReason,
    },
  }[affiliate.status as "PENDING" | "REJECTED" | "SUSPENDED"] ?? {
    icon: <Clock className="size-7" />,
    tone: "border-caution/30 bg-caution/10 text-caution",
    title: t("affiliate.pendingTitle"),
    body: t("affiliate.pendingBody"),
    reason: null,
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-void">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 size-[18rem] rounded-full bg-violet-700/18 blur-[80px] sm:-left-32 sm:-top-32 sm:size-[30rem] sm:blur-[120px]"
      />

      <header className="relative z-10 flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo href="/" className="min-w-0" />
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact />
          <LogoutButton variant="menu" className="w-auto" />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <Card glow className="w-full max-w-lg min-w-0 overflow-hidden">
          <CardHeader
            icon={<span className={`grid place-items-center ${view.tone}`}>{view.icon}</span>}
            title={view.title}
            description={t("affiliate.pendingApplied", { date: applied })}
          />
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">{view.body}</p>
            {view.reason ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                  {t("common.reason")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">{view.reason}</p>
              </div>
            ) : null}
          </CardBody>
          <CardFooter>
            <Button asChild variant="secondary">
              <Link href="/">NexusDevStudio</Link>
            </Button>
            <Button asChild>
              <Link href="/terms">{t("nav.terms")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
