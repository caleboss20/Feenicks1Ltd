import { LogoMark, LogoWordmark } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";
import { SplashLoader } from "./SplashLoader";
import { SplashRedirect } from "./SplashRedirect";

/**
 * Splash screen: the first thing users see when opening Feenicks1.
 *
 * Server Component, so the HTML (including the <h1> and description) is
 * rendered on the server and readable by search engines, even though users
 * only see it for a moment before being redirected.
 *
 * Layout (a full-height flex column, so it adapts to any screen size or
 * orientation without overlapping):
 *   ┌──────────────────┐
 *   │                  │
 *   │     [ F1 ]       │  ← symbol + wordmark, vertically centred (flex-1)
 *   │    Feenicks1     │
 *   │                  │
 *   │      ━━━─        │  ← loader, pinned to the bottom (safe-area aware)
 *   └──────────────────┘
 *
 * Animation timeline (all CSS, defined in globals.css):
 *   0.00s  symbol wipes in diagonally, following the F1 swoosh (logo-reveal)
 *   0.70s  wordmark rises in from a soft blur                   (soft-rise)
 *   1.00s  light sheen sweeps across the symbol once            (logo-sheen)
 *   1.20s  loader fades in                                      (fade-up)
 * Every animation is disabled for users with "reduce motion" turned on.
 */

/** Same file as <LogoMark>, used as a mask so the sheen only lights the logo's shape. */
const SHEEN_MASK = {
  maskImage: "url(/brand/logo-mark.png)",
  WebkitMaskImage: "url(/brand/logo-mark.png)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
} as const;

export function SplashScreen() {
  return (
    // Solid forest green with the logo in gold (CEO, October 2026; no gradient).
    <main className="flex min-h-dvh flex-col items-center overflow-hidden bg-brand-800 px-6 text-white">
      {/* ── Brand: symbol + wordmark ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 sm:gap-5">
        {/* Symbol + sheen overlay share one wrapper, so the reveal applies to both. */}
        <div className="relative animate-logo-reveal motion-reduce:animate-none">
          {/* Sized deliberately modest (64 to 80px): calm and premium, not overpowering. */}
          <LogoMark tone="gold" decorative className="h-16 sm:h-[4.5rem] lg:h-20" />

          {/* Sheen: a mint light band, clipped to the logo's shape by the
              mask, slides across once after the reveal. */}
          <span
            aria-hidden
            className="absolute inset-0 animate-logo-sheen bg-[linear-gradient(115deg,transparent_35%,var(--color-gold-100)_50%,transparent_65%)] bg-size-[250%_100%] [animation-delay:1s] motion-reduce:hidden"
            style={SHEEN_MASK}
          />
        </div>

        {/* The <h1> is the page's main heading for SEO; its text comes from
            the image alt ("Feenicks1"). */}
        <h1 className="animate-soft-rise [animation-delay:700ms] motion-reduce:animate-none">
          <LogoWordmark tone="gold" className="h-6 sm:h-7 lg:h-8" />
        </h1>
      </div>

      {/* ── Loader: sits above the iPhone home indicator via safe-area inset ── */}
      <div className="animate-fade-up pb-[max(3.5rem,env(safe-area-inset-bottom))] [animation-delay:1.2s] motion-reduce:animate-none">
        <SplashLoader />
      </div>

      {/* Full description for search engines and screen readers only */}
      <p className="sr-only">{siteConfig.description}</p>

      <SplashRedirect />
    </main>
  );
}
