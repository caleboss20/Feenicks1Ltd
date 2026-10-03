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

/**
 * Marks every notification as seen (on opening Notifications). Returns the
 * ids that were unread, so the screen can still show them as new this time.
 */
export async function markAllNotificationsRead(): Promise<string[]> {
  // TODO(api): POST /api/notifications/read-all → { wereUnread: string[] }
  if (IS_DEMO_MODE) {
    const email = demo.getSessionEmail();
    const notifications = (email && demo.findAccount(email)?.notifications) || [];
    const unreadIds = notifications.filter((notification) => !notification.readAt).map((notification) => notification.id);
    if (!email || unreadIds.length === 0) return [];
    const now = new Date().toISOString();
    demo.updateAccount(email, {
      notifications: notifications.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt: now },
      ),
    });
    return unreadIds;
  }
  return [];
}
