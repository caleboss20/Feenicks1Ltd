import type { Metadata } from "next";
import { CreateNewPasswordScreen } from "@/features/forgot-password/CreateNewPasswordScreen";

/**
 * Route: `/forgot-password/new-password` (step 3 of 3: choose a new password).
 * Private mid-flow step → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Create new password",
  robots: { index: false, follow: false },
};

export default function NewPasswordPage() {
  return <CreateNewPasswordScreen />;
}
