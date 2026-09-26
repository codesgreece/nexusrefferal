import "server-only";

import type { Notification, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { NotificationType } from "@/lib/domain";
import type { Translate } from "@/lib/i18n";

type Client = Prisma.TransactionClient | typeof prisma;

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  params?: Record<string, string | number>;
  link?: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
};

export async function notify(input: NotificationInput, client: Client = prisma) {
  return client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      paramsJson: JSON.stringify(input.params ?? {}),
      link: input.link ?? null,
      severity: input.severity ?? "INFO",
    },
  });
}

/** Fan-out to every administrator. */
export async function notifyAdmins(
  input: Omit<NotificationInput, "userId">,
  client: Client = prisma,
) {
  const admins = await client.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await client.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: input.type,
      paramsJson: JSON.stringify(input.params ?? {}),
      link: input.link ?? null,
      severity: input.severity ?? "INFO",
    })),
  });
}

export type RenderedNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  severity: string;
  readAt: Date | null;
  createdAt: Date;
};

/** Notifications are stored as type + params and translated at read time. */
export function renderNotification(
  notification: Notification,
  t: Translate,
): RenderedNotification {
  let params: Record<string, string | number> = {};
  try {
    params = JSON.parse(notification.paramsJson) as Record<string, string | number>;
  } catch {
    params = {};
  }

  return {
    id: notification.id,
    type: notification.type,
    title: t(`notification.${notification.type}.title`, params),
    body: t(`notification.${notification.type}.body`, params).trim(),
    link: notification.link,
    severity: notification.severity,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
