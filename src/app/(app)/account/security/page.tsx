import type { Metadata, Viewport } from "next";
import { SecurityCentreScreen } from "@/features/security/SecurityCentreScreen";

/**
 * Route: `/account/security` (Security centre: protections, signed-in
 * devices, recent security activity), from Account › Security centre.
 */
export const metadata: Metadata = {
  title: "Security centre",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function SecurityCentrePage() {
  return <SecurityCentreScreen />;
}
