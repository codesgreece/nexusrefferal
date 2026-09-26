"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-danger/25 bg-surface/80 p-8 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
          <AlertOctagon className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-ink">{t("common.somethingWrong")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("errors.generic")}</p>
        <Button onClick={reset} className="mt-6" block>
          <RotateCcw />
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
