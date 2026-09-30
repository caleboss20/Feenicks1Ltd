"use client";

/**
 * Onboarding: story-style intro carousel shown to first-time visitors.
 *
 * Phones and tablets (< lg): full-screen, story style
 *   ┌──────────────────────┐
 *   │ ▬▬▬ ▬▬▬ ▬▬▬          │  ← story progress bars (active one fills in green)
 *   │ F1                   │  ← logo
 *   │    full-bleed photo  │  ← tap / swipe / hold (see useOnboardingSlideshow)
 *   │ EYEBROW              │
 *   │ Big bold headline    │  ← on a dark fade for legibility
 *   │ ( Create account → ) │
 *   │ Already have...Log in│
 *   └──────────────────────┘
 *
 * Desktop (≥ lg): two columns, locked to one screen height
 *   ┌─────────────────────┬──────────────────────┐
 *   │ ┌─────────────────┐ │ F1 Feenicks1         │
 *   │ │                 │ │                      │
 *   │ │ photo carousel  │ │ EYEBROW              │
 *   │ │ (rounded card)  │ │ Big bold headline    │
 *   │ │                 │ │ ( Create account → ) │
 *   │ │ ▬▬▬ ▬▬▬ ▬▬▬     │ │ Already have...      │
 *   │ └─────────────────┘ │ © Feenicks1          │
 *   └─────────────────────┴──────────────────────┘
 *     bars along the bottom of the photo
 *
 * One component and one set of elements for both layouts: responsive
 * classes (`lg:*`) move the pieces around, so there's no duplicated markup.
 *
 * Behaviour is in `useOnboardingSlideshow`; content is in `slides.ts`.
 * Both actions mark onboarding as complete (persisted in the Zustand store),
 * so returning users skip straight from the splash to login.
 */

