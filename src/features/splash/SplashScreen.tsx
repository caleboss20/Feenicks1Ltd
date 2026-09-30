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
 *   │       ⟳          │  ← loader, pinned to the bottom (safe-area aware)
 *   └──────────────────┘
 */
export function SplashScreen() {
  return (
    // Solid brand green background (no gradient), per the brand direction.
    <main className="flex min-h-dvh flex-col items-center overflow-hidden bg-brand-600 px-6 text-white">
      {/* ── Brand: symbol + wordmark ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 sm:gap-5">
        {/* Symbol pops in first. Sized deliberately modest (64 to 80px) so it
            reads as calm and premium rather than overpowering. */}
        <LogoMark
          preload
          decorative
          className="h-16 animate-logo-pop motion-reduce:animate-none sm:h-[4.5rem] lg:h-20"
        />

        {/* ...then the wordmark fades up. The <h1> is the page's main heading
            for SEO; its text comes from the image alt ("Feenicks1"). */}
        <h1 className="animate-fade-up [animation-delay:250ms] motion-reduce:animate-none">
          <LogoWordmark preload className="h-6 sm:h-7 lg:h-8" />
        </h1>
      </div>

      {/* ── Loader: sits above the iPhone home indicator via safe-area inset ── */}
      <div className="animate-fade-up pb-[max(3rem,env(safe-area-inset-bottom))] [animation-delay:500ms] motion-reduce:animate-none">
        <SplashLoader />
      </div>

      {/* Full description for search engines and screen readers only */}
      <p className="sr-only">{siteConfig.description}</p>

      <SplashRedirect />
    </main>
  );
}
