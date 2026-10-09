"use client";

/**
 * Notifications (the bell on Home and Account), after the user's reference:
 * real events on the account, newest first. White page (black in dark mode).
 *
 *   ←              NOTIFICATIONS
 *   ┌───────────────────────────────────────────────┐
 *   │ 🛡  New log-in                              ⋮ │  ← unread: light grey row
 *   │     You logged in on Chrome on Android…      │    ⋮ → Mark as read · Delete
 *   │     2 hours ago                              │
 *   └───────────────────────────────────────────────┘
 *     💬  We received your message                 ⋮   ← read: plain white
 *         Reference SUP532438. Our team will…
 *         2 days ago
 *
 * Each notification was created when its event happened (notificationModel.ts):
 * nothing made up, nothing from the demo's sample year. Tapping one marks it
 * read and opens where it leads (if anywhere). Empty: a grey bell.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BellIcon,
  MessageIcon,
  MoreVerticalIcon,
  ShieldCheckIcon,
  TrendUpIcon,
  UserIcon,
} from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationKind } from "./notificationModel";
import { deleteNotification, markNotificationRead } from "./notificationsService";
import { useNotifications } from "./useNotifications";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

/** Each kind's icon and colour, like the reference's coloured icons. */
const KIND_ICONS: Record<NotificationKind, { icon: React.ReactNode; className: string }> = {
  security: { icon: <ShieldCheckIcon />, className: "text-blue-600 dark:text-blue-400" },
  account: { icon: <UserIcon />, className: "text-neutral-700 dark:text-neutral-300" },
  investing: { icon: <TrendUpIcon />, className: "text-brand-700 dark:text-brand-400" },
  support: { icon: <MessageIcon />, className: "text-amber-600 dark:text-amber-400" },
};

/** "Just now" · "5 minutes ago" · "3 hours ago" · "Yesterday" · "4 days ago" · "29 Sept". */
function timeAgo(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const date = new Date(iso);
  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === new Date(now).getFullYear() ? {} : { year: "numeric" }),
  });
}

export function NotificationsScreen() {
  useStatusBarColor(PAGE_COLORS);
  const router = useRouter();
  const notifications = useNotifications();
  // "2 hours ago" is worked out against when the screen opened.
  const [now] = useState(() => Date.now());

  /** Back where they came from (Home or Account); Home if they landed here directly. */
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.dashboard));

  /** Tapping a notification: it's been seen; then go where it leads, if anywhere. */
  const open = (notification: AppNotification) => {
    if (!notification.readAt) void markNotificationRead(notification.id);
    if (notification.href) router.push(notification.href);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-center text-sm font-semibold tracking-[0.12em] uppercase">Notifications</h1>
      </header>

      {notifications === null ? null : notifications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          {/* Grey bell on a grey circle (no green). */}
          <span className="grid size-16 place-items-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            <BellIcon className="size-7" />
          </span>
          <p className="mt-5 text-lg font-semibold">No notifications yet</p>
          <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            When something happens on your account (a log-in, a change to your security, a
            message to us), you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <ul className="mt-3">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              when={timeAgo(notification.createdAt, now)}
              onOpen={() => open(notification)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  when,
  onOpen,
}: {
  notification: AppNotification;
  when: string;
  onOpen: () => void;
}) {
  const isUnread = !notification.readAt;
  const kind = KIND_ICONS[notification.kind];

  return (
    <li
      className={cn(
        "relative flex items-start gap-1 pr-2 transition-colors",
        // Unread: a light grey row, like the reference.
        isUnread && "bg-neutral-50 dark:bg-white/5",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3.5 py-4 pl-5 text-left"
      >
        <span aria-hidden className={cn("mt-0.5 shrink-0 [&_svg]:size-6", kind.className)}>
          {kind.icon}
        </span>
        <span className="min-w-0 flex-1">
          {isUnread && <span className="sr-only">Unread: </span>}
          <span className={cn("block text-[0.9375rem] leading-snug", isUnread ? "font-semibold" : "font-medium")}>
            {notification.title}
          </span>
          <span className="mt-1 block text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {notification.body}
          </span>
          <time
            dateTime={notification.createdAt}
            className="mt-1.5 block text-xs text-neutral-500 dark:text-neutral-400"
          >
            {when}
          </time>
        </span>
      </button>
      <RowMenu notification={notification} />
    </li>
  );
}

/** The ⋮ menu on a row: Mark as read (if unread) and Delete. Closes on a tap outside or Escape. */
function RowMenu({ notification }: { notification: AppNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const itemClass =
    "block w-full cursor-pointer px-4 py-2.5 text-left text-[0.8125rem] text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-white/5";

  return (
    <div ref={menuRef} className="relative pt-3">
      <button
        type="button"
        aria-label={`Options for “${notification.title}”`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="grid size-9 cursor-pointer place-items-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
      >
        <MoreVerticalIcon className="size-5" />
      </button>
      {isOpen && (
        // A border rather than a shadow (no shadows in this app).
        <div
          role="menu"
          className="absolute top-full right-1 z-20 w-40 overflow-hidden rounded-xl bg-white py-1 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10"
        >
          {!notification.readAt && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                void markNotificationRead(notification.id);
              }}
              className={itemClass}
            >
              Mark as read
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              void deleteNotification(notification.id);
            }}
            className={cn(itemClass, !notification.readAt && "border-t border-neutral-100 dark:border-white/10")}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
