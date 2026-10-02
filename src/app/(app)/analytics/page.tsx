import type { Metadata } from "next";
import { AnalyticsScreen } from "@/features/analytics/AnalyticsScreen";

/**
 * Route: `/analytics` (your investment analytics). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return <AnalyticsScreen />;
}