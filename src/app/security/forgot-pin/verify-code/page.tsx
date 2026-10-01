import type { Metadata } from "next";
import { VerifyPinResetCodeScreen } from "@/features/security/VerifyPinResetCodeScreen";

/**
 * Route: `/security/forgot-pin/verify-code` (Forgot PIN, step 2: enter the SMS code).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Confirmation code",
  robots: { index: false, follow: false },
};

export default function VerifyPinResetCodePage() {
  return <VerifyPinResetCodeScreen />;
}
