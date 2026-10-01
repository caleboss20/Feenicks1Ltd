import type { Metadata } from "next";
import { UploadIdScreen } from "@/features/kyc/UploadIdScreen";

/**
 * Route: `/kyc/upload-id` (KYC step 4: photos of the ID document).
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Upload your ID",
  robots: { index: false, follow: false },
};

export default function UploadIdPage() {
  return <UploadIdScreen />;
}
