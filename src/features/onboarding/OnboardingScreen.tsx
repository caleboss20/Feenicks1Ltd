"use client";

/**
 * Welcome: the first screen after the splash. After the CEO's review of the
 * Bamboo app (October 2026): one screen, one feeling, two clear choices.
 *
 *   ┌───────────────────────────┐
 *   │        Feenicks1 (gold)    │
 *   │                           │
 *   │   full-bleed photo        │  ← shaded into forest green at the
 *   │   slideshow (cross-fade)  │    bottom (no shadows), so text reads
 *   │                           │
 *   │   Back                    │  ← gold, Inter Tight, very large;
 *   │   Ghana's                 │    changes with each photo
 *   │   farmers.                │
 *   │  (Create account)( Log in )│  ← gold / dark green
 *   │   Our portfolios and fees ›│
 *   └───────────────────────────┘
 *
 * Background: a slideshow of the people Feenicks1 is for (CEO, October
 * 2026): students, individuals, farmers, market women, home buyers and
 * business partners. Each photo fades in slowly with a gentle zoom every few
 * seconds: no carousel, no dots, nothing to swipe. Reduced motion: the first
 * photo only. Photos: Pexels (free licence), 1600px; each is cropped (focus)
 * so faces sit in the top half, clear of the shading and the headline.
 * Each photo has its own headline, which fades with the photo. All headlines
 * share one grid cell, so the buttons never move. The last slide ends on the
 * partners: "Grow wealth together."
 * Both actions mark onboarding as seen (useAppStore), as before.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { useAppStore } from "@/stores/useAppStore";

/**
 * The slides, in order (Pexels photo IDs in comments). No word is used on
 * more than one slide, and each headline says what its photo shows: investing
 * from a phone, a trader's profits, a student, farming, property, partners. `height` (optional): a near-square photo fills only
 * the top of the screen, so a tall phone crop keeps everyone in the picture. Headline lines stay
 * short (9 characters at most) so they fit a 320px-wide phone at full size.
 */
const PHOTOS = [
  { src: "/onboarding/individual.jpg", alt: "A young woman in orange smiling at her phone", focus: "50% 25%", headline: ["Invest", "from your", "phone."] }, // 19863396
  { src: "/onboarding/market-trader.jpg", alt: "A market trader laughing at her fruit stall", focus: "50% 25%", headline: ["Put", "profits", "to work."] }, // 40045554
  { src: "/onboarding/student-window.jpg", alt: "A smiling young student by a bright window", focus: "25% 45%", headline: ["Start", "while", "studying."] }, // 8197501
  { src: "/onboarding/farmer.jpg", alt: "A smiling farmer in a woven cap in his field", focus: "50% 30%", headline: ["Back", "Ghana's", "farmers."] }, // 33993456
  { src: "/onboarding/real-estate.jpg", alt: "A young couple carrying boxes into their new home", focus: "50% 30%", headline: ["Own a", "share in", "property."] }, // 4971255
  // TODO(launch): partners.webp is a Rawpixel preview with a watermark in its
  // bottom-left corner (hidden under the forest shading). Buy the licensed
  // file from Rawpixel and replace it before launch.
  { src: "/onboarding/partners.webp", alt: "A businesswoman shaking hands with a client as her smiling colleague looks on", focus: "30% 20%", height: "60%", headline: ["Grow", "wealth", "together."] },
];
const PHOTO_MS = 5000;

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [photo, setPhoto] = useState(0);

  // Next photo every few seconds (not with reduced motion).
  useEffect(() => {
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
          <div
            key={item.src}
            className="absolute inset-x-0 top-0"
            style={{
              height: "height" in item ? item.height : "100%",
              // A shorter photo fades out at its bottom edge into the green.
              maskImage: "height" in item ? "linear-gradient(to bottom, black 65%, transparent)" : undefined,
            }}
          >
            <Image
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
          </div>
        ))}
      </div>
      <p className="sr-only">{PHOTOS[0].alt}</p>
      {/* Forest-green shading: light at the top (for the logo), solid at the
          bottom (for the headline and buttons). */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(14,59,44,0.8)_0%,rgba(14,59,44,0.35)_9%,rgba(14,59,44,0)_22%,rgba(14,59,44,0.15)_42%,rgba(14,59,44,0.85)_62%,#0e3b2c_78%)]"
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
              <p className="font-display text-[4.25rem] leading-[0.92] font-semibold tracking-[-0.03em] text-gold-500 sm:text-[5rem]">
                {item.headline.map((word, wordIndex) => (
                  <span key={wordIndex} className="block">
                    {word}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

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
