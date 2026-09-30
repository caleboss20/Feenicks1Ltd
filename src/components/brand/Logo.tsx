import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Feenicks1 brand assets.
 *
 * The logo files live in `public/brand/` as white-on-transparent PNGs, made
 * for coloured backgrounds (the brand green). Intrinsic sizes are declared
 * below so Next.js reserves the right space before the image loads (no
 * layout shift). Size the logo with a height class (e.g. `h-24`); the width
 * follows automatically, keeping the aspect ratio.
 *
 * If a designer supplies an SVG later, swap the `src` here and every screen
 * updates.
 */

const MARK = { src: "/brand/logo-mark.png", width: 387, height: 393 } as const;
const WORDMARK = { src: "/brand/logo-wordmark.png", width: 680, height: 121 } as const;

type LogoProps = {
  className?: string;
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
export function LogoMark({ className, preload, decorative }: LogoProps) {
  return (
    <Image
      {...MARK}
      alt={decorative ? "" : `${siteConfig.name} logo`}
      preload={preload}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}

/** The "Feenicks1" wordmark text. */
export function LogoWordmark({ className, preload, decorative }: LogoProps) {
  return (
    <Image
      {...WORDMARK}
      alt={decorative ? "" : siteConfig.name}
      preload={preload}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
