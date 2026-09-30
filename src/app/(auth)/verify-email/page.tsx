import type { Metadata } from "next";
import { VerifyEmailScreen } from "@/features/auth/VerifyEmailScreen";

/**
 * Route: `/verify-email` (enter the code emailed after sign-up).
 * Private mid-flow step → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return <VerifyEmailScreen />;
}
