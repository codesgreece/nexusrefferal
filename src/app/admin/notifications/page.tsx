import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import { NotificationList } from "@/components/layout/notification-list";
import { requireAdminPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import {
  countUnread,
  listNotifications,
  renderNotification,
} from "@/lib/services/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const admin = await requireAdminPage();
  const { t } = await getI18n();

  const [raw, unreadCount] = await Promise.all([
    listNotifications(admin.id, 100),
    countUnread(admin.id),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.notifications.title")}
        description={t("admin.notifications.subtitle")}
      />
      <NotificationList
        notifications={raw.map((entry) => renderNotification(entry, t))}
        unreadCount={unreadCount}
      />
    </div>
  );
}
