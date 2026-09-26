import * as React from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "violet" | "positive" | "caution" | "danger";
  className?: string;
}) {
  const toneRing = {
    neutral: "border-white/8",
    violet: "border-violet-500/28",
    positive: "border-positive/25",
    caution: "border-caution/25",
    danger: "border-danger/25",
  }[tone];

  const iconTone = {
    neutral: "border-white/10 bg-white/5 text-muted",
    violet: "border-violet-500/28 bg-violet-500/12 text-violet-300",
    positive: "border-positive/25 bg-positive/10 text-positive",
    caution: "border-caution/25 bg-caution/10 text-caution",
    danger: "border-danger/25 bg-danger/10 text-danger",
  }[tone];

  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border bg-surface/80 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/35 sm:p-5",
        toneRing,
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-violet-600/12 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <p className="min-w-0 text-[0.62rem] font-semibold uppercase leading-snug tracking-[0.1em] text-muted-2 sm:text-[0.7rem] sm:tracking-[0.12em]">
          {label}
        </p>
        {icon ? (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", iconTone)}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="relative mt-2 break-words text-xl font-semibold tracking-tight text-ink tabular-nums sm:mt-3 sm:text-[1.75rem]">
        {value}
      </p>
      {sublabel ? (
        <p className="relative mt-1 text-xs leading-relaxed text-muted">{sublabel}</p>
      ) : null}
    </div>
  );
}

export function StatGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-3 sm:gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
