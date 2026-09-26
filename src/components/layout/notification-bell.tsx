"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { Bell, BellOff, CheckCheck } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { useI18n } from "@/lib/i18n/provider";
import type { RenderedNotification } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  INFO: "bg-info",
  SUCCESS: "bg-positive",
  WARNING: "bg-caution",
  ERROR: "bg-danger",
};

export function NotificationBell({
  notifications,
  unreadCount,
  allHref,
}: {
  notifications: RenderedNotification[];
  unreadCount: number;
  allHref: string;
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const handleMarkAll = async () => {
    setPending(true);
    await markAllNotificationsReadAction();
    router.refresh();
    setPending(false);
  };

  const handleOpen = async (notification: RenderedNotification) => {
    if (!notification.readAt) await markNotificationReadAction(notification.id);
    router.refresh();
  };

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={t("common.notifications")}
        className="relative grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted transition-colors hover:border-violet-500/40 hover:text-ink"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-violet-600 px-1 text-[0.58rem] font-semibold text-white ring-2 ring-void">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(24rem,calc(100%-1.5rem))] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-surface-2/97 shadow-glow backdrop-blur data-[state=open]:animate-fade-in"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">{t("common.notifications")}</p>
              <p className="text-xs text-muted-2">
                {unreadCount > 0
                  ? t("affiliate.notifications.unread", { count: unreadCount })
                  : t("affiliate.notifications.allRead")}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-violet-300 transition-colors hover:bg-violet-500/12 disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />
                {t("affiliate.notifications.markAllRead")}
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <BellOff className="size-7 text-muted-2" />
                <p className="text-sm font-medium text-ink">
                  {t("affiliate.notifications.emptyTitle")}
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  {t("affiliate.notifications.emptyBody")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((notification) => {
                  const body = (
                    <div className="flex gap-3">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          notification.readAt
                            ? "bg-white/15"
                            : (SEVERITY_DOT[notification.severity] ?? "bg-violet-400"),
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notification.readAt ? "text-muted" : "font-medium text-ink",
                          )}
                        >
                          {notification.title}
                        </p>
                        {notification.body ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
                            {notification.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[0.68rem] text-muted-2">
                          {formatDate(notification.createdAt, true)}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <li key={notification.id}>
                      {notification.link ? (
                        <Popover.Close asChild>
                          <Link
                            href={notification.link}
                            onClick={() => handleOpen(notification)}
                            className="block px-4 py-3 transition-colors hover:bg-violet-500/8"
                          >
                            {body}
                          </Link>
                        </Popover.Close>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpen(notification)}
                          className="block w-full px-4 py-3 text-left transition-colors hover:bg-violet-500/8"
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-white/8 px-4 py-2.5">
            <Popover.Close asChild>
              <Link
                href={allHref}
                className="text-xs font-medium text-violet-300 transition-colors hover:text-violet-200"
              >
                {t("common.viewAll")}
              </Link>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
