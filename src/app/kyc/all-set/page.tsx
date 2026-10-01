import type { Metadata } from "next";
import { AllSetScreen } from "@/features/kyc/AllSetScreen";

/**
 * Route: `/kyc/all-set` ("You're all set" celebration after the profile).
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "You're all set",
  robots: { index: false, follow: false },
};

export default function AllSetPage() {
  return <AllSetScreen />;
}
