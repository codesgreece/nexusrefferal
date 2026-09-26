"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const controlBase =
  "w-full max-w-full rounded-xl border border-white/10 bg-surface-2/80 px-3.5 text-base text-ink transition-colors placeholder:text-muted-2 hover:border-white/16 focus:border-violet-500/70 focus:bg-surface-2 focus:outline-none focus:ring-4 focus:ring-violet-500/12 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger/60 aria-[invalid=true]:ring-danger/12 sm:text-sm";

export function Label({
  className,
  required,
  hint,
  children,
  ...props
}: React.ComponentProps<"label"> & { required?: boolean; hint?: string }) {
  return (
    <label
      className={cn(
        "flex items-baseline gap-1.5 text-[0.8rem] font-medium tracking-wide text-muted",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {required ? <span className="text-violet-400">*</span> : null}
      {hint ? <span className="text-[0.7rem] font-normal text-muted-2">({hint})</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlBase, "min-h-24 resize-y py-3 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          "h-11 cursor-pointer appearance-none pr-10",
          "[&>option]:bg-surface-2 [&>option]:text-ink",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 size-3 -translate-y-1/2 text-muted"
      >
        <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: React.ComponentProps<"input"> & { label?: React.ReactNode }) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 text-sm text-muted transition-colors hover:text-ink/90">
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input
          type="checkbox"
          className={cn(
            "peer size-5 appearance-none rounded-md border border-white/16 bg-surface-2 transition-all",
            "checked:border-violet-500 checked:bg-violet-600",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20",
            className,
          )}
          {...props}
        />
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className="pointer-events-none absolute size-3.5 scale-50 text-white opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
        >
          <path
            d="M2 7.5 5.5 11 12 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label ? <span className="leading-relaxed">{label}</span> : null}
    </label>
  );
}

/** Renders a field error, translating i18n keys emitted by the server. */
export function FieldError({ error }: { error?: string | null }) {
  const { t } = useI18n();
  if (!error) return null;
  const message = error.includes(".") ? t(error) : error;
  return (
    <p className="flex items-center gap-1.5 text-xs text-danger" role="alert">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  description,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required} hint={hint}>
          {label}
        </Label>
      ) : null}
      {children}
      {description ? <p className="text-xs leading-relaxed text-muted-2">{description}</p> : null}
      <FieldError error={error} />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
          {title}
        </h3>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
