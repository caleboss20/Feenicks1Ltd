"use client";

/**
 * Welcome: the first screen after the splash. After the CEO's review of the
 * Bamboo app (October 2026): one screen, one feeling, two clear choices.
 *
 *   ┌───────────────────────────┐
 *   │        Feenicks1 (gold)    │
 *   │                           │
 *   │   full-bleed video (or    │  ← shaded into forest green at the
 *   │   cross-fading photos)    │    bottom (no shadows), so text reads
 *   │                           │
 *   │   Plan.                   │  ← gold, Inter Tight, very large
 *   │   Invest.                 │
 *   │   Grow.                   │
 *   │  (Create account)( Log in )│  ← gold / dark green
 *   │   Our portfolios and fees ›│
 *   └───────────────────────────┘
 *
 * Background: a short muted video on a loop, like Bamboo's welcome
 * (public/onboarding/welcome.mp4, free Pexels licence, video 8275083). The
 * first photo shows until the video can play. With reduced motion or the
 * browser's data saver on, there is no video: the photos change on their own
 * every few seconds with a slow cross-fade instead (reduced motion: the first
 * photo only). No carousel, no dots, nothing to swipe.
 * Both actions mark onboarding as seen (useAppStore), as before.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { useAppStore } from "@/stores/useAppStore";

/**
 * The photos, in order.
 * TODO(launch): grow-wealth.jpg is a Rawpixel preview with a small watermark in
 * its bottom-left corner (hidden here under the forest shading). Buy the
 * licensed file from Rawpixel and replace it before launch.
 */
const PHOTOS = [
  { src: "/onboarding/track-portfolio.jpg", alt: "A young woman smiling at her phone as she checks her investments", focus: "50% 20%" },
  { src: "/onboarding/invest.jpg", alt: "A smiling woman checking her investments on her phone", focus: "60% 30%" },
  { src: "/onboarding/peace-of-mind.jpg", alt: "A relaxed woman on a sofa, smiling at her phone", focus: "50% 30%" },
  { src: "/onboarding/grow-wealth.jpg", alt: "A smiling man in a blazer looking at his phone", focus: "35% 30%" },
];
const PHOTO_MS = 5000;
const VIDEO_SRC = "/onboarding/welcome.mp4";

/** No video for reduced motion or data saver; the photos are used instead. */
function videoAllowed() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !connection?.saveData;
}

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [photo, setPhoto] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start the video when allowed (it fetches nothing until then); otherwise
  // the next photo every few seconds (not with reduced motion).
  useEffect(() => {
    if (videoAllowed()) {
      videoRef.current?.play().catch(() => {});
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setPhoto((index) => (index + 1) % PHOTOS.length), PHOTO_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand-800 text-white">
      <h1 className="sr-only">Welcome to Feenicks1</h1>

      {/* All photos stacked; only the current one is visible, fading in slowly
          while it drifts a little closer. */}
      <div aria-hidden className="absolute inset-0 -z-20">
        {PHOTOS.map((item, index) => (
          <Image
            key={item.src}
            src={item.src}
            alt=""
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={`object-cover transition-[opacity,transform] ease-out motion-reduce:transition-none ${
              index === photo ? "scale-105 opacity-100 duration-[1400ms,7000ms]" : "scale-100 opacity-0 duration-[1400ms,0ms]"
            }`}
            style={{ objectPosition: item.focus }}
          />
        ))}
        {/* Hidden until it is actually playing; if it fails, the first photo stays. */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setVideoReady(true)}
          className={`absolute inset-0 size-full object-cover object-[50%_30%] transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <p className="sr-only">{PHOTOS[0].alt}</p>
      {/* Forest-green shading: light at the top (for the logo), solid at the
          bottom (for the headline and buttons). */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(14,59,44,0.55)_0%,rgba(14,59,44,0)_22%,rgba(14,59,44,0.15)_42%,rgba(14,59,44,0.85)_62%,#0e3b2c_78%)]"
      />

      <header className="flex justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <LogoWordmark tone="gold" className="h-8" />
      </header>

      <div className="mx-auto mt-auto flex w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-lg">
        <p className="animate-fade-up font-display text-[4.25rem] leading-[0.92] font-semibold tracking-[-0.03em] text-gold-500 motion-reduce:animate-none sm:text-[5rem]">
          Plan.
          <br />
          Invest.
          <br />
          Grow.
        </p>

        <div className="mt-9 grid grid-cols-2 gap-3">
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
