"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "./button";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

async function writeToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  // Fallback for browsers/contexts without the async clipboard API.
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyButton({
  value,
  label,
  className,
  variant = "secondary",
  size = "sm",
  iconOnly = false,
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  iconOnly?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await writeToClipboard(value);
      setCopied(true);
      toast.success(t("common.copied"), { description: value.slice(0, 80) });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  return (
    <Button
      variant={variant}
      size={iconOnly ? (size === "xs" ? "icon-sm" : "icon") : size}
      onClick={handleCopy}
      className={cn(className)}
      aria-label={label ?? t("common.copy")}
    >
      {copied ? <Check className="text-positive" /> : <Copy />}
      {iconOnly ? null : (copied ? t("common.copied") : (label ?? t("common.copy")))}
    </Button>
  );
}
