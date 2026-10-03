import type { Metadata } from "next";
import { RecommendedPackagesScreen } from "@/features/packages/RecommendedPackagesScreen";

/**
 * Route: `/invest`: the investment packages inside the app (the dashboard's
 * Invest button, Account › Investment packages…). Back always stays in the
 * app (config/investingFlow.ts).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Investment packages",
  robots: { index: false, follow: false },
};

export default function InvestPage() {
  return <RecommendedPackagesScreen flow="app" />;
}
