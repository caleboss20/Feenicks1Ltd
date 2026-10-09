"use client";

/**
 * PortfolioChart: the portfolio's value over time, as a smooth line with a
 * light fill (one series, brand green), after the user's stock-app references.
 *
 *   GH₵ 3,240.00 · 1 Oct         ← tooltip: drag/hover across the chart
 *        ╭──────╮                   (a hairline marks the point; arrow keys too)
 *   ───╮╭╯      ╰──╮       ●  3.5K   ← value ticks on the right (clean numbers)
 *      ╰╯          ╰───────╯  3K
 *   3 Sept      17 Sept      Today   ← dates below
 *
 * Two variants:
 *   - full (Analytics, above): value ticks, gridlines and dates; the reading
 *     shows the value at the point
 *   - compact (the dashboard's performance card, after the user's coin-chart
 *     reference): just the line and a richer fill, hugging the data so small
 *     moves show; a dashed drop line and a bubble mark "now" (or the point
 *     being read) with the CHANGE since the range began
 *
 *                 ( + GH₵ 541.07 )
 *          ╭───────────────────●
 *   ───────╯ ░░░░░░░░░░░░░░░░░░┊░░
 *
 * Long ranges can be wider than the screen (`widthFactor`, chartWidthFactor):
 * the chart then scrolls sideways, opening at the right end (now). Swipe to
 * go back in time; tap to read a moment. Dates run along the bottom so you
 * know where you are; Analytics' value ticks stay pinned on the right.
 *
 * Plotted in a fixed 1000×300 box stretched to the container (lines keep a
 * 2px stroke); dots, tooltip and labels are HTML on top, placed in %.
 * Accessible: a summary label, arrow-key scrubbing with a live readout, and a
 * hidden table of every point (the chart's table view).
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SeriesPoint } from "./portfolioHistory";

const WIDTH = 1000;
const HEIGHT = 300;

/** About three clean steps covering [min, max], e.g. 0 / 2,000 / 4,000. */
function niceTicks(min: number, max: number): number[] {
  let low = min;
  let high = max;
  if (high === low) {
    if (high === 0) high = 100;
    else {
      low = high * 0.9;
      high = high * 1.1;
    }
  }
  const rough = (high - low) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let value = Math.floor(low / step) * step; value <= Math.ceil(high / step) * step + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

/**
 * The compact chart's vertical range: the data's own low and high, with a
 * little room around them, so a GH₵ 50 move on GH₵ 3,000 is still visible.
 * A flat line sits in the middle.
 */
function paddedRange(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = max > min ? (max - min) * 0.1 : Math.max(Math.abs(max) * 0.1, 1);
  return [min - pad, max + pad];
}

/** Axis label: "0", "750", "3.2K", "12K". */
function compactValue(value: number): string {
  if (Math.abs(value) < 1000) return String(Math.round(value));
  const thousands = value / 1000;
  return `${Math.abs(thousands) < 10 ? thousands.toFixed(1).replace(/\.0$/, "") : Math.round(thousands)}K`;
}

/**
 * A smooth line through the points that never overshoots them (monotone
 * cubic, Fritsch–Carlson): flat stretches stay flat, rises and drops stay honest.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0].x},${points[0].y}`;

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const sum = a * a + b * b;
    if (sum > 9) {
      const tau = 3 / Math.sqrt(sum);
      tangents[i] = tau * a * slopes[i];
      tangents[i + 1] = tau * b * slopes[i];
    }
  }

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const third = (points[i + 1].x - points[i].x) / 3;
    path += ` C${points[i].x + third},${points[i].y + third * tangents[i]} ${points[i + 1].x - third},${points[i + 1].y - third * tangents[i + 1]} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return path;
}

type PortfolioChartProps = {
  points: SeriesPoint[];
  /** Read by screen readers, e.g. "Portfolio value, past month, from GH₵ 0 to GH₵ 3,240". */
  label: string;
  /** Time in the tooltip, e.g. "1 Oct, 2:00 pm". */
  formatTime: (time: number) => string;
  /** Time under the chart, e.g. "1 Oct" (full variant only). */
  formatAxisTime?: (time: number) => string;
  /** Shown over a flat chart when there's no history yet. */
  emptyMessage?: React.ReactNode;
  /** "full" (Analytics, the default) or "compact" (dashboard). See above. */
  variant?: "full" | "compact";
  /** Hide amounts in the reading and the table (the dashboard's eye toggle). */
  hideAmounts?: boolean;
  /**
   * Compact: take the line and bubble colours from CSS variables set by the
   * parent (--chart-line, --chart-line-dark, --chart-bubble,
   * --chart-bubble-dark): the dashboard's chosen colour. Otherwise brand green.
   */
  themed?: boolean;
  /**
   * How many screens wide the chart is (1 = fits). Above 1 it scrolls
   * sideways, starting at the right end. See chartWidthFactor.
   */
  widthFactor?: number;
};

