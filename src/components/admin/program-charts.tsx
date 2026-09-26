"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";

import { ChartFrame, TrendAreaChart, TrendBarChart } from "@/components/ui/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/provider";
import type { SeriesPoint } from "@/lib/services/analytics";
import { cn } from "@/lib/utils";

type RangeKey = "30d" | "90d" | "12m";
type Metric = "revenue" | "sales" | "commissions" | "leads";

export function ProgramCharts({
  series,
  hasAnyActivity,
}: {
  series: Record<RangeKey, SeriesPoint[]>;
  hasAnyActivity: boolean;
}) {
  const { t } = useI18n();
  const [range, setRange] = React.useState<RangeKey>("30d");
  const [metric, setMetric] = React.useState<Metric>("revenue");

  if (!hasAnyActivity) {
    return (
      <ChartFrame title={t("admin.charts.title")}>
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title={t("admin.leads.emptyTitle")}
          body={t("admin.leads.emptyBody")}
          compact
        />
      </ChartFrame>
    );
  }

  const data = series[range];

  const metrics: Array<{ key: Metric; label: string; money: boolean }> = [
    { key: "revenue", label: t("admin.charts.revenue"), money: true },
    { key: "commissions", label: t("admin.charts.commissions"), money: true },
    { key: "sales", label: t("admin.charts.sales"), money: false },
    { key: "leads", label: t("admin.charts.leads"), money: false },
  ];
  const active = metrics.find((entry) => entry.key === metric)!;

  const values = data.map((point) => ({
    date: point.date,
    value:
      metric === "revenue"
        ? point.revenueCents
        : metric === "commissions"
          ? point.commissionsCents
          : metric === "sales"
            ? point.sales
            : point.leads,
  }));

  const ranges: Array<{ key: RangeKey; label: string }> = [
    { key: "30d", label: t("affiliate.analytics.range30") },
    { key: "90d", label: t("affiliate.analytics.range90") },
    { key: "12m", label: t("affiliate.analytics.range365") },
  ];

  const tabClass = (isActive: boolean) =>
    cn(
      "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
      isActive
        ? "bg-violet-500/18 font-medium text-violet-100"
        : "text-muted hover:text-ink",
    );

  return (
    <div className="space-y-4">
      <ChartFrame
        title={active.label}
        action={
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
              {metrics.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setMetric(entry.key)}
                  className={tabClass(metric === entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
              {ranges.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setRange(entry.key)}
                  className={tabClass(range === entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {active.money ? (
          <TrendAreaChart data={values} label={active.label} money height={280} />
        ) : (
          <TrendBarChart data={values} label={active.label} height={280} />
        )}
      </ChartFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame title={t("admin.charts.leads")}>
          <TrendBarChart
            data={data.map((point) => ({ date: point.date, value: point.leads }))}
            label={t("admin.charts.leads")}
            height={190}
          />
        </ChartFrame>
        <ChartFrame title={t("admin.charts.commissions")}>
          <TrendAreaChart
            data={data.map((point) => ({ date: point.date, value: point.commissionsCents }))}
            label={t("admin.charts.commissions")}
            money
            height={190}
            color="#34d8a0"
          />
        </ChartFrame>
      </div>
    </div>
  );
}
