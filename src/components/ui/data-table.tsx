import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Table shell used across admin and affiliate views. On small screens the
 * caller renders the same data through `MobileCardList` instead of squeezing a
 * desktop table into a phone.
 */
export function TableShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "hidden overflow-hidden rounded-2xl border border-white/8 bg-surface/80 shadow-card md:block",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-white/8 bg-white/[0.02]">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-2 whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-violet-500/[0.045]", className)}>{children}</tr>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-sm text-ink/90",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function MobileCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3 md:hidden", className)}>{children}</div>;
}

export function MobileCard({
  title,
  subtitle,
  badge,
  rows,
  footer,
  href,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  rows?: Array<{ label: string; value: React.ReactNode }>;
  footer?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-white/8 bg-surface/80 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      {rows && rows.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/6 pt-3">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-2">
                {row.label}
              </dt>
              <dd className="truncate text-sm text-ink/90">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {footer ? <div className="mt-3 flex flex-wrap gap-2 border-t border-white/6 pt-3">{footer}</div> : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition-transform active:scale-[0.99]">
        {content}
      </a>
    );
  }
  return content;
}
