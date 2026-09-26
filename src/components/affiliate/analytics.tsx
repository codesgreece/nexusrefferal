"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

import { ChartFrame, TrendAreaChart, TrendBarChart } from "@/components/ui/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/provider";
import type { SeriesPoint } from "@/lib/services/analytics";
import { cn } from "@/lib/utils";

type RangeKey = "30d" | "90d" | "12m";

export function PerformanceCharts({
  series,
  hasAnyActivity,
}: {
  series: Record<RangeKey, SeriesPoint[]>;
  hasAnyActivity: boolean;
}) {
  const { t } = useI18n();
  const [range, setRange] = React.useState<RangeKey>("30d");

  const ranges: Array<{ key: RangeKey; label: string }> = [
    { key: "30d", label: t("affiliate.analytics.range30") },
    { key: "90d", label: t("affiliate.analytics.range90") },
    { key: "12m", label: t("affiliate.analytics.range365") },
  ];

  const data = series[range];

  if (!hasAnyActivity) {
    return (
      <ChartFrame title={t("affiliate.analytics.title")}>
        <EmptyState
          icon={<TrendingUp className="size-6" />}
          title={t("affiliate.leads.emptyTitle")}
          body={t("affiliate.leads.emptyBody")}
          compact
        />
      </ChartFrame>
    );
  }

  const rangeSelector = (
    <div
      role="tablist"
      aria-label={t("affiliate.analytics.title")}
      className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1"
    >
      {ranges.map((entry) => (
        <button
          key={entry.key}
          type="button"
          role="tab"
          aria-selected={range === entry.key}
          onClick={() => setRange(entry.key)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
            range === entry.key
              ? "bg-violet-500/18 font-medium text-violet-100"
              : "text-muted hover:text-ink",
          )}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <ChartFrame title={t("affiliate.analytics.earningsOverTime")} action={rangeSelector}>
        <TrendAreaChart
          data={data.map((point) => ({ date: point.date, value: point.earningsCents }))}
          label={t("affiliate.analytics.earningsOverTime")}
          money
        />
      </ChartFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame title={t("affiliate.analytics.leadsOverTime")}>
          <TrendBarChart
            data={data.map((point) => ({ date: point.date, value: point.leads }))}
            label={t("affiliate.analytics.leadsOverTime")}
            height={200}
          />
        </ChartFrame>
        <ChartFrame title={t("affiliate.analytics.salesOverTime")}>
          <TrendBarChart
            data={data.map((point) => ({ date: point.date, value: point.sales }))}
            label={t("affiliate.analytics.salesOverTime")}
            height={200}
            color="#34d8a0"
          />
        </ChartFrame>
      </div>
    </div>
  );
}
