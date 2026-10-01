import { cn } from "@/lib/utils";

/**
 * CountryFlag: a small round flag for any country, by ISO code (e.g. "GH").
 *
 * Uses the SVG flags in `public/flags/` (from the MIT-licensed
 * `country-flag-icons` package, copied by `npm run flags:copy`).
 * We serve them ourselves: no third-party requests, and each flag file
 * loads only when it's shown.
 *
 * Images rather than emoji, because Windows doesn't display flag emoji
 * (🇬🇭 shows up as the letters "GH").
 */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  return (
    // A plain <img> (not next/image): tiny SVGs gain nothing from image optimisation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden
      width={28}
      height={28}
      loading="lazy"
      // Cropped into a circle from the centre. The thin outline keeps light
      // flags (e.g. Japan's white) from vanishing on a white background.
      className={cn(
        "size-7 shrink-0 rounded-full object-cover outline outline-black/10 -outline-offset-1",
        className,
      )}
    />
  );
}
