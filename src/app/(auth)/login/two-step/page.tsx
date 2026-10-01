import type { Metadata } from "next";
import { LoginTwoStepScreen } from "@/features/auth/LoginTwoStepScreen";

/**
 * Route: `/login/two-step` (log-in, step 2 when 2FA is on: enter the code).
 * Private mid-flow step → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Two-step verification",
  robots: { index: false, follow: false },
};

export default function LoginTwoStepPage() {
  return <LoginTwoStepScreen />;
}
