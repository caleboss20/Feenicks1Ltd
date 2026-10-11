import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Feenicks1 brand assets.
 *
 * The logo files live in `public/brand/` as transparent PNGs in two tones:
 *   - "light": white, for green or photo backgrounds (splash, onboarding)
 *   - "brand": brand green, for white / light backgrounds (forms, desktop panels)
 *   - "gold": gold on forest green (splash, welcome): the white file used as a
 *     mask and filled with gold-500, so there is no third set of files
 *
 * Intrinsic sizes are declared below so Next.js reserves the right space
 * before the image loads (no layout shift). Size the logo with a height
 * class (e.g. `h-24`); the width follows automatically, keeping the aspect
 * ratio.
 *
 * If a designer supplies an SVG later, swap the `src` values here and every
 * screen updates.
 */

type Tone = "light" | "brand" | "gold";

const MARK_SIZE = { width: 387, height: 393 } as const;
const WORDMARK_SIZE = { width: 680, height: 121 } as const;

const MARK_SRC: Record<Tone, string> = {
  light: "/brand/logo-mark.png",
  brand: "/brand/logo-mark-green.png",
  gold: "/brand/logo-mark.png",
};
const WORDMARK_SRC: Record<Tone, string> = {
  light: "/brand/logo-wordmark.png",
  brand: "/brand/logo-wordmark-green.png",
  gold: "/brand/logo-wordmark.png",
};

/** The logo as a gold shape: the PNG is the mask, gold-500 the paint. */
function GoldLogo({
  src,
  size,
  label,
  className,
}: {
  src: string;
  size: { width: number; height: number };
  label: string | null;
  className?: string;
}) {
  const mask = `url(${src}) center / contain no-repeat`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block bg-gold-500 select-none", className)}
      style={{ aspectRatio: `${size.width} / ${size.height}`, mask, WebkitMask: mask }}
    />
  );
}

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
  if (tone === "gold") {
    return <GoldLogo src={MARK_SRC.gold} size={MARK_SIZE} label={decorative ? null : `${siteConfig.name} logo`} className={className} />;
  }
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
  if (tone === "gold") {
    return <GoldLogo src={WORDMARK_SRC.gold} size={WORDMARK_SIZE} label={decorative ? null : siteConfig.name} className={className} />;
  }
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
