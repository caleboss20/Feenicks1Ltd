import type { Metadata } from "next";
import { RecommendedPackagesScreen } from "@/features/packages/RecommendedPackagesScreen";

/**
 * Route: `/invest/packages`: all the packages inside the app, to choose one
 * or change the chosen one (Invest › Change package, Account › Investment
 * packages). Back always stays in the app (config/investingFlow.ts).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Investment packages",
  robots: { index: false, follow: false },
};

export default function InvestPackagesPage() {
  return <RecommendedPackagesScreen flow="app" />;
}
