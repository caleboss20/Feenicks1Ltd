import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/SignUpForm";

/**
 * Route: `/sign-up`
 * Server Component (for metadata) that renders the client-side form.
 */
export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your free Feenicks1 account in seconds and start investing with bank-grade security.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return <SignUpForm />;
}
