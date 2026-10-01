import type { Metadata } from "next";
import { CreatePinScreen } from "@/features/security/CreatePinScreen";

/**
 * Route: `/security/create-pin` ("Create New PIN").
 * Private, signed-up users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Create your PIN",
  robots: { index: false, follow: false },
};

export default function CreatePinPage() {
  return <CreatePinScreen />;
}
