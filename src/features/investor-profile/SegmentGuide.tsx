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
      <div className="flex flex-col gap-3">
        {INVESTOR_SEGMENTS.map((segment) => (
          <label
            key={segment.id}
            className="block cursor-pointer rounded-[1.375rem] p-1 outline-2 -outline-offset-2 outline-transparent transition-colors has-checked:outline-brand-600 has-focus-visible:outline-brand-400"
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
            <SegmentRow segment={segment} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** One profile: its tile, then its portfolios with their range and cycle. */
export function SegmentRow({ segment, className }: { segment: InvestorSegmentInfo; className?: string }) {
  const tone = TILE_TONES[segment.tone];
  return (
    <div className={cn("flex gap-2", className)}>
      <div className={cn("flex w-[5.75rem] shrink-0 flex-col rounded-2xl p-3", tone.tile)}>
        <span className={cn("self-start rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums", tone.number)}>
          {segment.number}
        </span>
        <span className="mt-2.5 text-[0.8125rem] leading-tight font-bold tracking-wide uppercase">{segment.name}</span>
        <span className={cn("mt-1 mb-3 text-xs leading-snug", tone.tagline)}>{segment.tagline}</span>
        {/* The person, at the foot of the tile (as in the guide). */}
        <Image
          src={segment.photo.src}
          alt={segment.photo.alt}
          width={600}
          height={600}
          sizes="80px"
          className="mt-auto aspect-square w-full rounded-xl object-cover"
        />
      </div>

      <ul className="min-w-0 flex-1 divide-y divide-neutral-200/80 rounded-2xl border border-neutral-200/80 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {segment.packageIds.map((id) => (
          <PortfolioLine key={id} id={id} tickerClass={tone.ticker} />
        ))}
      </ul>
    </div>
  );
}

function PortfolioLine({ id, tickerClass }: { id: PackageId; tickerClass: string }) {
  const pkg = INVESTMENT_PACKAGES[id];
  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-2">
        <span className={cn("mt-px shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide", tickerClass)}>
          {pkg.ticker}
        </span>
        <span className="min-w-0 text-sm leading-snug font-semibold text-foreground">{pkg.name}</span>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-neutral-500 dark:text-neutral-400">{PORTFOLIO_SUMMARIES[id]}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[0.6875rem] font-medium">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-800 tabular-nums dark:bg-white/10 dark:text-neutral-200">
          {formatCedis(pkg.minimum)} – {formatCedisNumber(pkg.maximum)}
        </span>
        <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-neutral-600 dark:border-white/15 dark:text-neutral-300">
          {cycleLabel(pkg)}
        </span>
      </div>
    </li>
  );
}
