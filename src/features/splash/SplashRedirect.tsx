"use client";

/**
 * Moves the user on from the splash screen, with the next screen sliding up
 * over it like a sheet.
 *
 * Kept separate from the visible markup on purpose: the splash UI stays a
 * Server Component (fully rendered HTML, good for SEO and first paint) and
 * only this small piece runs in the browser.
 *
 *   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 *   │      🔥      │      │      🔥      │      │ ╭──────────╮ │
 *   │  Feenicks1   │  →   │ ╭──────────╮ │  →   │ │ welcome  │ │ → the real
 *   │              │      │ │ welcome  │ │      │ │  photo   │ │   screen
 *   └──────────────┘      └─┴──────────┴─┘      └─┴──────────┴─┘
 *    the phoenix           the sheet rises, rounded top; the splash dims
 *
 * Flow:
 *   SPLASH_DURATION_MS − SHEET_MS  the sheet starts rising
 *   SPLASH_DURATION_MS             it has covered the splash: go
 *     first visit    → /onboarding (the sheet shows its first photo and
 *                      shade, so the welcome screen is already "there")
 *     returning user → /login (the sheet is the log-in screen's colour)
 * The sheet waits off-screen from the start, so the photo is loaded long
 * before it is needed. Reduce motion: no slide, the sheet simply appears.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { PHOTOS, WELCOME_SHADE } from "@/features/onboarding/OnboardingScreen";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

/** How long the splash screen stays visible, in milliseconds. */
export const SPLASH_DURATION_MS = 6500;
/** How long the next screen takes to slide up over the splash. */
const SHEET_MS = 650;

const FIRST_PHOTO = PHOTOS[0];

export function SplashRedirect() {
  const router = useRouter();
  /** Where we're going, once the sheet starts rising (null until then). */
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    // Read the store with getState() instead of the hook: we only need the
    // value at redirect time, and this avoids any hydration mismatch.
    const getNextRoute = () =>
      useAppStore.getState().hasCompletedOnboarding ? ROUTES.login : ROUTES.onboarding;

    // Start loading the next screen in the background so the switch is instant.
    router.prefetch(getNextRoute());

    const rise = setTimeout(() => setNext(getNextRoute()), SPLASH_DURATION_MS - SHEET_MS);
    const go = setTimeout(() => {
      // replace() rather than push(): the Back button shouldn't return to the splash.
      router.replace(getNextRoute());
    }, SPLASH_DURATION_MS);

    // Cancel if the user leaves the page before it fires.
    return () => {
      clearTimeout(rise);
      clearTimeout(go);
    };
  }, [router]);

  const rising = next !== null;
  const toWelcome = next !== ROUTES.login;

  return (
    <>
      {/* The splash dims a little as the sheet covers it. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-40 bg-black transition-opacity ease-out motion-reduce:transition-none",
          rising ? "opacity-40" : "opacity-0",
        )}
        style={{ transitionDuration: `${SHEET_MS}ms` }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-50 overflow-hidden rounded-t-[2rem] transition-transform motion-reduce:transition-none",
          toWelcome ? "bg-neutral-950" : "bg-background",
          rising ? "translate-y-0" : "translate-y-full",
        )}
        style={{ transitionDuration: `${SHEET_MS}ms`, transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {toWelcome && (
          <>
            <Image
              src={FIRST_PHOTO.src}
              alt=""
              fill
              loading="eager"
              // Same request as the welcome screen's first photo, so it's
              // one download, already cached when that screen opens.
              sizes="(min-width: 1024px) 50vw, 100vh"
              quality={90}
              className="object-cover"
              style={{ objectPosition: FIRST_PHOTO.focus }}
            />
            <span className={cn("absolute inset-0", WELCOME_SHADE)} />
          </>
        )}
      </div>
    </>
  );
}
