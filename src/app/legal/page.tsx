import type { Metadata } from "next";
import { LegalIndexScreen } from "@/features/legal/LegalScreens";

/** Route: `/legal` — the legal centre (public: readable before sign-up). */
export const metadata: Metadata = {
  title: "Legal",
  robots: { index: false, follow: false },
};

export default function LegalPage() {
  return <LegalIndexScreen />;
}
