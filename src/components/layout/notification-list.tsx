"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/provider";
import type { RenderedNotification } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  INFO: "bg-info",
  SUCCESS: "bg-positive",
  WARNING: "bg-caution",
  ERROR: "bg-danger",
};

export function NotificationList({
  notifications,
  unreadCount,
}: {
  notifications: RenderedNotification[];
  unreadCount: number;
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const markAll = async () => {
    setPending(true);
    await markAllNotificationsReadAction();
    router.refresh();
    setPending(false);
  };

  const markOne = async (id: string) => {
    await markNotificationReadAction(id);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader
        title={t("common.notifications")}
        description={
          unreadCount > 0
            ? t("affiliate.notifications.unread", { count: unreadCount })
            : t("affiliate.notifications.allRead")
        }
        action={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAll} disabled={pending}>
              <CheckCheck />
              {t("affiliate.notifications.markAllRead")}
            </Button>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-6" />}
          title={t("affiliate.notifications.emptyTitle")}
          body={t("affiliate.notifications.emptyBody")}
        />
      ) : (
        <ul className="divide-y divide-white/5">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "flex gap-3 px-5 py-4 transition-colors sm:px-6",
                notification.readAt ? "" : "bg-violet-500/[0.035]",
              )}
            >
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
                  <p className="mt-1 text-sm leading-relaxed text-muted-2">
                    {notification.body}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-[0.68rem] text-muted-2">
                    {formatDate(notification.createdAt, true)}
                  </span>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => !notification.readAt && markOne(notification.id)}
                      className="text-[0.7rem] font-medium text-violet-300 transition-colors hover:text-violet-200"
                    >
                      {t("common.view")}
                    </Link>
                  ) : null}
                  {!notification.readAt ? (
                    <button
                      type="button"
                      onClick={() => markOne(notification.id)}
                      className="text-[0.7rem] text-muted transition-colors hover:text-ink"
                    >
                      {t("affiliate.notifications.markRead")}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
