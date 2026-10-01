import type { Metadata } from "next";
import { FillProfileScreen } from "@/features/kyc/FillProfileScreen";

/**
 * Route: `/kyc/profile` (KYC step 6: "Fill Your Profile").
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <FillProfileScreen />;
}
