import type { Metadata, Viewport } from "next";
import { ACCOUNT_PAGE_COLORS } from "@/features/account/accountTheme";
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
 * Phone status bar in the page's light grey, so the two read as one surface
 * (the screen switches it to dark in dark mode: useStatusBarColor).
 */
export const viewport: Viewport = {
  themeColor: ACCOUNT_PAGE_COLORS.light,
};

export default function AccountPage() {
  return <AccountScreen />;
}
