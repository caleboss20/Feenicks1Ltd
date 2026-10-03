/**
 * A notification: something that actually happened on the account, told to
 * the user (on the Notifications screen; later also by push, SMS or email).
 *
 * Only ever created at the moment the event happens (a log-in, a PIN change,
 * a message to support…): never made up, and never from the demo's sample
 * year. A new account starts with none.
 */

export type NotificationKind = "security" | "account" | "investing" | "support";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** When it happened (ISO date-time). */
  createdAt: string;
  /** When it was seen (Notifications opened); absent = unread. */
  readAt?: string;
  /** Where tapping it leads, if anywhere. */
  href?: string;
};

/** What the server (or the demo backend) is told when something happens. */
export type NewNotification = Pick<AppNotification, "kind" | "title" | "body" | "href">;
