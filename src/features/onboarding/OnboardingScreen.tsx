"use client";

/**
 * Welcome: the first screen after the splash. After the CEO's review of the
 * Bamboo app (October 2026): one screen, one feeling, two clear choices.
 *
 *   ┌───────────────────────────┐
 *   │        Feenicks1 (gold)    │
 *   │                           │
 *   │   full-bleed photo of an  │  ← shaded into forest green at the
 *   │   investor on her phone   │    bottom (no shadows), so text reads
 *   │                           │
 *   │   Plan.                   │  ← gold, Inter Tight, very large
 *   │   Invest.                 │
 *   │   Grow.                   │
 *   │  (Create account)( Log in )│  ← gold / dark green
 *   │   Our portfolios and fees ›│
 *   │   Investments can go down… │
 *   └───────────────────────────┘
 *
 * Both actions mark onboarding as seen (useAppStore), as before.
 */

import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { useAppStore } from "@/stores/useAppStore";

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand-800 text-white">
      <h1 className="sr-only">Welcome to Feenicks1</h1>

      <Image
        src="/onboarding/track-portfolio.jpg"
        alt="A young woman smiling at her phone as she checks her investments"
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="-z-20 object-cover object-[50%_20%]"
      />
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

        <p className="mt-6 text-center text-xs text-white/75">Investments can go down as well as up.</p>
      </div>
    </main>
  );
}
