"use client";

/**
 * Invisible Client Component that moves the user on from the splash screen.
 *
 * Kept separate from the visible markup on purpose: the splash UI stays a
 * Server Component (fully rendered HTML, good for SEO and first paint) and
 * only this small piece of logic runs in the browser.
 *
 * Flow after SPLASH_DURATION_MS:
 *   first visit      → /onboarding
 *   returning user   → /login
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useAppStore } from "@/stores/useAppStore";

/** How long the splash screen stays visible, in milliseconds. */
export const SPLASH_DURATION_MS = 87500;

export function SplashRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Read the store with getState() instead of the hook. We only need the
    // value once, at redirect time, so this avoids re-rendering and any
    // server/client hydration mismatch.
    const getNextRoute = () =>
      useAppStore.getState().hasCompletedOnboarding
        ? ROUTES.login
        : ROUTES.onboarding;

    // Start loading the next screen in the background so the switch is instant.
    router.prefetch(getNextRoute());

    const timer = setTimeout(() => {
      // replace() rather than push(): the Back button shouldn't return to the splash.
      router.replace(getNextRoute());
    }, SPLASH_DURATION_MS);

    // Cancel the redirect if the user leaves the page before it fires.
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
