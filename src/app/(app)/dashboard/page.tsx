import type { Metadata, Viewport } from "next";
import { DASHBOARD_TOP_COLOR } from "@/features/dashboard/dashboardTheme";
import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

/**
 * Route: `/dashboard` (home of the app for registered users).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/** Phone status bar in the same deep green as the top of the balance section, so they blend. */
export const viewport: Viewport = {
  themeColor: DASHBOARD_TOP_COLOR,
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
