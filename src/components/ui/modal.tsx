"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const { t } = useI18n();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface shadow-glow outline-none",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            "data-[state=open]:animate-fade-up",
            size === "sm" && "sm:w-[26rem]",
            size === "md" && "sm:w-[34rem]",
            size === "lg" && "sm:w-[46rem]",
            size === "xl" && "sm:w-[60rem]",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="min-w-0 space-y-1">
              <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm leading-relaxed text-muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/8 hover:text-ink"
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          ) : null}
          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/8 bg-white/[0.015] px-5 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalClose = Dialog.Close;
