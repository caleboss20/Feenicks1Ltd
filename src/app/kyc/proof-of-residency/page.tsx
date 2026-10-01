import type { Metadata } from "next";
import { ProofOfResidencyScreen } from "@/features/kyc/ProofOfResidencyScreen";

/**
 * Route: `/kyc/proof-of-residency` (KYC step 3: nationality + ID document).
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Proof of residency",
  robots: { index: false, follow: false },
};

export default function ProofOfResidencyPage() {
  return <ProofOfResidencyScreen />;
}
