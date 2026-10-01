import type { Metadata } from "next";
import { CreatePinScreen } from "@/features/security/CreatePinScreen";

/**
 * Route: `/security/forgot-pin/new-pin` (Forgot PIN, step 3: choose a new PIN).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Create a new PIN",
  robots: { index: false, follow: false },
};

export default function NewPinPage() {
  return <CreatePinScreen mode="reset" />;
}
