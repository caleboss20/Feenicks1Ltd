import type { Metadata } from "next";
import { Onboarding } from "@/features/onboarding/Onboarding";

/**
 * Route: `/onboarding`
 *
 * The page stays a Server Component so it can export metadata. The
 * interactive carousel is a Client Component rendered inside it.
 */
export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Invest, track your portfolio and grow your wealth with Feenicks1. Get started in minutes.",
  alternates: { canonical: "/onboarding" },
};

export default function OnboardingPage() {
  return <Onboarding />;
}
