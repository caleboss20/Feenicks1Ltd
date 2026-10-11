import type { Metadata, Viewport } from "next";
import { StatementsScreen } from "@/features/statements/StatementsScreen";

/**
 * Route: `/account/statements` (account statements as PDF or Excel for any
 * period), from Account › Statements, Home's Performance card and
 * Transactions. Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Statements",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#f4f4ef",
};

export default function StatementsPage() {
  return <StatementsScreen />;
}
