import type { Metadata } from "next";
import { AuthenticatorQrScreen } from "@/features/security/AuthenticatorQrScreen";

/**
 * Route: `/security/two-factor/authenticator` (scan the QR code with an authenticator app).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Two-factor authentication",
  robots: { index: false, follow: false },
};

export default function AuthenticatorQrPage() {
  return <AuthenticatorQrScreen />;
}
