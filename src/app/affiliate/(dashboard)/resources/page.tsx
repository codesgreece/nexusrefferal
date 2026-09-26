import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireActiveAffiliatePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { ResourceGrid } from "./resource-grid";

export const metadata: Metadata = { title: "Resources" };

export default async function AffiliateResourcesPage() {
  const user = await requireActiveAffiliatePage();
  const { t, locale } = await getI18n();

  const [resources, affiliate] = await Promise.all([
    prisma.affiliateResource.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.affiliate.findUniqueOrThrow({
      where: { id: user.affiliateId },
      select: { referralCodes: { where: { isPrimary: true }, take: 1 } },
    }),
  ]);

  const code = affiliate.referralCodes[0]?.code ?? null;

  const localized = resources.map((resource) => ({
    id: resource.id,
    title: locale === "el" ? resource.titleEl : resource.titleEn,
    description: locale === "el" ? resource.descriptionEl : resource.descriptionEn,
    // Placeholders in the seeded copy are filled with the affiliate's own code.
    content:
      (locale === "el" ? resource.contentEl : resource.contentEn)?.replace(
        /\{(?:your code|ο κωδικός σου)\}/gi,
        code ?? "",
      ) ?? null,
    url: resource.url,
    thumbnailUrl: resource.thumbnailUrl,
    type: resource.type,
    createdAt: resource.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("affiliate.resources.title")}
        description={t("affiliate.resources.subtitle")}
      />

      {localized.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title={t("affiliate.resources.emptyTitle")}
            body={t("affiliate.resources.emptyBody")}
          />
        </Card>
      ) : (
        <ResourceGrid resources={localized} />
      )}
    </div>
  );
}