import Image from "next/image";
import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/brand/Logo";
import { ArrowRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { ONBOARDING_SLIDES, SLIDE_DURATION_MS } from "./onboardingSlides";
import { useOnboardingSlideshow } from "./useOnboardingSlideshow";

export function OnboardingScreen() {
  const slides = ONBOARDING_SLIDES;
  const { index, isPaused, next, goTo, gestureHandlers } = useOnboardingSlideshow(slides.length);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const slide = slides[index];

  return (
    <main
      aria-roledescription="carousel"
      aria-label="Feenicks1 highlights"
      // Desktop is locked to exactly one screen height (lg:h-dvh), so nothing
      // is ever pushed below the fold; sizes below scale with viewport height.
      className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-black text-white lg:grid lg:h-dvh lg:grid-cols-2 lg:bg-background lg:text-foreground"
      // Feeds the progress-bar animation duration (see --animate-progress).
      style={{ "--slide-duration": `${SLIDE_DURATION_MS}ms` } as React.CSSProperties}
    >
      <h1 className="sr-only">Welcome to Feenicks1</h1>

      {/* ══════════ Media ══════════════════════════════════════════════════
          Phones/tablets: fills the screen behind the content, progress bars
          overlaid at the top.
          Desktop: left column. Photo as a rounded card with the progress
          bars along the BOTTOM of the photo (on its dark fade). */}
      <div className="absolute inset-0 -z-10 lg:relative lg:inset-auto lg:z-0 lg:m-5 lg:overflow-hidden lg:rounded-[2rem]">
        {/* Tap / swipe / hold surface. touch-pan-y keeps vertical scrolling
            native while we handle horizontal swipes ourselves. */}
        <div className="absolute inset-0 touch-pan-y select-none" {...gestureHandlers}>
          {slides.map((s, i) => {
            const isActive = i === index;
            return (
              // All photos stay mounted and cross-fade via opacity, so
              // switching slides never flashes or waits on a download.
              <div
                key={s.id}
                aria-hidden={!isActive}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-out",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  // First photo is the page's largest paint → load it immediately.
                  // The rest load eagerly too, so they're ready before their turn.
                  {...(i === 0 ? { preload: true } : { loading: "eager" as const })}
                  draggable={false}
                  className={cn(
                    "object-cover",
                    isActive && "animate-ken-burns motion-reduce:animate-none",
                  )}
                  style={{ objectPosition: s.focus }}
                />
              </div>
            );
          })}

          {/* Neutral dark fades (no colour tint) so the bars and white text
              stay readable on any photo. On desktop the text sits on the
              white panel and the bars at the bottom of the photo, so only a
              lighter bottom fade is needed. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/55 to-transparent lg:hidden"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-black/95 via-black/60 to-transparent lg:h-1/3 lg:from-black/55 lg:via-black/15"
          />
        </div>

        {/* ── Progress bars + logo: top of the photo on mobile, bottom of the photo on desktop ── */}
        <div className="absolute inset-x-0 top-0 px-6 pt-[max(1rem,env(safe-area-inset-top))] sm:px-10 lg:top-auto lg:bottom-0 lg:p-8">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                aria-current={i === index ? "step" : undefined}
                // Tall invisible hit area (py-2) around a thin visible bar.
                className="flex-1 cursor-pointer py-2"
              >
                <span className="relative block h-1 overflow-hidden rounded-full bg-white/60">
                  <span
                    // Changing the key restarts the fill animation for each new slide.
                    key={i === index ? `active-${index}` : s.id}
                    className={cn(
                      "absolute inset-0 origin-left rounded-full bg-brand-600",
                      i < index && "scale-x-100", // already seen → full
                      i > index && "scale-x-0", // upcoming → empty
                      i === index && "animate-progress motion-reduce:animate-none",
                    )}
                    style={
                      i === index
                        ? { animationPlayState: isPaused ? "paused" : "running" }
                        : undefined
                    }
                    // The fill finishing IS the timer: advance to the next slide.
                    onAnimationEnd={i === index ? next : undefined}
                  />
                </span>
              </button>
            ))}
          </div>

          {/* White mark on the photo; hidden on desktop, where the green
              logo sits on the white panel instead. */}
          <LogoMark className="pointer-events-none mt-4 h-9 drop-shadow-md lg:hidden" />
        </div>
      </div>

      {/* ══════════ Content ════════════════════════════════════════════════
          Phones/tablets: overlaid at the bottom of the photo. Taps on the
          text pass through to the photo (pointer-events-none), so tapping
          anywhere still changes slides; the actions re-enable clicks.
          Desktop: right column on white, content vertically centred. */}
      <div className="pointer-events-none mt-auto px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-10 lg:pointer-events-auto lg:mt-0 lg:flex lg:min-h-0 lg:flex-col lg:px-16 lg:py-8 xl:px-24">
        {/* Desktop-only brand lockup (green, on white). */}
        <div className="hidden items-center gap-3 lg:flex">
          <LogoMark tone="brand" decorative className="h-10" />
          <LogoWordmark tone="brand" className="h-6" />
        </div>

        <div className="w-full max-w-xl lg:my-auto">
          {/* Re-keyed per slide so the text animates in each time. */}
          <div key={slide.id} className="animate-soft-rise motion-reduce:animate-none">
            <p className="text-base font-semibold tracking-wide uppercase lg:text-brand-600">
              {slide.eyebrow}
            </p>
            <h2 className="mt-3 text-[2.25rem] leading-[1.2] font-bold text-balance sm:text-5xl lg:mt-4 lg:text-[clamp(2.25rem,6.5vh,3.5rem)] lg:leading-[1.1]">
              {slide.title}
            </h2>
          </div>

          {/* Actions stay the same on every slide. */}
          <div className="pointer-events-auto mt-12 flex flex-col gap-5 sm:max-w-md lg:mt-[clamp(1.5rem,5vh,3rem)]">
            <ButtonLink href={ROUTES.signUp} onClick={completeOnboarding} size="lg" fullWidth>
              Create a new account
              <ArrowRight />
            </ButtonLink>

            <p className="text-center text-[1.0625rem] text-white/90 lg:text-left lg:text-foreground/70">
              Already have an account?{" "}
              <Link
                href={ROUTES.login}
                onClick={completeOnboarding}
                className="font-bold text-white underline underline-offset-4 hover:text-brand-300 lg:text-brand-700 lg:hover:text-brand-600 lg:dark:text-brand-400"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Desktop-only footer: standard for regulated investment products. */}
        <p className="hidden text-sm text-foreground/50 lg:block">
          © {new Date().getFullYear()} {siteConfig.name} · The value of investments can go up
          as well as down.
        </p>
      </div>
    </main>
  );
}
