import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import {
  ApproveAffiliateButton,
  RejectAffiliateButton,
} from "@/components/admin/affiliate-actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdminPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { dateLocaleTag } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { suggestCode } from "@/lib/services/referral";

export const metadata: Metadata = { title: "Applications" };

export default async function AdminApplicationsPage() {
  await requireAdminPage();
  const { t, locale } = await getI18n();

  const [pending, reviewed] = await Promise.all([
    prisma.affiliate.findMany({
      where: { status: "PENDING", deletedAt: null },
      include: { socialProfiles: true },
      orderBy: { appliedAt: "asc" },
    }),
    prisma.affiliate.findMany({
      where: { status: { in: ["ACTIVE", "REJECTED"] }, deletedAt: null },
      orderBy: [{ approvedAt: "desc" }, { rejectedAt: "desc" }],
      take: 10,
      include: { referralCodes: { where: { isPrimary: true }, take: 1 } },
    }),
  ]);

  // Suggestions are generated server-side so the admin sees a free code.
  const suggestions = await Promise.all(
    pending.map(async (application) => ({
      id: application.id,
      code: await suggestCode(application.fullName),
    })),
  );
  const suggestionMap = new Map(suggestions.map((entry) => [entry.id, entry.code]));

  const formatDate = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.applications.title")}
        description={t("admin.applications.subtitle")}
      />

      {pending.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserPlus className="size-6" />}
            title={t("admin.applications.emptyTitle")}
            body={t("admin.applications.emptyBody")}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((application) => (
            <Card key={application.id}>
              <CardHeader
                title={application.fullName}
                description={`${application.email} · ${application.phone}`}
                action={
                  <Badge tone="caution" dot>
                    {formatDate.format(application.appliedAt)}
                  </Badge>
                }
              />
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {application.bio ? (
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                      {t("admin.affiliates.bio")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{application.bio}</p>
                  </div>
                ) : null}
                {application.motivation ? (
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                      {t("admin.affiliates.motivation")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {application.motivation}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                    {t("admin.affiliates.socialProfiles")}
                  </p>
                  {application.socialProfiles.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-2">
                      {t("admin.affiliates.noSocials")}
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {application.socialProfiles.map((profile) => (
                        <li key={profile.id}>
                          {profile.url ? (
                            <a
                              href={profile.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-violet-500/35 hover:text-ink"
                            >
                              {t(`attribution.${profile.platform}`)} @{profile.handle}
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
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
                  <ApproveAffiliateButton
                    affiliateId={application.id}
                    name={application.fullName}
                    suggestedCode={suggestionMap.get(application.id) ?? ""}
                  />
                  <RejectAffiliateButton
                    affiliateId={application.id}
                    name={application.fullName}
                  />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/affiliates/${application.id}`}>
                      {t("admin.affiliates.viewProfile")}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {reviewed.length > 0 ? (
        <Card>
          <CardHeader title={t("admin.applications.reviewedTitle")} />
          <ul className="divide-y divide-white/5">
            {reviewed.map((affiliate) => (
              <li key={affiliate.id}>
                <Link
                  href={`/admin/affiliates/${affiliate.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-violet-500/[0.045] sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {affiliate.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-2">{affiliate.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {affiliate.referralCodes[0] ? (
                      <span className="font-mono text-xs text-violet-200">
                        {affiliate.referralCodes[0].code}
                      </span>
                    ) : null}
                    <StatusBadge
                      status={affiliate.status}
                      label={t(`status.affiliate.${affiliate.status}`)}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
