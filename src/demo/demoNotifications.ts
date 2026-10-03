import type { AppNotification, NewNotification } from "@/features/notifications/notificationModel";
import * as demo from "./demoAccounts";

/**
 * DEMO BACKEND: notifications. The services call `notify` at the moment a
 * real event happens (as the real server will, which will also send push,
 * SMS or email). Kept on the demo account, newest first.
 */

/** How many are kept per account; the oldest drop off. */
const MAX_NOTIFICATIONS = 100;

export function notify(email: string, notification: NewNotification) {
  const account = demo.findAccount(email);
  if (!account) return;
  const entry: AppNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  demo.updateAccount(account.email, {
    notifications: [entry, ...(account.notifications ?? [])].slice(0, MAX_NOTIFICATIONS),
  });
}

/** `notify` for whoever is logged in (does nothing if nobody is). */
export function notifySessionAccount(notification: NewNotification) {
  const email = demo.getSessionEmail();
  if (email) notify(email, notification);
}
