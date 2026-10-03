import type { Metadata, Viewport } from "next";
import { DashboardColorScreen } from "@/features/account/DashboardColorScreen";

/**
 * Route: `/account/dashboard-color` (choose the colour behind the balance on
 * Home), from Account › Dashboard colour. Private, logged-in users only →
 * hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Dashboard colour",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function DashboardColorPage() {
  return <DashboardColorScreen />;
}
