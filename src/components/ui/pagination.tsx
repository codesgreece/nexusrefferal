"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "./button";
import { useI18n } from "@/lib/i18n/provider";

export function Pagination({
  page,
  pages,
  total,
}: {
  page: number;
  pages: number;
  total: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const goTo = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    router.push(`?${params.toString()}`, { scroll: true });
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
      <p className="text-xs text-muted">
        {total} {t("common.results")} · {t("common.page")} {page} {t("common.of")} {pages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft />
          <span className="hidden sm:inline">{t("common.previous")}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => goTo(page + 1)}
        >
          <span className="hidden sm:inline">{t("common.next")}</span>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
