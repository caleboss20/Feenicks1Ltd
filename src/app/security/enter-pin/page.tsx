import type { Metadata } from "next";
import { EnterPinScreen } from "@/features/security/EnterPinScreen";

/**
 * Route: `/security/enter-pin` (returning users unlock the app with their PIN).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Enter your PIN",
  robots: { index: false, follow: false },
};

export default function EnterPinPage() {
  return <EnterPinScreen />;
}
