import type { Metadata } from "next";
import { ConfirmSmsCodeScreen } from "@/features/security/ConfirmSmsCodeScreen";

/**
 * Route: `/security/two-factor/sms` (enter the SMS code to turn on 2FA).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Confirmation code",
  robots: { index: false, follow: false },
};

export default function TwoFactorSmsPage() {
  return <ConfirmSmsCodeScreen />;
}
