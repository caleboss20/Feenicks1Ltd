import type { Metadata } from "next";
import { NotificationsScreen } from "@/features/notifications/NotificationsScreen";

/**
 * Route: `/notifications`, from the bell on the dashboard.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
