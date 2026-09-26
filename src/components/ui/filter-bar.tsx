"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type FilterSelect = {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

/**
 * URL-driven filter bar. All state lives in the query string so filtered views
 * are shareable, bookmarkable and re-rendered on the server.
 */
export function FilterBar({
  searchPlaceholder,
  selects = [],
  showDateRange = false,
  className,
}: {
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  showDateRange?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = React.useState(false);
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  const pushParams = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const next = params.toString();
      router.push(next ? `?${next}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  // Debounce the free-text search so typing does not spam the server.
  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const timer = setTimeout(() => {
      pushParams((params) => {
        if (query.trim()) params.set("q", query.trim());
        else params.delete("q");
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [query, pushParams, searchParams]);

  const activeCount = [...searchParams.keys()].filter(
    (key) => key !== "page" && key !== "q" && searchParams.get(key),
  ).length;

  const clearAll = () => {
    setQuery("");
    router.push("?", { scroll: false });
  };

  const hasFilters = selects.length > 0 || showDateRange;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder ?? t("common.search")}
            className="pl-10"
            aria-label={t("common.search")}
          />
        </div>
        {hasFilters ? (
          <Button
            variant="secondary"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="shrink-0"
          >
            <SlidersHorizontal />
            <span className="hidden sm:inline">{t("common.filter")}</span>
            {activeCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-violet-600 text-[0.65rem] font-semibold text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>
        ) : null}
        {activeCount > 0 || query ? (
          <Button variant="ghost" size="icon" onClick={clearAll} aria-label={t("common.clear")}>
            <X />
          </Button>
        ) : null}
      </div>

      {expanded && hasFilters ? (
        <div className="grid gap-3 rounded-2xl border border-white/8 bg-surface/70 p-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          {selects.map((select) => (
            <label key={select.name} className="space-y-1.5">
              <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-2">
                {select.label}
              </span>
              <Select
                value={searchParams.get(select.name) ?? ""}
                onChange={(event) =>
                  pushParams((params) => {
                    if (event.target.value) params.set(select.name, event.target.value);
                    else params.delete(select.name);
                  })
                }
              >
                {select.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          ))}

          {showDateRange ? (
            <>
              <label className="space-y-1.5">
                <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-2">
                  {t("common.dateFrom")}
                </span>
                <Input
                  type="date"
                  value={searchParams.get("from") ?? ""}
                  onChange={(event) =>
                    pushParams((params) => {
                      if (event.target.value) params.set("from", event.target.value);
                      else params.delete("from");
                    })
                  }
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-2">
                  {t("common.dateTo")}
                </span>
                <Input
                  type="date"
                  value={searchParams.get("to") ?? ""}
                  onChange={(event) =>
                    pushParams((params) => {
                      if (event.target.value) params.set("to", event.target.value);
                      else params.delete("to");
                    })
                  }
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
