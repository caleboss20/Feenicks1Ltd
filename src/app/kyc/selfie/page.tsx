import type { Metadata } from "next";
import { SelfieWithIdScreen } from "@/features/kyc/SelfieWithIdScreen";

/**
 * Route: `/kyc/selfie` (KYC step 5: selfie matched against the uploaded ID).
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Selfie with ID",
  robots: { index: false, follow: false },
};

export default function SelfiePage() {
  return <SelfieWithIdScreen />;
}
