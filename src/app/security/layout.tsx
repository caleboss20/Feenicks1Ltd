import { RequireLogin } from "@/features/auth/RequireLogin";

/**
 * Shared layout for account-security screens: `/security/...`
 * (create PIN, two-factor setup, enter PIN).
 * Same clean white, centred column as the auth and KYC screens.
 * Logged-in users only: anyone else is sent to Log in (see RequireLogin).
 */
export default function SecurityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <RequireLogin>{children}</RequireLogin>
    </div>
  );
}
