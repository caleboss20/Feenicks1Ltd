import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Feenicks1 brand assets.
 *
 * The logo files live in `public/brand/` as transparent PNGs in two tones:
 *   - "light": white, for green or photo backgrounds (splash, onboarding)
 *   - "brand": brand green, for white / light backgrounds (forms, desktop panels)
 *
 * Intrinsic sizes are declared below so Next.js reserves the right space
 * before the image loads (no layout shift). Size the logo with a height
 * class (e.g. `h-24`); the width follows automatically, keeping the aspect
 * ratio.
 *
 * If a designer supplies an SVG later, swap the `src` values here and every
 * screen updates.
 */

type Tone = "light" | "brand";

const MARK_SIZE = { width: 387, height: 393 } as const;
const WORDMARK_SIZE = { width: 680, height: 121 } as const;

const MARK_SRC: Record<Tone, string> = {
  light: "/brand/logo-mark.png",
  brand: "/brand/logo-mark-green.png",
};
const WORDMARK_SRC: Record<Tone, string> = {
  light: "/brand/logo-wordmark.png",
  brand: "/brand/logo-wordmark-green.png",
};

type LogoProps = {
  className?: string;
  /** Colour version to use. Pick the one that contrasts with the background. */
  tone?: Tone;
  /**
   * Load immediately instead of lazily. Use on above-the-fold screens
   * (e.g. the splash) where the logo is the first thing painted.
   */
  preload?: boolean;
  /**
   * Hide from screen readers when the brand name is already announced
   * elsewhere (e.g. an <h1>), to avoid reading "Feenicks1" twice.
   */
  decorative?: boolean;
};

/** The "F1" symbol on its own (app icons, headers, loaders). */
export function LogoMark({ className, tone = "light", preload, decorative }: LogoProps) {
  return (
    <Image
      src={MARK_SRC[tone]}
      {...MARK_SIZE}
      alt={decorative ? "" : `${siteConfig.name} logo`}
      preload={preload}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}

/** The "Feenicks1" wordmark text. */
export function LogoWordmark({ className, tone = "light", preload, decorative }: LogoProps) {
  return (
    <Image
      src={WORDMARK_SRC[tone]}
      {...WORDMARK_SIZE}
      alt={decorative ? "" : siteConfig.name}
      preload={preload}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
