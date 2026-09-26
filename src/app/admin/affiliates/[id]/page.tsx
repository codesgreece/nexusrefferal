import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  ExternalLink,
  ListChecks,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  ApproveAffiliateButton,
  ChangeReferralCodeButton,
  ReactivateAffiliateButton,
  RejectAffiliateButton,
  SuspendAffiliateButton,
  ToggleReferralCodeButton,
} from "@/components/admin/affiliate-actions";
import { AffiliateDetailsForm } from "@/components/admin/affiliate-details-form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { getAffiliateStats } from "@/lib/services/analytics";
import { appOrigin, referralUrl } from "@/lib/services/affiliate-context";
import { serviceName } from "@/lib/services/catalog";
import { suggestCode } from "@/lib/services/referral";

export const metadata: Metadata = { title: "Affiliate" };

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { t, locale } = await getI18n();

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, lastLoginAt: true, createdAt: true } },
      socialProfiles: true,
      referralCodes: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!affiliate || affiliate.deletedAt) notFound();

  const [stats, origin, approver, recentLeads, recentSales, recentCommissions, auditEntries] =
    await Promise.all([
      getAffiliateStats(affiliate.id),
      appOrigin(),
      affiliate.approvedById
        ? prisma.user.findUnique({
            where: { id: affiliate.approvedById },
            select: { email: true, name: true },
          })
        : Promise.resolve(null),
      prisma.lead.findMany({
        where: { affiliateId: affiliate.id, deletedAt: null },
        include: { service: { select: { nameEn: true, nameEl: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.sale.findMany({
        where: { affiliateId: affiliate.id, deletedAt: null },
        include: {
          customer: { select: { fullName: true } },
          service: { select: { nameEn: true, nameEl: true } },
        },
        orderBy: { saleDate: "desc" },
        take: 8,
      }),
      prisma.commission.findMany({
        where: { affiliateId: affiliate.id },
        include: { customer: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { entityType: "Affiliate", entityId: affiliate.id },
            { entityType: "ReferralCode", entityId: { in: affiliate.referralCodes.map((c) => c.id) } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

  const primary = affiliate.referralCodes.find((entry) => entry.isPrimary) ?? null;
  const link = primary ? referralUrl(origin, primary.code) : null;
  const suggested = primary?.code ?? (await suggestCode(affiliate.fullName));

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formatDateTime = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const payoutRows = [
    [t("payoutMethod.label"), affiliate.payoutMethod ? t(`payoutMethod.${affiliate.payoutMethod}`) : null],
    [t("affiliate.payoutDetails.accountName"), affiliate.payoutAccountName],
    [t("affiliate.payoutDetails.iban"), affiliate.payoutIban],
    [t("affiliate.payoutDetails.bankName"), affiliate.payoutBankName],
    [t("affiliate.payoutDetails.paypalEmail"), affiliate.payoutPaypalEmail],
    [t("affiliate.payoutDetails.otherDetails"), affiliate.payoutOtherDetails],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/affiliates">
          <ArrowLeft />
          {t("admin.affiliates.title")}
        </Link>
      </Button>

      <PageHeader
        title={affiliate.fullName}
        description={`${affiliate.email} · ${affiliate.phone}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={affiliate.status}
              label={t(`status.affiliate.${affiliate.status}`)}
            />
            {affiliate.status === "PENDING" ? (
              <>
                <ApproveAffiliateButton
                  affiliateId={affiliate.id}
                  name={affiliate.fullName}
                  suggestedCode={suggested}
                />
                <RejectAffiliateButton affiliateId={affiliate.id} name={affiliate.fullName} />
              </>
            ) : null}
            {affiliate.status === "ACTIVE" ? (
              <SuspendAffiliateButton affiliateId={affiliate.id} name={affiliate.fullName} />
            ) : null}
            {affiliate.status === "SUSPENDED" || affiliate.status === "REJECTED" ? (
              <ReactivateAffiliateButton
                affiliateId={affiliate.id}
                name={affiliate.fullName}
              />
            ) : null}
          </div>
        }
      />

      <StatGrid>
        <StatCard
          label={t("admin.affiliates.leads")}
          value={stats.totalLeads}
          icon={<ListChecks />}
          sublabel={`${stats.qualifiedLeads} ${t("affiliate.stats.qualifiedLeads").toLowerCase()}`}
        />
        <StatCard
          label={t("admin.affiliates.sales")}
          value={stats.successfulSales}
          icon={<ShoppingBag />}
          tone="positive"
        />
        <StatCard
          label={t("admin.affiliates.conversion")}
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp />}
        />
        <StatCard
          label={t("admin.affiliates.earnings")}
          value={formatMoney(stats.totalEarningsCents, locale)}
          icon={<Coins />}
          tone="violet"
          sublabel={`${t("affiliate.commissions.summaryPending")}: ${formatMoney(stats.pendingCents, locale)}`}
        />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t("admin.affiliates.code")} />
          <CardBody className="space-y-4">
            {primary ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-2xl font-semibold tracking-[0.16em] text-violet-100">
                    {primary.code}
                  </span>
                  <CopyButton value={primary.code} size="xs" />
                  {primary.isActive ? (
                    <Badge tone="positive" dot>
                      {t("status.affiliate.ACTIVE")}
                    </Badge>
                  ) : (
                    <Badge tone="danger" dot>
                      {t("admin.affiliates.disableCode")}
                    </Badge>
                  )}
                </div>
                {link ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void/40 px-3 py-2.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink/85">
                      {link}
                    </code>
                    <CopyButton value={link} iconOnly size="xs" />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <ChangeReferralCodeButton
                    affiliateId={affiliate.id}
                    currentCode={primary.code}
                  />
                  <ToggleReferralCodeButton
                    referralCodeId={primary.id}
                    isActive={primary.isActive}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{t("affiliate.referral.noCode")}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("admin.affiliates.personalInfo")} />
          <CardBody>
            <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {[
                [t("auth.dateOfBirth"), formatDate.format(affiliate.dateOfBirth)],
                [t("admin.affiliates.appliedAt"), formatDate.format(affiliate.appliedAt)],
                [
                  t("common.approved"),
                  affiliate.approvedAt ? formatDate.format(affiliate.approvedAt) : "—",
                ],
                [t("admin.affiliates.approvedBy"), approver?.email ?? "—"],
                [
                  "18+",
                  affiliate.confirmedAdult ? t("common.yes") : t("common.no"),
                ],
                [
                  t("nav.terms"),
                  formatDate.format(affiliate.acceptedTermsAt),
                ],
                [
                  t("nav.privacy"),
                  formatDate.format(affiliate.acceptedPrivacyAt),
                ],
                [
                  t("common.updated"),
                  affiliate.user.lastLoginAt
                    ? formatDateTime.format(affiliate.user.lastLoginAt)
                    : t("common.never"),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-2">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink/90">{value}</dd>
                </div>
              ))}
            </dl>

            {affiliate.motivation ? (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-2">
                  {t("admin.affiliates.motivation")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {affiliate.motivation}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t("admin.affiliates.socialProfiles")} />
          <CardBody>
            {affiliate.socialProfiles.length === 0 ? (
              <p className="text-sm text-muted-2">{t("admin.affiliates.noSocials")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {affiliate.socialProfiles.map((profile) => (
                  <li key={profile.id}>
                    {profile.url ? (
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-violet-500/35 hover:text-ink"
                      >
                        {profile.platform} @{profile.handle}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted">
                        {profile.platform} @{profile.handle}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<ShieldCheck className="size-4" />}
            title={t("admin.affiliates.payoutInfo")}
          />
          <CardBody>
            {payoutRows.length === 0 ? (
              <p className="text-sm text-muted-2">{t("admin.affiliates.payoutInfoEmpty")}</p>
            ) : (
              <dl className="space-y-2.5">
                {payoutRows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <dt className="text-xs text-muted-2">{label}</dt>
                    <dd className="break-all text-right text-sm text-ink/90">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      <AffiliateDetailsForm
        affiliateId={affiliate.id}
        initial={{
          fullName: affiliate.fullName,
          phone: affiliate.phone,
          bio: affiliate.bio ?? "",
          internalNotes: affiliate.internalNotes ?? "",
          tiktok:
            affiliate.socialProfiles.find((entry) => entry.platform === "TIKTOK")?.handle ?? "",
          instagram:
            affiliate.socialProfiles.find((entry) => entry.platform === "INSTAGRAM")?.handle ??
            "",
          facebook:
            affiliate.socialProfiles.find((entry) => entry.platform === "FACEBOOK")?.handle ??
            "",
          youtube:
            affiliate.socialProfiles.find((entry) => entry.platform === "YOUTUBE")?.handle ?? "",
        }}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title={t("admin.affiliates.leads")} />
          {recentLeads.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-5" />}
              title={t("admin.leads.emptyTitle")}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="px-5 py-3 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-ink">{lead.customerName}</p>
                    <StatusBadge
                      status={lead.status}
                      label={t(`status.lead.${lead.status}`)}
                    />
                  </div>
                  <p className="truncate text-xs text-muted-2">
                    {serviceName(lead.service, locale)} · {formatDate.format(lead.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("admin.affiliates.sales")} />
          {recentSales.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="size-5" />}
              title={t("admin.sales.emptyTitle")}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentSales.map((sale) => (
                <li key={sale.id} className="px-5 py-3 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-ink">{sale.customer.fullName}</p>
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatMoney(sale.amountCents + sale.domainFeeCents, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-2">
                      {serviceName(sale.service, locale)}
                    </p>
                    <StatusBadge
                      status={sale.paymentStatus}
                      label={t(`status.payment.${sale.paymentStatus}`)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("admin.nav.commissions")} />
          {recentCommissions.length === 0 ? (
            <EmptyState
              icon={<Coins className="size-5" />}
              title={t("admin.commissions.emptyTitle")}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentCommissions.map((commission) => (
                <li key={commission.id} className="px-5 py-3 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-ink">
                      {commission.customer.fullName}
                    </p>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(commission.commissionAmountCents, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-2">
                      {formatDate.format(commission.createdAt)}
                    </p>
                    <StatusBadge
                      status={commission.status}
                      label={t(`status.commission.${commission.status}`)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title={t("admin.affiliates.activity")} />
        {auditEntries.length === 0 ? (
          <EmptyState title={t("admin.audit.emptyTitle")} compact />
        ) : (
          <ul className="divide-y divide-white/5">
            {auditEntries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-3 sm:px-6">
                <Badge tone="violet" className="mt-0.5 shrink-0">
                  {t(`audit.action.${entry.action}`)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted">
                    {entry.actorEmail ?? t("common.system")}
                  </p>
                  <p className="text-[0.68rem] text-muted-2">
                    {formatDateTime.format(entry.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
