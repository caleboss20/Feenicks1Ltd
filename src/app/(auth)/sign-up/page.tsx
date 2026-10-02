import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/SignUpForm";
import { parseReferralCode } from "@/features/referrals/referralService";

/**
 * Route: `/sign-up`, or `/sign-up?ref=F1ABC123` from a friend's invite link
 * or referral QR code.
 * Server Component (for metadata) that renders the client-side form.
 */
export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your free Feenicks1 account in seconds and start investing with bank-grade security.",
  alternates: { canonical: "/sign-up" },
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { ref } = await searchParams;
  return <SignUpForm referralCode={parseReferralCode(ref)} />;
}
