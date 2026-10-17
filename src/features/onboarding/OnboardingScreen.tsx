"use client";

/**
 * Welcome: the first screen after the splash. After the CEO's review of the
 * Bamboo app (October 2026): one screen, one feeling, two clear choices.
 *
 *   ┌───────────────────────────┐
 *   │        Feenicks1 (gold)    │
 *   │                           │
 *   │   full-bleed photo        │  ← slight dark overlay, darker towards
 *   │   slideshow (cross-fade)  │    the bottom (no shadows), so text reads
 *   │                           │
 *   │   Plant.                  │  ← gold, Inter Tight, very large, one
 *   │   Tend.                   │    word per line (as in Bamboo's
 *   │   Reap.                   │    welcome); changes with each photo
 *   │  (Create account)( Log in )│  ← gold / dark green
 *   │   Our portfolios and fees ›│
 *   └───────────────────────────┘
 *
 * Background: a slideshow of the people Feenicks1 is for (CEO, October
 * 2026): individuals, families, students, farmers and property investors.
 * Each photo fades in slowly with a gentle zoom every few
 * seconds: no carousel, no dots, nothing to swipe. Reduced motion: the first
 * photo only. Photos: Pexels (free licence), 1600px; each is cropped (focus)
 * so faces sit in the top half, clear of the shading and the headline.
 * Each photo has its own headline, which fades with the photo. All headlines
 * share one grid cell, so the buttons never move.
 * Both actions mark onboarding as seen (useAppStore), as before.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { useAppStore } from "@/stores/useAppStore";

/**
 * The slides, in order (Pexels photo IDs in comments). Each headline matches
 * its photo, in three single-word lines (at most 7 characters, so each fits a
 * 320px-wide phone at full size). No word is used on more than one slide.
 * `dim` (optional): a bright photo is darkened a little so the gold text reads.
 * `zoom` (optional): enlarges the photo from its bottom edge, lifting a face
 * that sits mid-photo up and clear of the headline.
 */
export const PHOTOS = [
  { src: "/onboarding/individual.jpg", alt: "A young woman in orange smiling at her phone", focus: "50% 25%", headline: ["Start.", "Small.", "Today."] }, // 19863396
  // Supplied by the team (October 2026); confirm its licence before launch.
  { src: "/onboarding/phone-smile.jpg", alt: "A young woman smiling at her phone", focus: "50% 30%", headline: ["Invest.", "Daily.", "Thrive."] },
  // Supplied by the team (October 2026); confirm its licence before launch.
  { src: "/onboarding/family-mother-baby.jpg", alt: "A smiling mother in a headwrap holding her baby", focus: "50% 50%", zoom: 1.15, headline: ["Secure.", "Their.", "Future."] },
  { src: "/onboarding/student-graduate.jpg", alt: "A smiling graduate in a green cap and gown", focus: "50% 20%", headline: ["Learn.", "Earn.", "Rise."] }, // 30419739
  { src: "/onboarding/farmer.jpg", alt: "A smiling farmer in a woven cap in his field", focus: "50% 30%", headline: ["Plant.", "Tend.", "Reap."] }, // 33993456
  { src: "/onboarding/real-estate.jpg", alt: "A young couple carrying boxes into their new home", focus: "50% 30%", dim: true, headline: ["Fund.", "Homes.", "Profit."] }, // 4971255
];
const PHOTO_MS = 5000;

/**
 * The dark shade over the photos. Shared with the splash's slide-up sheet
 * (SplashRedirect), which shows the first photo with this shade so the
 * welcome screen is already "there" when the sheet arrives.
 */
