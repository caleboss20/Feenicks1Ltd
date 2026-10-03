import type { Metadata, Viewport } from "next";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { AnalyticsScreen } from "@/features/analytics/AnalyticsScreen";

/**
 * Route: `/analytics` (your investment analytics). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's light grey (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

export default function AnalyticsPage() {
  return <AnalyticsScreen />;
}
