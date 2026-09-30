import type { Metadata } from "next";
import { VerifyIdentityIntroScreen } from "@/features/kyc/VerifyIdentityIntroScreen";

/**
 * Route: `/kyc/verify-identity` (KYC step 2: "Let's Verify Your Identity").
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Verify your identity",
  robots: { index: false, follow: false },
};

export default function VerifyIdentityPage() {
  return <VerifyIdentityIntroScreen />;
}
