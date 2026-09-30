import type { Metadata } from "next";
import { VerifyResetCodeScreen } from "@/features/forgot-password/VerifyResetCodeScreen";

/**
 * Route: `/forgot-password/verify-code` (step 2 of 3: enter the code).
 * A nested route: this folder sits inside `forgot-password/`, so its URL does too.
 * Private mid-flow step → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Enter your code",
  robots: { index: false, follow: false },
};

export default function VerifyCodePage() {
  return <VerifyResetCodeScreen />;
}
