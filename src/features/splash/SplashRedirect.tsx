"use client";

/**
 * Moves the user on from the splash screen with a "pop": the splash's logo
 * zooms gently forward and fades (pops out) while the next screen fades in,
 * growing from slightly smaller to full size with a soft bounce (pops in).
 *
 * Kept separate from the visible markup on purpose: the splash UI stays a
 * Server Component (fully rendered HTML, good for SEO and first paint) and
 * only this small piece runs in the browser.
 *
 *   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 *   │      🔥      │      │   ╭──────╮   │      │              │
 *   │  Feenicks1   │  →   │   │welcome│  │  →   │   welcome    │ → the real
 *   │              │      │   ╰──────╯   │      │    photo     │   screen
 *   └──────────────┘      └──────────────┘      └──────────────┘
 *    the phoenix           logo pops out, next screen pops in
 *
 * Flow:
 *   SPLASH_DURATION_MS − POP_MS  the pop starts (html[data-splash-leaving]
 *                                tells globals.css to pop the logo out)
 *   SPLASH_DURATION_MS           the next screen is in place: go
 *     first visit    → /onboarding (it shows the welcome screen's first
 *                      photo and shade, so that screen is already "there")
 *     returning user → /login (the log-in screen's colour)
 * The layer is mounted (invisible) from the start, so the photo is loaded
 * long before it is needed. Reduce motion: a plain quick fade.
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
/** How long the pop takes. */
const POP_MS = 650;

const FIRST_PHOTO = PHOTOS[0];

export function SplashRedirect() {
  const router = useRouter();
  /** Where we're going, once the pop starts (null until then). */
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    // Read the store with getState() instead of the hook: we only need the
    // value at redirect time, and this avoids any hydration mismatch.
    const getNextRoute = () =>
      useAppStore.getState().hasCompletedOnboarding ? ROUTES.login : ROUTES.onboarding;

    // Start loading the next screen in the background so the switch is instant.
    router.prefetch(getNextRoute());

    const pop = setTimeout(() => {
      document.documentElement.dataset.splashLeaving = "";
      setNext(getNextRoute());
    }, SPLASH_DURATION_MS - POP_MS);
    const go = setTimeout(() => {
      // replace() rather than push(): the Back button shouldn't return to the splash.
      router.replace(getNextRoute());
    }, SPLASH_DURATION_MS);

    // Cancel if the user leaves the page before it fires.
    return () => {
      clearTimeout(pop);
      clearTimeout(go);
      delete document.documentElement.dataset.splashLeaving;
    };
  }, [router]);

  const popping = next !== null;
  const toWelcome = next !== ROUTES.login;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-50 overflow-hidden transition-[opacity,scale,border-radius] motion-reduce:transition-opacity",
        toWelcome ? "bg-neutral-950" : "bg-background",
        popping ? "scale-100 rounded-none opacity-100" : "scale-[0.9] rounded-[2.5rem] opacity-0 motion-reduce:scale-100",
      )}
      // A soft overshoot on the scale: the "pop".
      style={{ transitionDuration: `${POP_MS}ms`, transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)" }}
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
  );
}
