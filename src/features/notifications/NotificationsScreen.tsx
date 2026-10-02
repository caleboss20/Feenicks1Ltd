/**
 * Notifications: opened from the bell in the dashboard header.
 *
 *   ← Notifications
 *
 *            (🔔)
 *     No notifications yet
 *     We'll let you know here about …
 *
 * TODO(api): the user's notifications (returns paid, investment matured,
 * new sign-in, …) and an unread dot on the dashboard bell.
 */

import { BellIcon } from "@/components/icons";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";

export function NotificationsScreen() {
  return (
    <StepScreenLayout title="Notifications" backHref={ROUTES.dashboard}>
      <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <BellIcon className="size-7" />
        </span>
        <h2 className="mt-5 text-lg font-semibold">No notifications yet</h2>
        <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          We&apos;ll let you know here about your investments, returns and account security.
        </p>
      </div>
    </StepScreenLayout>
  );
}
