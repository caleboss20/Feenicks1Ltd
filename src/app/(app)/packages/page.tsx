import type { Metadata } from "next";
import { RecommendedPackagesScreen } from "@/features/packages/RecommendedPackagesScreen";

/**
 * Route: `/packages`: the last step of start investing (onboarding, once after
 * registration): packages matched to the risk profile, then the rest.
 * Inside the app the same list lives at `/invest` (config/investingFlow.ts).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Packages for you",
  robots: { index: false, follow: false },
};

export default function PackagesPage() {
  return <RecommendedPackagesScreen flow="onboarding" />;
}
