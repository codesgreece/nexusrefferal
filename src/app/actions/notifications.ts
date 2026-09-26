"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/guards";
import { actionOk, toActionError, type ActionResult } from "@/lib/errors";
import { markAllRead, markRead } from "@/lib/services/notifications";

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    // Scoped by userId inside the service, so one user cannot read another's.
    await markRead(user.id, notificationId);
    revalidatePath("/", "layout");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await markAllRead(user.id);
    revalidatePath("/", "layout");
    return actionOk();
  } catch (error) {
    return toActionError(error);
  }
}
