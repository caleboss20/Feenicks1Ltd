import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import type { AppNotification } from "./notificationModel";

/**
 * Notifications service: the single place screens get notifications from.
 * Each one is a real event on the account (see notificationModel.ts). In
 * DEMO MODE they're kept on the demo account (demo/demoNotifications.ts).
 */

/** The user's notifications, newest first. */
export async function getNotifications(): Promise<AppNotification[]> {
  // TODO(api): GET /api/notifications (newest first, paginated)
  if (IS_DEMO_MODE) {
    const email = demo.getSessionEmail();
    return (email && demo.findAccount(email)?.notifications) || [];
  }
  return [];
}

/** Calls `listener` when the notifications may have changed. Returns an unsubscribe function. */
export function subscribeToNotifications(listener: () => void): () => void {
  // TODO(api): live updates (e.g. server-sent events) or refetch on focus.
  return IS_DEMO_MODE ? demo.subscribeToSession(listener) : () => {};
}

/** Demo: changes the logged-in account's notifications with `change`. */
function updateDemoNotifications(change: (notifications: AppNotification[]) => AppNotification[]) {
  const email = demo.getSessionEmail();
  if (!email) return;
  demo.updateAccount(email, { notifications: change(demo.findAccount(email)?.notifications ?? []) });
}

/** Marks one notification as read (tapped, or "Mark as read" in its menu). */
export async function markNotificationRead(id: string): Promise<void> {
  // TODO(api): POST /api/notifications/:id/read
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    updateDemoNotifications((notifications) =>
      notifications.map((notification) =>
        notification.id === id && !notification.readAt ? { ...notification, readAt: now } : notification,
      ),
    );
  }
}

/** Removes one notification ("Delete" in its menu). */
export async function deleteNotification(id: string): Promise<void> {
  // TODO(api): DELETE /api/notifications/:id
  if (IS_DEMO_MODE) {
    updateDemoNotifications((notifications) => notifications.filter((notification) => notification.id !== id));
  }
}
