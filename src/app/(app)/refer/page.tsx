import type { Metadata } from "next";
import { ReferScreen } from "@/features/referrals/ReferScreen";

/**
 * Route: `/refer` (the user's referral QR code), from the dashboard's scan button.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Invite a friend",
  robots: { index: false, follow: false },
};

export default function ReferPage() {
  return <ReferScreen />;
}
