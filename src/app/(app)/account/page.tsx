import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/AccountScreen";

/**
 * Route: `/account` (your account and settings). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountScreen />;
}