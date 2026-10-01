import type { Metadata } from "next";
import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

/**
 * Route: `/dashboard` (home of the app for registered users).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