export const WELCOME_SHADE =
  "bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.3)_14%,rgba(0,0,0,0.35)_45%,rgba(0,0,0,0.55)_75%,rgba(0,0,0,0.65)_100%)]";

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [photo, setPhoto] = useState(0);
  // The stacked photos, to check whether the next one has fully downloaded.
  const photosRef = useRef<HTMLDivElement>(null);

  // Next photo every few seconds (not with reduced motion), but only once it
  // has fully downloaded: a large photo on a slow connection would otherwise
  // fade in half-drawn (black at the bottom). Still downloading: the current
  // photo stays until the next tick. Failed to download: it is skipped.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Asks the <img> itself: reliable even for photos that finished before
    // the page became interactive.
    const status = (index: number): "ready" | "loading" | "failed" => {
      const image = photosRef.current?.children[index]?.querySelector("img");
      if (!image || !image.complete) return "loading";
      return image.naturalWidth > 0 ? "ready" : "failed";
    };
    const timer = window.setInterval(() => {
      setPhoto((index) => {
        for (let step = 1; step < PHOTOS.length; step++) {
          const next = (index + step) % PHOTOS.length;
          const state = status(next);
          if (state === "ready") return next;
          if (state === "loading") return index; // wait for it
        }
        return index; // nothing else can be shown
      });
    }, PHOTO_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-neutral-950 text-white">
      <h1 className="sr-only">Welcome to Feenicks1</h1>

      {/* All photos stacked; only the current one is visible, fading in slowly
          while it drifts a little closer. */}
      <div ref={photosRef} aria-hidden className="absolute inset-0 -z-20">
        {PHOTOS.map((item, index) => (
          <div
            key={item.src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none ${
              index === photo ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0"
              style={"zoom" in item ? { transform: `scale(${item.zoom})`, transformOrigin: `${item.focus.split(" ")[0]} 100%` } : undefined}
            >
              <Image
                src={item.src}
                alt=""
                fill
                priority={index === 0}
                // Every slide downloads straight away (not when it's due), so
                // each is ready long before its turn; the first comes first.
                loading="eager"
                fetchPriority={index === 0 ? "high" : "low"}
                // On a tall phone a full-screen photo is drawn about as wide
                // as the screen is tall, so ask for that width (not 100vw),
                // at high quality: otherwise it is stretched and looks blurry.
                sizes="(min-width: 1024px) 50vw, 100vh"
                quality={90}
                className={`object-cover transition-transform ease-out motion-reduce:transition-none ${
                  index === photo ? "scale-105 duration-[7000ms]" : "scale-100 duration-0"
                }`}
                style={{ objectPosition: item.focus, filter: "dim" in item ? "brightness(0.7)" : undefined }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">{PHOTOS[0].alt}</p>
      {/* A slight dark overlay, as in Bamboo's welcome (no colour tint): the
          photo keeps its own colours, a little darker at the top (logo) and
          bottom (headline and buttons). */}
      <span
        aria-hidden
        className={`absolute inset-0 -z-10 ${WELCOME_SHADE}`}
      />

      <header className="flex justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <LogoWordmark tone="gold" className="h-6" />
      </header>

      <div className="mx-auto mt-auto flex w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-lg">
        {/* Every slide's text in the same grid cell: only the current one shows. */}
        <div className="grid animate-fade-up motion-reduce:animate-none">
          {PHOTOS.map((item, index) => (
            <div
              key={item.src}
              aria-hidden={index !== photo}
              className={`col-start-1 row-start-1 transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${
                index === photo ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <p className="font-display text-[min(5.5rem,25vw)] leading-[0.92] font-semibold tracking-[-0.03em] text-gold-500">
                {item.headline.map((word, wordIndex) => (
                  <span key={wordIndex} className="block">
                    {word}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-[3fr_2fr] gap-3">
          <Link
            href={ROUTES.signUp}
            onClick={completeOnboarding}
            className="flex h-13 items-center justify-center rounded-2xl bg-gold-500 px-4 text-base font-semibold text-brand-900 transition-colors hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            Create account
          </Link>
          <Link
            href={ROUTES.login}
            onClick={completeOnboarding}
            className="flex h-13 items-center justify-center rounded-2xl bg-brand-700 px-4 text-base font-semibold text-gold-300 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            Log in
          </Link>
        </div>

        <Link
          href={`${ROUTES.legal}/fees`}
          className="group mx-auto mt-6 flex items-center gap-3 text-[0.9375rem] font-semibold text-white underline decoration-white/50 underline-offset-4"
        >
          Our portfolios and fees
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-white text-brand-800 transition-transform group-hover:translate-x-0.5">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </span>
        </Link>

      </div>
    </main>
  );
}
