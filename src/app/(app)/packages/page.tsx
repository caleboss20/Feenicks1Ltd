import type { Metadata } from "next";
import { RecommendedPackagesScreen } from "@/features/packages/RecommendedPackagesScreen";

/**
 * Route: `/packages` (packages matched to the user's risk profile, then the rest).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Packages for you",
  robots: { index: false, follow: false },
};

export default function PackagesPage() {
  return <RecommendedPackagesScreen />;
}
