import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium leading-5 tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-white/12 bg-white/5 text-muted",
        violet: "border-violet-500/35 bg-violet-500/12 text-violet-200",
        positive: "border-positive/30 bg-positive/12 text-positive",
        caution: "border-caution/30 bg-caution/12 text-caution",
        danger: "border-danger/30 bg-danger/12 text-danger",
        info: "border-info/30 bg-info/12 text-info",
        muted: "border-white/8 bg-white/[0.03] text-muted-2",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/** Status → tone mapping shared by every table and detail view. */
export const STATUS_TONES: Record<string, BadgeTone> = {
  // Affiliate
  PENDING: "caution",
  ACTIVE: "positive",
  SUSPENDED: "danger",
  REJECTED: "danger",
  // Lead
  NEW: "info",
  CONTACTED: "violet",
  QUALIFIED: "violet",
  PROPOSAL: "caution",
  WON: "positive",
  LOST: "muted",
  CANCELLED: "muted",
  // Payment / order
  PAID: "positive",
  REFUNDED: "danger",
  OPEN: "info",
  IN_PROGRESS: "violet",
  DELIVERED: "positive",
  // Commission / payout
  APPROVED: "violet",
  REQUESTED: "caution",
  // Customer
  INACTIVE: "muted",
  BLOCKED: "danger",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} dot className={className}>
      {label}
    </Badge>
  );
}
