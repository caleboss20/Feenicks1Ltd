import type { Metadata } from "next";
import { ChooseTwoFactorMethodScreen } from "@/features/security/ChooseTwoFactorMethodScreen";

/**
 * Route: `/security/two-factor` (choose a two-factor method, or skip).
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Two-factor authentication",
  robots: { index: false, follow: false },
};

export default function TwoFactorPage() {
  return <ChooseTwoFactorMethodScreen />;
}
