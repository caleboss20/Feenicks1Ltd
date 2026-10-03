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
 * Plotted in a fixed 1000×300 box stretched to the container (lines keep a
 * 2px stroke); dots, tooltip and labels are HTML on top, placed in %.
 * Accessible: a summary label, arrow-key scrubbing with a live readout, and a
 * hidden table of every point (the chart's table view).
 */

import { useId, useState } from "react";
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
  /** Time under the chart, e.g. "1 Oct". */
  formatAxisTime: (time: number) => string;
  /** Shown over a flat chart when there's no history yet. */
  emptyMessage?: React.ReactNode;
};

export function PortfolioChart({ points, label, formatTime, formatAxisTime, emptyMessage }: PortfolioChartProps) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const values = points.map((point) => point.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const low = ticks[0];
  const high = ticks[ticks.length - 1];

  const x = (index: number) => (points.length > 1 ? (index / (points.length - 1)) * WIDTH : WIDTH / 2);
  const y = (value: number) => HEIGHT - ((value - low) / (high - low)) * HEIGHT;
  const plotted = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const line = smoothPath(plotted);
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const isEmpty = Boolean(emptyMessage);
  const active = activeIndex === null || isEmpty ? null : points[activeIndex];
  const lastIndex = points.length - 1;
  const percentX = (index: number) => (plotted[index].x / WIDTH) * 100;
  const percentY = (index: number) => (plotted[index].y / HEIGHT) * 100;

  /** The point nearest the pointer's position across the chart. */
  const indexAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    return Math.round(ratio * lastIndex);
  };

  return (
    <div>
      <div className="flex">
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
              setActiveIndex((current) =>
                Math.min(Math.max((current ?? lastIndex) + moves[event.key], 0), lastIndex),
              );
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              setActiveIndex(event.key === "Home" ? 0 : lastIndex);
            } else if (event.key === "Escape") {
              setActiveIndex(null);
            }
          }}
          className="relative h-52 flex-1 rounded-lg text-brand-600 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 dark:text-brand-400"
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={isEmpty ? 0 : 0.2} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Recessive solid hairlines at the value ticks. */}
            {ticks.map((tick) => (
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
            {/* Crosshair: a hairline at the point being read. */}
            {active && activeIndex !== null && (
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
          </svg>

          {/* End dot (now), with a ring in the page colour. */}
          {!isEmpty && !active && (
            <span
              aria-hidden
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-background"
              style={{ left: `${percentX(lastIndex)}%`, top: `${percentY(lastIndex)}%` }}
            />
          )}

          {/* The point being read, and its value. */}
          {active && activeIndex !== null && (
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
                  // Keep it on screen near the edges.
                  percentX(activeIndex) < 18
                    ? "translate-x-0"
                    : percentX(activeIndex) > 82
                      ? "-translate-x-full"
                      : "-translate-x-1/2",
                )}
                style={{ left: `${percentX(activeIndex)}%` }}
              >
                <p className="text-sm font-semibold">{formatCedis(active.value, { exact: true })}</p>
                <p className="text-[0.6875rem] text-white/70 dark:text-neutral-500">{formatTime(active.time)}</p>
              </div>
            </>
          )}

          {/* Pointer layer: scrub sideways (vertical swipes still scroll the page). */}
          {!isEmpty && (
            <div
              aria-hidden
              className="absolute inset-0 cursor-crosshair touch-pan-y"
              onPointerDown={(event) => setActiveIndex(indexAt(event))}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse" || event.buttons > 0) setActiveIndex(indexAt(event));
              }}
              onPointerLeave={(event) => {
                // Mouse: hide on leaving. Touch: keep the last reading on screen.
                if (event.pointerType === "mouse") setActiveIndex(null);
              }}
            />
          )}

          {isEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-foreground">
              {emptyMessage}
            </div>
          )}
        </div>

        {/* Value ticks (clean numbers), right of the plot; none on an empty chart. */}
        <div aria-hidden className="relative w-11 shrink-0">
          {!isEmpty && ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[0.6875rem] text-neutral-400 tabular-nums"
              style={{ top: `${(y(tick) / HEIGHT) * 100}%` }}
            >
              {compactValue(tick)}
            </span>
          ))}
        </div>
      </div>

      {/* Dates: start, middle, now. */}
      <div aria-hidden className="mt-2 flex justify-between pr-11 text-[0.6875rem] text-neutral-400">
        <span>{formatAxisTime(points[0].time)}</span>
        <span>{formatAxisTime(points[Math.floor(lastIndex / 2)].time)}</span>
        <span>{formatAxisTime(points[lastIndex].time)}</span>
      </div>

      {/* Live readout for keyboard scrubbing. */}
      <p aria-live="polite" className="sr-only">
        {active ? `${formatCedis(active.value, { exact: true })}, ${formatTime(active.time)}` : ""}
      </p>

      {/* The chart as a table, for screen readers. Wrapped in a hidden block:
          `sr-only` on the <table> itself doesn't clip (tables grow to fit their
          rows), which would stretch the page and push the tab bar away. */}
      <div className="sr-only">
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
