"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/money";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type ChartPoint = { date: string; value: number };

function formatAxisDate(value: string, locale: string) {
  // Daily buckets are YYYY-MM-DD, monthly buckets are YYYY-MM.
  const isMonthly = value.length === 7;
  const date = new Date(isMonthly ? `${value}-01T00:00:00Z` : `${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    ...(isMonthly ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }),
    timeZone: "UTC",
  }).format(date);
}

function ChartTooltip({
  active,
  payload,
  label,
  money,
  locale,
  seriesLabel,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  money: boolean;
  locale: string;
  seriesLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-white/12 bg-surface-2/95 px-3 py-2 shadow-glow-sm backdrop-blur">
      <p className="text-[0.7rem] uppercase tracking-wide text-muted-2">
        {formatAxisDate(String(label ?? ""), locale)}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
        {money ? formatMoney(raw, locale) : raw}
      </p>
      <p className="text-[0.7rem] text-muted">{seriesLabel}</p>
    </div>
  );
}

const AXIS_STYLE = {
  fontSize: 11,
  fill: "#6f6a8a",
} as const;

export function TrendAreaChart({
  data,
  label,
  money = false,
  height = 240,
  color = "#7f4dff",
}: {
  data: ChartPoint[];
  label: string;
  money?: boolean;
  height?: number;
  color?: string;
}) {
  const { locale } = useI18n();
  const gradientId = React.useId().replace(/[:]/g, "");

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.42} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={(value: string) => formatAxisDate(value, locale)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            width={56}
            tickFormatter={(value: number) =>
              money ? formatMoney(value, locale) : String(value)
            }
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "rgba(127,77,255,0.35)", strokeWidth: 1 }}
            content={
              <ChartTooltip money={money} locale={locale} seriesLabel={label} />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "#0c0b15", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendBarChart({
  data,
  label,
  money = false,
  height = 240,
  color = "#9a78ff",
}: {
  data: ChartPoint[];
  label: string;
  money?: boolean;
  height?: number;
  color?: string;
}) {
  const { locale } = useI18n();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={(value: string) => formatAxisDate(value, locale)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            width={56}
            tickFormatter={(value: number) =>
              money ? formatMoney(value, locale) : String(value)
            }
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(127,77,255,0.08)" }}
            content={<ChartTooltip money={money} locale={locale} seriesLabel={label} />}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartFrame({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-surface/80 p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold text-ink">{title}</h3>
        {action}
      </div>
      <div className="min-w-0 overflow-x-auto">{children}</div>
    </div>
  );
}
