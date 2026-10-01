import type { Metadata } from "next";
import { ConfirmAuthenticatorCodeScreen } from "@/features/security/ConfirmAuthenticatorCodeScreen";

/**
 * Route: `/security/two-factor/authenticator/confirm` (enter the app's 6-digit code).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Confirmation code",
  robots: { index: false, follow: false },
};

export default function ConfirmAuthenticatorCodePage() {
  return <ConfirmAuthenticatorCodeScreen />;
}
