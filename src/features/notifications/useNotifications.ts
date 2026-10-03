"use client";

import { useEffect, useState } from "react";
import type { AppNotification } from "./notificationModel";
import { getNotifications, subscribeToNotifications } from "./notificationsService";

/**
 * The user's notifications (newest first), or null while they first load.
 * Shared by the Notifications screen and the dashboard bell's unread dot,
 * and reloaded when they change.
 */
export function useNotifications(): AppNotification[] | null {
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void getNotifications().then((list) => {
        if (!cancelled) setNotifications(list);
      });
    };
    load();
    const unsubscribe = subscribeToNotifications(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return notifications;
}

/** How many notifications haven't been seen yet (0 while loading): the bells' dot. */
export function useUnreadNotificationCount(): number {
  const notifications = useNotifications();
  return notifications?.filter((notification) => !notification.readAt).length ?? 0;
}
