import type { Metadata } from "next";
import { InvestmentGoalsScreen } from "@/features/kyc/InvestmentGoalsScreen";

/**
 * Route: `/kyc/investment-goals` (KYC step 1: "Why are you investing?").
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Your investment goals",
  robots: { index: false, follow: false },
};

export default function InvestmentGoalsPage() {
  return <InvestmentGoalsScreen />;
}
