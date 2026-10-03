import type { Metadata } from "next";
import { RiskProfileQuestionsScreen } from "@/features/investor-profile/RiskProfileQuestionsScreen";

/**
 * Route: `/account/investor-profile/questions`: take (or retake) the risk
 * profile questions inside the app; finishing returns to
 * `/account/investor-profile`.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Investor profile",
  robots: { index: false, follow: false },
};

export default function AccountInvestorProfileQuestionsPage() {
  return <RiskProfileQuestionsScreen flow="app" />;
}
