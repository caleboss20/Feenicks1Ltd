import type { Metadata } from "next";
import { ChooseResetMethodScreen } from "@/features/forgot-password/ChooseResetMethodScreen";

/** Route: `/forgot-password` (step 1 of 3: choose SMS or email). */
export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Feenicks1 password securely with a code sent by SMS or email.",
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return <ChooseResetMethodScreen />;
}
