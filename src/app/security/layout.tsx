/**
 * Shared layout for account-security screens: `/security/...`
 * (PIN now; later fingerprint / Face ID and 2-step verification).
 * Same clean white, centred column as the auth and KYC screens.
 */
export default function SecurityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-dvh flex-col bg-background">{children}</div>;
}
