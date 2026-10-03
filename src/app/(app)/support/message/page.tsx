import type { Metadata, Viewport } from "next";
import { SupportMessageScreen } from "@/features/support/SupportMessageScreen";

/**
 * Route: `/support/message` (Help & support › Send a message).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Send a message",
  robots: { index: false, follow: false },
};

/** Status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function SupportMessagePage() {
  return <SupportMessageScreen />;
}
