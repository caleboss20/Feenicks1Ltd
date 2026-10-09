import type { Metadata, Viewport } from "next";
import { AboutScreen } from "@/features/account/AboutScreen";

/**
 * Route: `/account/about` (About Feenicks1: who we are, how your money is
 * handled, the risks, how to reach us), from Account › About Feenicks1.
 */
export const metadata: Metadata = {
  title: "About Feenicks1",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function AboutPage() {
  return <AboutScreen />;
}
