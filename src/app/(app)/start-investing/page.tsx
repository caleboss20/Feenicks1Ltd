import type { Metadata } from "next";
import { StartInvestingIntroScreen } from "@/features/investor-profile/StartInvestingIntroScreen";

/**
 * Route: `/start-investing` (shown once after registration: introduces the
 * investor risk profile and package matching, before the dashboard).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Build your investment plan",
  robots: { index: false, follow: false },
};

export default function StartInvestingPage() {
  return <StartInvestingIntroScreen />;
}
