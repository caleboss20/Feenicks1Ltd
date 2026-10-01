import type { Metadata } from "next";
import { RiskProfileQuestionsScreen } from "@/features/investor-profile/RiskProfileQuestionsScreen";

/**
 * Route: `/investor-profile` (the risk profile questions, 3 short steps).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Investor profile",
  robots: { index: false, follow: false },
};

export default function RiskProfileQuestionsPage() {
  return <RiskProfileQuestionsScreen />;
}
