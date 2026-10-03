import type { Metadata, Viewport } from "next";
import { SupportScreen } from "@/features/support/SupportScreen";

/**
 * Route: `/support` (Help & support), from the headset on Home and Account ›
 * Help & support. Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Help & support",
  robots: { index: false, follow: false },
};

/** Status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function SupportPage() {
  return <SupportScreen />;
}
