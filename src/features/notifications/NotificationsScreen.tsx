"use client";

/**
 * Notifications (the bell on Home and Account): real events on the account,
 * newest first, in plain words. White page (black in dark mode).
 *
 *   ←  Notifications
 *   TODAY
 *   ● New log-in                                       2:14 pm   ← ● and bold: new
 *     You logged in on Chrome on Android. If this wasn't you…       since last visit
 *   ─────────────────────────────────────────────────
 *     We received your message                         1:02 pm   ← tap: where it
 *     Reference SUP961883. Our team will get back to you.          leads (Help…)
 *   YESTERDAY
 *     …
 *
 * Every notification was created when its event happened (notificationModel.ts):
 * nothing made up, nothing from the demo's sample year. A new account sees
 * "No notifications yet". Opening this screen marks them all as seen, which
 * clears the dot on the bell; the ones that were new stay marked this visit.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { cn } from "@/lib/utils";
import type { AppNotification } from "./notificationModel";
import { markAllNotificationsRead } from "./notificationsService";
import { useNotifications } from "./useNotifications";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

/** "Today" · "Yesterday" · "29 Sept" · "29 Sept 2025". */
function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** Notifications grouped by day, newest first ("now" is passed in, not read during render). */
function groupByDay(notifications: AppNotification[], now: Date) {
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const notification of notifications) {
    const label = dayLabel(notification.createdAt, now);
    const group = groups.at(-1);
    if (group?.label === label) group.items.push(notification);
    else groups.push({ label, items: [notification] });
  }
  return groups;
}

export function NotificationsScreen() {
  useStatusBarColor(PAGE_COLORS);
  const router = useRouter();
  const notifications = useNotifications();
  // The ones that were new when the screen opened (they're marked as seen
  // straight away, so the bell's dot clears, but still shown as new now).
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    void markAllNotificationsRead().then((ids) =>
      // Merged, not replaced: in development React runs this twice, and the
      // second run finds nothing left unread.
      setNewIds((previous) => new Set([...previous, ...ids])),
    );
  }, []);

  /** Back where they came from (Home or Account); Home if they landed here directly. */
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.dashboard));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="-ml-2 flex items-center gap-1">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-medium">Notifications</h1>
      </header>

      {notifications === null ? null : notifications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
          <p className="text-lg font-semibold">No notifications yet</p>
          <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            When something happens on your account (a log-in, a change to your security, a
            message to us), you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <NotificationList notifications={notifications} newIds={newIds} onOpen={(href) => router.push(href)} />
      )}
    </div>
  );
}

function NotificationList({
  notifications,
  newIds,
  onOpen,
}: {
  notifications: AppNotification[];
  newIds: Set<string>;
  onOpen: (href: string) => void;
}) {
  // "Today" etc. are worked out against the time the list was first shown.
  const [now] = useState(() => new Date());

  return (
    <div className="mt-4 flex flex-col gap-6">
      {groupByDay(notifications, now).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h2 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">{group.label}</h2>
          <ul className="-mx-5 mt-2 border-t border-neutral-100 dark:border-white/10">
            {group.items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                isNew={newIds.has(notification.id)}
                onOpen={onOpen}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NotificationRow({
  notification,
  isNew,
  onOpen,
}: {
  notification: AppNotification;
  isNew: boolean;
  onOpen: (href: string) => void;
}) {
  const time = new Date(notification.createdAt).toLocaleTimeString("en-GH", {
    hour: "numeric",
    minute: "2-digit",
  });
  const content = (
    <>
      {/* New since the last visit: a small dot. */}
      <span
        aria-hidden
        className={cn("mt-2 size-2 shrink-0 rounded-full", isNew ? "bg-brand-600 dark:bg-brand-400" : "bg-transparent")}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cn("text-[0.9375rem] leading-snug", isNew ? "font-semibold" : "font-medium")}>
            {notification.title}
          </span>
          <time dateTime={notification.createdAt} className="shrink-0 text-xs text-neutral-400">
            {time}
          </time>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {notification.body}
        </span>
      </span>
    </>
  );
  const rowClass = "flex w-full items-start gap-3 px-5 py-4 text-left";

  return (
    <li className="border-b border-neutral-100 dark:border-white/10">
      {notification.href ? (
        <button
          type="button"
          onClick={() => onOpen(notification.href!)}
          className={cn(rowClass, "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-white/5")}
        >
          {isNew && <span className="sr-only">New: </span>}
          {content}
        </button>
      ) : (
        <div className={rowClass}>
          {isNew && <span className="sr-only">New: </span>}
          {content}
        </div>
      )}
    </li>
  );
}
