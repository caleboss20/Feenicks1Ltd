import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { SupportMessageScreen } from "@/features/support/SupportMessageScreen";

/**
 * Route: `/support/message` (Help & support › Send a message), optionally
 * `?transaction=SMP1182137` from a transaction's "Need help with this?".
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Send a message",
  robots: { index: false, follow: false },
};

/** Status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function SupportMessagePage() {
  return (
    // The screen reads `?transaction=` (useSearchParams), which is only known
    // in the browser: Suspense lets the rest of the page be built ahead.
    <Suspense>
      <SupportMessageScreen />
    </Suspense>
  );
}
