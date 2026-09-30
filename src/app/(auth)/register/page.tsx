import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";

/**
 * Route: `/register`
 * Server Component (for metadata) that renders the client-side form.
 */
export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your free Feenicks1 account in seconds and start investing with bank-grade security.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
