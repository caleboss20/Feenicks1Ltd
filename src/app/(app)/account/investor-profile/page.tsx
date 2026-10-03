import type { Metadata } from "next";
import { RiskProfileResultScreen } from "@/features/investor-profile/RiskProfileResultScreen";

/**
 * Route: `/account/investor-profile`: the user's risk profile inside the app
 * (Account › Investor profile): see matching packages, or retake it. Without
 * a profile yet, it opens the questions.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Investor profile",
  robots: { index: false, follow: false },
};

export default function AccountInvestorProfilePage() {
  return <RiskProfileResultScreen flow="app" />;
}
