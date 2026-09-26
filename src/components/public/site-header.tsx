"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/#how", key: "nav.howItWorks" },
  { href: "/#pricing", key: "nav.pricing" },
  { href: "/#faq", key: "nav.faq" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function SiteHeader({
  isAuthenticated,
  dashboardHref,
}: {
  isAuthenticated: boolean;
  dashboardHref: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/8 bg-void/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Logo className="min-w-0" />

        <nav className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              {t(section.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href={dashboardHref}>{t("common.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/affiliate/register">{t("nav.register")}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? t("common.close") : t("common.mobileMore")}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition-colors hover:text-ink"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/8 bg-void/98 px-4 py-6 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base text-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                {t(section.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            {isAuthenticated ? (
              <Button asChild size="lg" block>
                <Link href={dashboardHref} onClick={() => setOpen(false)}>
                  {t("common.dashboard")}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" block>
                  <Link href="/affiliate/register" onClick={() => setOpen(false)}>
                    {t("nav.register")}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" block>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {t("nav.login")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
