import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  glow = false,
  ...props
}: React.ComponentProps<"div"> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/8 bg-surface/80 shadow-card backdrop-blur-sm",
        glow && "shadow-glow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  description,
  action,
  icon,
  ...props
}: React.ComponentProps<"div"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-white/6 px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 space-y-1">
          {title ? (
            <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-5 sm:px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-white/6 px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
