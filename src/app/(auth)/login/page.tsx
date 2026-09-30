import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

/**
 * Route: `/login`
 * Server Component (for metadata) that renders the client-side form.
 */
export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Feenicks1 account to manage and grow your investments.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginForm />;
}
