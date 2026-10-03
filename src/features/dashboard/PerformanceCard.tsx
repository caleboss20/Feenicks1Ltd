"use client";

/**
 * PerformanceCard: how the portfolio has moved, on the dashboard, once the
 * user has invested (it takes the place of the offers carousel). After the
 * user's coin-chart reference: the change for the range at the top right, a
 * smooth green line over a soft green wash, a bubble marking "now" with the
 * change since the range began (drag along the line to read any moment), and
 * pill-shaped range chips.
 *
 * Not a boxed card: no border, corners or background of its own. It sits on
 * the dashboard's green-to-white gradient, the chart running edge to edge, so
 * its green wash blends into the page (the user's call: a card looked too
 * obvious).
 *
 *     Performance                  (▲ 8.0%)      ← green up / red down
 *     Past month
 *                          ( + GH₵ 541.07 )      ← bubble: change since the start
 *                   ╭──────────────────●
 *           ╭───────╯                  ┊
 *   ────────╯ ░░░░░░░░░░░░░░░░░░░░░░░░░┊░░░      ← edge to edge
 *     ( 1D )( 1W )(●1M )( 1Y )( All )
 *                See full analytics →            ← the Analytics tab
 *
 * Same numbers as the Analytics tab (portfolioHistory.ts): from the
 * transaction history only, nothing estimated. Respects the dashboard's
 * "hide amounts" eye (the percentage stays, the cedi amounts don't).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, TriangleUpIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { axisTime, tooltipTime } from "@/features/analytics/chartTime";
import { PortfolioChart } from "@/features/analytics/PortfolioChart";
import {
  buildSeries,
  chartWidthFactor,
  FIXED_RANGES,
  yearsRange,
  type ChartRange,
} from "@/features/analytics/portfolioHistory";
import type { Transaction } from "@/features/transactions/transactionModel";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { DashboardColor } from "./dashboardTheme";

/** The ranges on the card: short ones, a year, and everything. (Analytics has 1–25 years.) */
const RANGES: ChartRange[] = [
  FIXED_RANGES["1D"],
  FIXED_RANGES["1W"],
  FIXED_RANGES["1M"],
  yearsRange(1),
  FIXED_RANGES.ALL,
];

export function PerformanceCard({
  transactions,
  hideAmounts,
  color,
}: {
  transactions: Transaction[];
  hideAmounts: boolean;
  /** The dashboard colour they chose: the line, bubble and selected range follow it. */
  color: DashboardColor;
}) {
  const [rangeId, setRangeId] = useState("1M");
  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[2];
  const points = useMemo(() => buildSeries(transactions, range), [transactions, range]);

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = Math.round((last - first) * 100) / 100;
  // No percentage from zero (e.g. "All", which starts before the first investment).
  const percent = first > 0 ? (change / first) * 100 : null;

  return (
    // Open, on the page's gradient: the text lines up with the content above
    // (the parent's 16px gutter + 4px); the chart bleeds to the screen edges.
    // The chart's colours follow the dashboard colour (CSS variables read by
    // PortfolioChart's `themed`); in dark mode, lighter tints so even Navy or
    // Black stay visible on the dark page.
    <section
      aria-labelledby="performance-title"
      style={
        {
          "--chart-line": color.main,
          "--chart-line-dark": `color-mix(in srgb, ${color.main} 55%, white)`,
          "--chart-bubble": color.top,
          "--chart-bubble-dark": `color-mix(in srgb, ${color.main} 75%, white)`,
        } as React.CSSProperties
      }
    >
      {/* On the dashboard colour (carried this far for investors): white,
          like the balance above. */}
      <div className="flex items-start justify-between gap-3 px-1 text-white">
        <div className="min-w-0">
          <h2 id="performance-title" className="text-base font-semibold tracking-tight">
            Performance
          </h2>
          <p className="mt-0.5 text-[0.6875rem] text-white/80">{range.period}</p>
        </div>
        <ChangePill change={change} percent={percent} hideAmounts={hideAmounts} />
      </div>

      <div className="-mx-4">
        <PortfolioChart
          // A fresh chart per range, so a reading from another range doesn't linger.
          key={range.id}
          variant="compact"
          themed
          points={points}
          hideAmounts={hideAmounts}
          label={
            hideAmounts
              ? `Portfolio value, ${range.period.toLowerCase()}.`
              : `Portfolio value, ${range.period.toLowerCase()}: from ${formatCedis(first, { exact: true })} to ${formatCedis(last, { exact: true })}.`
          }
          formatTime={tooltipTime(range)}
          formatAxisTime={axisTime(range)}
          // 1M and longer: wider than the screen, swipe to go back in time.
          widthFactor={chartWidthFactor(range, points)}
        />
      </div>

      {/* Range chips, spread across the full width, like the reference. */}
      <div role="group" aria-label="Time range" className="mt-5 grid grid-cols-5 gap-1.5 px-1">
        {RANGES.map((item) => {
          const isActive = item.id === rangeId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRangeId(item.id)}
              className={cn(
                "h-8 cursor-pointer rounded-full text-[0.6875rem] font-semibold transition-colors",
                isActive
                  ? "bg-(--chart-bubble) text-white dark:bg-(--chart-bubble-dark)"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-400 dark:hover:bg-white/15",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* A quiet text link (no box), so nothing frames the chart. */}
      <Link
        href={ROUTES.analytics}
        className="group mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-(--chart-line) transition-opacity hover:opacity-80 dark:text-(--chart-line-dark)"
      >
        See full analytics
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}

/** The range's change at a glance: "▲ 8.0%" (green), "▼ 2.1%" (red), or "No change". */
function ChangePill({
  change,
  percent,
  hideAmounts,
}: {
  change: number;
  percent: number | null;
  hideAmounts: boolean;
}) {
  if (change === 0) {
    return (
      <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
        No change
      </span>
    );
  }
  const isUp = change > 0;
  // A percentage when there's a starting value; otherwise the amount.
  const text =
    percent !== null ? `${Math.abs(percent).toFixed(1)}%` : hideAmounts ? "••••" : formatCedis(Math.abs(change), { exact: true });

  return (
    <span
      className={cn(
        // A white pill on the green (both themes), like the stock-ticker chips.
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.6875rem] font-semibold tabular-nums",
        isUp ? "text-brand-700" : "text-red-600",
      )}
    >
      <TriangleUpIcon aria-hidden className={cn("size-2.5", !isUp && "rotate-180")} />
      <span className="sr-only">{isUp ? "Up" : "Down"}</span>
      {text}
    </span>
  );
}
