import type { Metadata } from "next";
import { InvestStartScreen } from "@/features/packages/InvestStartScreen";

/**
 * Route: `/invest`: the dashboard's Invest button. Opens the investor's
 * package (chosen at sign-up, or the one they're invested in), or the
 * packages list if they haven't chosen one. Back always stays in the app.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Invest",
  robots: { index: false, follow: false },
};

export default function InvestPage() {
  return <InvestStartScreen />;
}