export function PortfolioChart({
  points,
  label,
  formatTime,
  formatAxisTime,
  emptyMessage,
  variant = "full",
  hideAmounts = false,
  themed = false,
  widthFactor = 1,
}: PortfolioChartProps) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isCompact = variant === "compact";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isScrollable = widthFactor > 1 && !emptyMessage;

  // A wide chart opens at its right end: now. (Parents remount the chart per
  // range, so this runs for each range.)
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && isScrollable) scroller.scrollLeft = scroller.scrollWidth;
  }, [isScrollable]);

  // …and stays at "now" when the screen changes size (e.g. the phone turns),
  // unless the user has swiped back in time: then their place is kept.
  const isAtEndRef = useRef(true);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !isScrollable) return;
    const onScroll = () => {
      isAtEndRef.current = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
    };
    const observer = new ResizeObserver(() => {
      if (isAtEndRef.current) scroller.scrollLeft = scroller.scrollWidth;
    });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [isScrollable]);

  const values = points.map((point) => point.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  // Full: between clean ticks. Compact: hugging the data.
  const [low, high] = isCompact ? paddedRange(values) : [ticks[0], ticks[ticks.length - 1]];

  // Compact: the line stops just short of the right edge, leaving room for
  // the "now" dot and its drop line.
  const right = isCompact ? WIDTH * 0.96 : WIDTH;
  const x = (index: number) => (points.length > 1 ? (index / (points.length - 1)) * right : right / 2);
  const y = (value: number) => HEIGHT - ((value - low) / (high - low)) * HEIGHT;
  const plotted = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const line = smoothPath(plotted);
  const area = `${line} L${plotted[plotted.length - 1].x},${HEIGHT} L${plotted[0].x},${HEIGHT} Z`;

  const isEmpty = Boolean(emptyMessage);
  const active = activeIndex === null || isEmpty ? null : points[activeIndex];
  const lastIndex = points.length - 1;
  const percentX = (index: number) => (plotted[index].x / WIDTH) * 100;
  const percentY = (index: number) => (plotted[index].y / HEIGHT) * 100;
  /** Compact: the marked point, "now" until someone reads another one. */
  const markedIndex = isCompact && !isEmpty ? (activeIndex ?? lastIndex) : null;
  /** Compact: how much the value changed from the start of the range to `index`. */
  const changeTo = (index: number) => Math.round((points[index].value - points[0].value) * 100) / 100;
  const amount = (value: number) => (hideAmounts ? "••••" : formatCedis(value, { exact: true }));
  /** Keep a reading on screen near the edges. */
  const edgeAlign = (index: number) =>
    percentX(index) < 18 ? "translate-x-0" : percentX(index) > 82 ? "-translate-x-full" : "-translate-x-1/2";

  /** The point nearest the pointer's position across the chart. */
  const indexAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    return Math.round(ratio * lastIndex);
  };

  /** Read a point from the keyboard, scrolling a wide chart to keep it in view. */
  const readAt = (index: number) => {
    setActiveIndex(index);
    const scroller = scrollerRef.current;
    if (!scroller || !isScrollable) return;
    const at = (percentX(index) / 100) * scroller.scrollWidth;
    if (at < scroller.scrollLeft + 32 || at > scroller.scrollLeft + scroller.clientWidth - 32) {
      scroller.scrollLeft = at - scroller.clientWidth / 2;
    }
  };

  /**
   * Dates along the bottom: start, middle and now when it fits; on a wide
   * chart, about three per screen, so you know where you are while swiping.
   * (Compact shows them only when wide, and skips the two ends, which would
   * sit on the screen's edges.)
   */
  const dateCount = isScrollable ? Math.round(widthFactor * 3) + 1 : 3;
  const dateIndexes = Array.from({ length: dateCount }, (_, k) => Math.round((k * lastIndex) / (dateCount - 1))).filter(
    (_, k) => !isCompact || (k > 0 && k < dateCount - 1),
  );
  const showDates = Boolean(formatAxisTime) && (isCompact ? isScrollable : true);

  return (
    <div className="relative">
      {/* Sideways scroller (a wide chart only); no visible scrollbar. */}
      <div
        ref={scrollerRef}
        className={cn(
          isScrollable &&
            "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <div
          // Room above the plot for the reading over a high point (it can't
          // spill out of a scroller): the compact bubble, the full tooltip.
          className={cn(isCompact ? "pt-11" : "pt-12")}
          style={isScrollable ? { width: `${widthFactor * 100}%` } : undefined}
        >
        {/* Plot */}
        <div
          role="group"
          aria-roledescription="chart"
          aria-label={label}
          tabIndex={isEmpty ? -1 : 0}
          onFocus={() => setActiveIndex((current) => current ?? lastIndex)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={(event) => {
            if (isEmpty) return;
            const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
            if (event.key in moves) {
              event.preventDefault();
              readAt(Math.min(Math.max((activeIndex ?? lastIndex) + moves[event.key], 0), lastIndex));
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              readAt(event.key === "Home" ? 0 : lastIndex);
            } else if (event.key === "Escape") {
              setActiveIndex(null);
            }
          }}
          className={cn(
            "relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
            themed ? "text-(--chart-line) dark:text-(--chart-line-dark)" : "text-brand-700 dark:text-brand-400",
            isCompact ? "h-40" : "h-56",
          )}
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                {/* Compact: a richer wash, like the reference. */}
                <stop offset="0%" stopColor="currentColor" stopOpacity={isEmpty ? 0 : isCompact ? 0.3 : 0.2} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Recessive solid hairlines at the value ticks (full only). */}
            {!isCompact &&
              ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={WIDTH}
                  y1={y(tick)}
                  y2={y(tick)}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-neutral-100 dark:stroke-white/10"
                  strokeWidth={1}
                />
              ))}
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={cn(isEmpty && "text-neutral-300 dark:text-white/20")}
            />
            {/* Full: a hairline across the whole height at the point being read. */}
            {!isCompact && active && activeIndex !== null && (
              <line
                x1={plotted[activeIndex].x}
                x2={plotted[activeIndex].x}
                y1={0}
                y2={HEIGHT}
                vectorEffect="non-scaling-stroke"
                className="stroke-neutral-300 dark:stroke-white/25"
                strokeWidth={1}
              />
            )}
            {/* Compact: a dashed line dropping from the marked point. */}
            {markedIndex !== null && (
              <line
                x1={plotted[markedIndex].x}
                x2={plotted[markedIndex].x}
                y1={plotted[markedIndex].y}
                y2={HEIGHT}
                vectorEffect="non-scaling-stroke"
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="3 4"
              />
            )}
          </svg>

          {/* Compact: the marked point, and a bubble with the change since the
              range began (and, while reading a past point, when it was). */}
          {markedIndex !== null && (
            <>
              <span
                aria-hidden
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-[3px] ring-background"
                style={{ left: `${percentX(markedIndex)}%`, top: `${percentY(markedIndex)}%` }}
              />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute z-10 -translate-y-[calc(100%+0.75rem)] rounded-xl px-2.5 py-1.5 text-center whitespace-nowrap text-white",
                  themed ? "bg-(--chart-bubble) dark:bg-(--chart-bubble-dark)" : "bg-brand-800 dark:bg-brand-600",
                  edgeAlign(markedIndex),
                )}
                style={{ left: `${percentX(markedIndex)}%`, top: `${percentY(markedIndex)}%` }}
              >
                <p className="text-[0.6875rem] font-semibold tabular-nums">
                  {changeTo(markedIndex) === 0
                    ? "No change"
                    : `${changeTo(markedIndex) > 0 ? "+ " : "− "}${amount(Math.abs(changeTo(markedIndex)))}`}
                </p>
                {activeIndex !== null && (
                  <p className="text-[0.625rem] text-white/75">{formatTime(points[markedIndex].time)}</p>
                )}
              </div>
            </>
          )}

          {/* Full: end dot (now), with a ring in the page colour. */}
          {!isCompact && !isEmpty && !active && (
            <span
              aria-hidden
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-background"
              style={{ left: `${percentX(lastIndex)}%`, top: `${percentY(lastIndex)}%` }}
            />
          )}

          {/* Full: the point being read, and its value. */}
          {!isCompact && active && activeIndex !== null && (
            <>
              <span
                aria-hidden
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-background"
                style={{ left: `${percentX(activeIndex)}%`, top: `${percentY(activeIndex)}%` }}
              />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-lg bg-neutral-900 px-2.5 py-1.5 whitespace-nowrap text-white dark:bg-white dark:text-neutral-900",
                  edgeAlign(activeIndex),
                )}
                style={{ left: `${percentX(activeIndex)}%` }}
              >
                <p className="text-sm font-semibold">{formatCedis(active.value, { exact: true })}</p>
                <p className="text-[0.6875rem] text-white/70 dark:text-neutral-400">{formatTime(active.time)}</p>
              </div>
            </>
          )}

          {/* Pointer layer. Fits on screen: drag sideways to read along the line
              (vertical swipes still scroll the page). Wide: swipes scroll the
              chart, and a tap reads the moment under the finger. */}
          {!isEmpty && (
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 cursor-crosshair",
                isScrollable ? "touch-manipulation" : "touch-pan-y",
              )}
              onPointerDown={(event) => setActiveIndex(indexAt(event))}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse" || event.buttons > 0) setActiveIndex(indexAt(event));
              }}
              onPointerLeave={(event) => {
                // Mouse: hide on leaving. Touch: keep the last reading on screen.
                if (event.pointerType === "mouse") setActiveIndex(null);
              }}
              // The browser took the touch over to scroll the page: that wasn't
              // a reading, so don't leave one behind.
              onPointerCancel={() => setActiveIndex(null)}
            />
          )}

          {isEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-foreground">
              {emptyMessage}
            </div>
          )}
        </div>

        {/* Dates along the bottom (they scroll with a wide chart). */}
        {showDates && formatAxisTime && (
          <div aria-hidden className="relative mt-2.5 h-4 text-[0.6875rem] text-neutral-500 dark:text-neutral-400">
            {dateIndexes.map((index, k) => (
              <span
                key={index}
                className={cn(
                  "absolute top-0 whitespace-nowrap",
                  // The ends line up with the chart's edges; the rest are centred.
                  !isCompact && k === 0
                    ? "translate-x-0"
                    : !isCompact && k === dateIndexes.length - 1
                      ? "-translate-x-full"
                      : "-translate-x-1/2",
                )}
                style={{ left: `${percentX(index)}%` }}
              >
                {formatAxisTime(points[index].time)}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Value ticks (clean numbers), full only: pinned at the right over the
          plot (they stay put while a wide chart scrolls), sitting on their
          gridlines, so the line spans the full width. pt-12 = the plot's top. */}
      {!isCompact && !isEmpty && (
        <div aria-hidden className="pointer-events-none absolute top-12 right-0 h-56">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-full rounded bg-background/85 px-1 pb-0.5 text-[0.625rem] leading-none text-neutral-500 tabular-nums"
              style={{ top: `${(y(tick) / HEIGHT) * 100}%` }}
            >
              {compactValue(tick)}
            </span>
          ))}
        </div>
      )}

      {/* Live readout for keyboard scrubbing. */}
      <p aria-live="polite" className="sr-only">
        {active ? `${hideAmounts ? "Amount hidden" : formatCedis(active.value, { exact: true })}, ${formatTime(active.time)}` : ""}
      </p>

      {/* The chart as a table, for screen readers (not while amounts are
          hidden). Wrapped in a hidden block: `sr-only` on the <table> itself
          doesn't clip (tables grow to fit their rows), which would stretch the
          page and push the tab bar away. */}
      <div className={cn("sr-only", hideAmounts && "hidden")}>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Portfolio value</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.time}>
                <td>{formatTime(point.time)}</td>
                <td>{formatCedis(point.value, { exact: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
