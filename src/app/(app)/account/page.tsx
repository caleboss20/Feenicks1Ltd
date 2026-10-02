import type { Metadata, Viewport } from "next";
import { AccountScreen } from "@/features/account/AccountScreen";

/**
 * Route: `/account` (your account and settings). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * Phone status bar in the page's light grey (`bg-neutral-100`), so the two
 * read as one surface.
 */
export const viewport: Viewport = {
  themeColor: "#f5f5f5",
};

export default function AccountPage() {
  return <AccountScreen />;
}
