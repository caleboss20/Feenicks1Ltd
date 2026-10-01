import { RequireLogin } from "@/features/auth/RequireLogin";

/**
 * Shared layout for the identity-verification (KYC) screens: `/kyc/...`.
 * Same clean white, centred column as the auth screens.
 * Logged-in users only: anyone else is sent to Log in (see RequireLogin).
 */
export default function KycLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <RequireLogin>{children}</RequireLogin>
    </div>
  );
}
