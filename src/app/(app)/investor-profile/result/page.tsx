import type { Metadata } from "next";
import { RiskProfileResultScreen } from "@/features/investor-profile/RiskProfileResultScreen";

/**
 * Route: `/investor-profile/result` (the user's risk profile).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Your investor profile",
  robots: { index: false, follow: false },
};

export default function RiskProfileResultPage() {
  return <RiskProfileResultScreen />;
}
