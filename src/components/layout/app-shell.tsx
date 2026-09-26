"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Menu, User as UserIcon, X } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useI18n } from "@/lib/i18n/provider";
import type { RenderedNotification } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  /** Also highlight the item for nested routes. */
  matchPrefix?: boolean;
};

function isActive(pathname: string, item: NavItem) {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-violet-500/12 font-medium text-ink"
          : "text-muted hover:bg-white/5 hover:text-ink",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400" />
      ) : null}
      <span
        className={cn(
          "shrink-0 transition-colors [&_svg]:size-4.5",
          active ? "text-violet-300" : "text-muted-2 group-hover:text-violet-300",
        )}
      >
        {item.icon}
      </span>
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.badge && item.badge > 0 ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 text-[0.65rem] font-semibold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function UserMenu({
  name,
  email,
  profileHref,
}: {
  name: string;
  email: string;
  profileHref: string;
}) {
  const { t } = useI18n();
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-2 text-sm transition-colors hover:border-violet-500/40">
        <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-violet-500 to-violet-700 text-[0.7rem] font-semibold text-white">
          {initials || "N"}
        </span>
        <span className="hidden max-w-28 truncate text-muted sm:block">{name}</span>
        <ChevronDown className="size-3.5 text-muted-2" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 overflow-hidden rounded-xl border border-white/10 bg-surface-2/95 p-1 shadow-glow-sm backdrop-blur data-[state=open]:animate-fade-in"
        >
          <div className="border-b border-white/8 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-muted-2">{email}</p>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href={profileHref}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors data-highlighted:bg-violet-500/12 data-highlighted:text-ink"
            >
              <UserIcon className="size-4" />
              {t("common.profile")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-white/8" />
          {/* Keeping the menu open means the button is still mounted while the
              sign-out request is in flight. */}
          <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}>
            <LogoutButton variant="menu" />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function AppShell({
  nav,
  bottomNav,
  user,
  profileHref,
  homeHref,
  notifications,
  unreadCount,
  notificationsHref,
  children,
}: {
  nav: Array<{ groupKey?: string; items: NavItem[] }>;
  bottomNav: NavItem[];
  user: { name: string; email: string };
  profileHref: string;
  homeHref: string;
  notifications: RenderedNotification[];
  unreadCount: number;
  notificationsHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebar = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {nav.map((group, groupIndex) => (
        <div key={group.groupKey ?? groupIndex} className="space-y-1">
          {group.groupKey ? (
            <p className="px-3 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-2">
              {t(group.groupKey)}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh max-w-[100vw] overflow-x-clip bg-void">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-40 -top-40 size-[30rem] rounded-full bg-violet-800/12 blur-[130px]"
      />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/8 bg-abyss/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-white/8 px-5">
          <Logo href={homeHref} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{sidebar()}</div>
        <div className="shrink-0 border-t border-white/8 p-3">
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-white/8 bg-void/85 px-3 backdrop-blur-xl sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("common.mobileMore")}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition-colors hover:text-ink lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0 lg:hidden">
              <Logo href={homeHref} showProgram={false} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher compact />
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              allHref={notificationsHref}
            />
            <UserMenu name={user.name} email={user.email} profileHref={profileHref} />
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-abyss animate-fade-in">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-4">
                <Logo href={homeHref} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("common.close")}
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/8 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {sidebar(() => setMobileOpen(false))}
              </div>
              <div className="shrink-0 border-t border-white/8 p-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 px-3 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-abyss/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {bottomNav.slice(0, 5).map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-0.5 py-2.5 text-[0.58rem] leading-tight transition-colors sm:text-[0.62rem]",
                    active ? "text-violet-300" : "text-muted-2",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-violet-400 sm:inset-x-4" />
                  ) : null}
                  <span className="relative [&_svg]:size-5">
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -right-1.5 -top-1 grid min-w-4 place-items-center rounded-full bg-violet-600 px-1 text-[0.55rem] font-semibold text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="max-w-full truncate px-0.5 text-center">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{action}</div>
      ) : null}
    </div>
  );
}
