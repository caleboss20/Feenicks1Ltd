/**
 * The portfolio guide as rows: who you are on the left, the portfolios
 * built for you on the right. Laid out after the CEO's guide ("Which
 * F1 CAPITAL portfolio fits your goals?"), set in the app's own type.
 *
 *   ┌──────────┐ ┌──────────────────────────────────────┐
 *   │ 02       │ │ IC  InvestWise Capital                │
 *   │ INVESTOR │ │ GH₵ 500 – 4,999.99 · 28-day cycle     │
 *   │ Scale    │ │ Broader market exposure for growing…  │
 *   │ with …   │ ├──────────────────────────────────────┤
 *   └──────────┘ │ ABC Agribusiness Capital …            │
 *                └──────────────────────────────────────┘
 *
 * SegmentPicker: the rows are radio options (the profile question).
 * SegmentRow: one row on its own (the result screen).
 */

import Image from "next/image";
import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import { formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  cycleLabel,
  INVESTOR_SEGMENTS,
  PORTFOLIO_SUMMARIES,
  type InvestorSegment,
  type InvestorSegmentInfo,
} from "./investorSegments";

/** The left tile's colours per profile (the guide's yellow, navy and red). */
const TILE_TONES: Record<InvestorSegmentInfo["tone"], { tile: string; number: string; tagline: string; ticker: string }> = {
  yellow: {
    tile: "bg-amber-300 text-neutral-900",
    number: "bg-neutral-900 text-white",
    tagline: "text-neutral-800",
    ticker: "bg-amber-300 text-neutral-900",
  },
  navy: {
    tile: "bg-[#13213c] text-white",
    number: "bg-white text-[#13213c]",
    tagline: "text-white/80",
    ticker: "bg-[#13213c] text-white dark:bg-white/15",
  },
  red: {
    tile: "bg-[#e0503a] text-white",
    number: "bg-white text-[#c23a25]",
    tagline: "text-white/85",
    ticker: "bg-[#e0503a] text-white",
  },
};

/** The profile question: one tappable row per profile. */
export function SegmentPicker({
  selected,
  onSelect,
  className,
}: {
  selected: InvestorSegment | undefined;
  onSelect: (segment: InvestorSegment) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Which best describes you?</legend>
      <div className="flex flex-col gap-2">
        {INVESTOR_SEGMENTS.map((segment) => (
          <label
            key={segment.id}
            className="block cursor-pointer rounded-[1.125rem] outline-2 outline-offset-2 outline-transparent transition-colors has-checked:outline-brand-600 has-focus-visible:outline-brand-400"
          >
            <input
              type="radio"
              name="investor-segment"
              value={segment.id}
              aria-label={`${segment.name}: ${segment.tagline}`}
              checked={selected === segment.id}
              onChange={() => onSelect(segment.id)}
              className="sr-only"
            />
            <SegmentRow segment={segment} compact />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * One profile: its tile, then its portfolios with their range and cycle.
 * `compact` (the picker): tighter, without the one-line summaries, so all
 * three profiles and the button fit one phone screen.
 */
export function SegmentRow({
  segment,
  compact = false,
  className,
}: {
  segment: InvestorSegmentInfo;
  compact?: boolean;
  className?: string;
}) {
  const tone = TILE_TONES[segment.tone];
  return (
    <div className={cn("flex gap-2", className)}>
      {/* Solid tile: words on top, the person filling the rest edge to edge (as in the guide). */}
      <div className={cn("flex w-[6.25rem] shrink-0 flex-col overflow-hidden rounded-2xl", tone.tile)}>
        <div className={compact ? "px-2.5 pt-2.5 pb-2" : "px-3 pt-3 pb-2.5"}>
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums", tone.number)}>
            {segment.number}
          </span>
          <span className={cn("block leading-tight font-bold tracking-wide uppercase", compact ? "mt-1.5 text-xs" : "mt-2 text-[0.8125rem]")}>
            {segment.name}
          </span>
          <span className={cn("mt-1 block text-[0.6875rem] leading-snug", tone.tagline)}>{segment.tagline}</span>
        </div>
        <div className={cn("relative flex-1", compact ? "min-h-11" : "min-h-[4.5rem]")}>
          <Image
            src={segment.photo.src}
            alt={segment.photo.alt}
            fill
            sizes="96px"
            className="object-cover"
            style={{ objectPosition: segment.photo.focus }}
          />
        </div>
      </div>

      <ul className="min-w-0 flex-1 divide-y divide-neutral-200/80 rounded-2xl border border-neutral-200/80 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {segment.packageIds.map((id) => (
          <PortfolioLine key={id} id={id} tickerClass={tone.ticker} compact={compact} />
        ))}
      </ul>
    </div>
  );
}

function PortfolioLine({ id, tickerClass, compact }: { id: PackageId; tickerClass: string; compact: boolean }) {
  const pkg = INVESTMENT_PACKAGES[id];
  return (
    <li className="px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className={cn("mt-px shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide", tickerClass)}>
          {pkg.ticker}
        </span>
        <span className={cn("min-w-0 leading-snug font-semibold text-foreground", compact ? "text-[0.8125rem]" : "text-sm")}>
          {pkg.name}
        </span>
      </div>
      {!compact && (
        <p className="mt-1 text-xs leading-snug text-neutral-500 dark:text-neutral-400">{PORTFOLIO_SUMMARIES[id]}</p>
      )}
      {/* Range and cycle on one line, so all three profiles fit one phone screen. */}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.6875rem] font-medium">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-800 tabular-nums dark:bg-white/10 dark:text-neutral-200">
          {formatCedis(pkg.minimum)} – {formatCedisNumber(pkg.maximum)}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">{cycleLabel(pkg, compact)}</span>
      </p>
    </li>
  );
}
