import type { Metadata, Viewport } from "next";
import { NotificationsScreen } from "@/features/notifications/NotificationsScreen";

/**
 * Route: `/notifications`, from the bell on Home and Account.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

/** Status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
