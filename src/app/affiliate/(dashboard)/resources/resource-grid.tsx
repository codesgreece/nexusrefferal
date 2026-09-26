"use client";

import * as React from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Gift,
  Image as ImageIcon,
  Lightbulb,
  Palette,
  ScrollText,
  ShieldCheck,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  content: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  type: string;
  createdAt: string;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  IDEA: <Lightbulb />,
  SCRIPT: <ScrollText />,
  CAPTION: <FileText />,
  IMAGE: <ImageIcon />,
  VIDEO: <Video />,
  LOGO: <Palette />,
  BRAND_ASSET: <Palette />,
  OFFER: <Gift />,
  GUIDELINE: <ShieldCheck />,
};

export function ResourceGrid({ resources }: { resources: ResourceItem[] }) {
  const { t, formatDate } = useI18n();
  const [activeType, setActiveType] = React.useState<string>("ALL");

  const types = React.useMemo(
    () => ["ALL", ...Array.from(new Set(resources.map((entry) => entry.type)))],
    [resources],
  );

  const visible =
    activeType === "ALL"
      ? resources
      : resources.filter((resource) => resource.type === activeType);

  return (
    <div className="space-y-5">
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={cn(
              "shrink-0 rounded-xl border px-3.5 py-2 text-xs transition-colors",
              activeType === type
                ? "border-violet-500/45 bg-violet-500/14 font-medium text-violet-100"
                : "border-white/8 bg-white/[0.025] text-muted hover:border-violet-500/30 hover:text-ink",
            )}
          >
            {type === "ALL" ? t("affiliate.resources.filterAll") : t(`resourceType.${type}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((resource) => (
          <article
            key={resource.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface/80 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/32"
          >
            {resource.thumbnailUrl ? (
              // Admin-supplied URLs can point anywhere, so a plain img avoids
              // next/image remote-host configuration for every new domain.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resource.thumbnailUrl}
                alt=""
                className="h-36 w-full object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 [&_svg]:size-4">
                  {TYPE_ICONS[resource.type] ?? <BookOpen />}
                </span>
                <Badge tone="violet">{t(`resourceType.${resource.type}`)}</Badge>
              </div>

              <h3 className="mt-4 text-sm font-semibold leading-snug text-ink">
                {resource.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{resource.description}</p>

              {resource.content ? (
                <pre className="mt-4 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-void/50 p-3.5 font-sans text-xs leading-relaxed text-ink/85">
                  {resource.content}
                </pre>
              ) : null}

              <div className="mt-4 flex flex-1 items-end gap-2">
                {resource.content ? (
                  <CopyButton
                    value={resource.content}
                    label={t("affiliate.resources.copyContent")}
                    size="sm"
                  />
                ) : null}
                {resource.url ? (
                  <Button asChild variant="secondary" size="sm">
                    <a href={resource.url} target="_blank" rel="noreferrer noopener">
                      {t("affiliate.resources.openLink")}
                      <ExternalLink />
                    </a>
                  </Button>
                ) : null}
              </div>

              <p className="mt-3 text-[0.68rem] text-muted-2">
                {formatDate(resource.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
