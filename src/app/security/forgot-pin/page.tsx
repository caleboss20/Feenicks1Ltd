import type { Metadata } from "next";
import { ForgotPinScreen } from "@/features/security/ForgotPinScreen";

/**
 * Route: `/security/forgot-pin` (Forgot PIN, step 1: send a code by SMS).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Reset your PIN",
  robots: { index: false, follow: false },
};

export default function ForgotPinPage() {
  return <ForgotPinScreen />;
}
