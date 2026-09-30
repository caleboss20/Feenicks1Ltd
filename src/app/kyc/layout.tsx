/**
 * Shared layout for the identity-verification (KYC) screens: `/kyc/...`.
 * Same clean white, centred column as the auth screens.
 */
export default function KycLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-dvh flex-col bg-background">{children}</div>;
}
