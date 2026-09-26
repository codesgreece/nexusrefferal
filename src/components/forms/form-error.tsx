import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormAlert({
  message,
  tone = "error",
  className,
  children,
}: {
  message?: string | null;
  tone?: "error" | "success" | "warning" | "info";
  className?: string;
  children?: React.ReactNode;
}) {
  if (!message && !children) return null;

  const tones = {
    error: "border-danger/30 bg-danger/10 text-danger",
    success: "border-positive/30 bg-positive/10 text-positive",
    warning: "border-caution/30 bg-caution/10 text-caution",
    info: "border-info/30 bg-info/10 text-info",
  }[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed",
        tones,
        className,
      )}
    >
      {tone === "success" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 space-y-1">
        {message ? <p>{message}</p> : null}
        {children}
      </div>
    </div>
  );
}
