import { LogoWordmark } from "@/components/brand/Logo";
import { PhoenixMark } from "@/components/brand/PhoenixMark";
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
 *   0.00s  the phoenix rises: body like a flame, the head sparks, the wings
 *          unfold feather by feather, then a gold glow and a small lift
 *          (PhoenixMark, "Splash: the phoenix rising")
 *   1.60s  wordmark rises in from a soft blur                   (soft-rise)
 *   2.00s  loader fades in                                      (fade-up)
 *   then   the phoenix keeps moving (wings beat, glow breathes, it floats)
 *   5.85s  the next screen slides up over the splash like a sheet
 *          (SplashRedirect); it opens at 6.5s
 * Every animation is disabled for users with "reduce motion" turned on.
 */

export function SplashScreen() {
  return (
    // Solid forest green with the logo in gold (CEO, October 2026; no gradient).
    <main className="flex min-h-dvh flex-col items-center overflow-hidden bg-brand-800 px-6 text-white">
      {/* ── Brand: symbol + wordmark ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 sm:gap-5">
        {/* The phoenix (new mark, October 2026), larger than the old F1 symbol
            so the animation reads. Decorative: the <h1> below names the app. */}
        <PhoenixMark animated label={null} className="size-32 sm:size-36 lg:size-40" />

        {/* The <h1> is the page's main heading for SEO; its text comes from
            the image alt ("Feenicks1"). */}
        <h1 className="animate-soft-rise [animation-delay:1.6s] motion-reduce:animate-none">
          <LogoWordmark tone="gold" className="h-6 sm:h-7 lg:h-8" />
        </h1>
      </div>

      {/* ── Loader: sits above the iPhone home indicator via safe-area inset ── */}
      <div className="animate-fade-up pb-[max(3.5rem,env(safe-area-inset-bottom))] [animation-delay:2s] motion-reduce:animate-none">
        <SplashLoader />
      </div>

      {/* Full description for search engines and screen readers only */}
      <p className="sr-only">{siteConfig.description}</p>

      <SplashRedirect />
    </main>
  );
}
