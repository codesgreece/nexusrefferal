"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t("common.language")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm text-muted transition-colors hover:border-violet-500/40 hover:text-ink",
          compact ? "size-9 justify-center" : "h-9 px-3",
        )}
      >
        {compact ? (
          <Languages className="size-4" />
        ) : (
          <>
            <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
            <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
          </>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-surface-2/95 p-1 shadow-glow-sm backdrop-blur data-[state=open]:animate-fade-in"
        >
          {LOCALES.map((option) => (
            <DropdownMenu.Item
              key={option}
              onSelect={() => setLocale(option)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors data-highlighted:bg-violet-500/12 data-highlighted:text-ink"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{LOCALE_FLAGS[option]}</span>
                {LOCALE_LABELS[option]}
              </span>
              {option === locale ? <Check className="size-4 text-violet-300" /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
