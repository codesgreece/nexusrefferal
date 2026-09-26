import * as React from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="relative grid place-items-center">
        <div
          aria-hidden
          className="absolute size-20 rounded-full bg-violet-600/18 blur-2xl animate-pulse-glow"
        />
        <div className="relative grid size-14 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/8 text-violet-300">
          {icon}
        </div>
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {body ? <p className="text-sm leading-relaxed text-muted">{body}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
