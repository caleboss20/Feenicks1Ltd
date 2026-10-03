"use client";

/**
 * Analytics tab: how the user's portfolio is doing, after the user's
 * stock-app references (value + change, range chips, a moving line).
 *
 *   Analytics
 *   Portfolio value
 *   GH₵ 3,240.00
 *   ▲ GH₵ 340.00 (+11.7%) · Past month        ← green up / red down
 *   ( 1D )( 1W )(●1M )( 1Y )( All )            ← time range (scopes everything below)
 *   ╭╮  ╭─────╮        ╭──●                    ← PortfolioChart: drag to read any point
 *   ╯╰──╯     ╰────────╯
 *   Past month
 *   [ Invested      ] [ Profit earned   ]
 *   [ Withdrawn     ] [ Referral rewards ]
 *
 * Real, not estimated: everything comes from the transaction history
 * (portfolioHistory.ts). Investments, returns and rewards push the line up;
 * withdrawals pull it down. No history yet → a flat line and a way to start.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon, TriangleUpIcon } from "@/components/icons";
import { AppTabScreenLayout } from "@/components/layout/AppTabScreenLayout";
import { ROUTES } from "@/config/routes";
import { PreviewSampleButton, SampleDataNotice } from "@/features/transactions/SampleData";
import { useTransactions } from "@/features/transactions/useTransactions";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PortfolioChart } from "./PortfolioChart";
import { buildSeries, RANGES, summarize, type RangeId } from "./portfolioHistory";

/** Tooltip time for each range: "2:00 pm" · "1 Oct, 2:00 pm" · "1 Oct 2026". */
function tooltipTime(rangeId: RangeId) {
  return (time: number) => {
    const date = new Date(time);
    const clock = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
    if (rangeId === "1D") return clock;
    const day = date.toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      ...(rangeId === "1Y" || rangeId === "ALL" ? { year: "numeric" } : {}),
    });
    return rangeId === "1W" || rangeId === "1M" ? `${day}, ${clock}` : day;
  };
}

/** Date under the chart: "2 pm" · "1 Oct" · "Oct 2026". */
function axisTime(rangeId: RangeId) {
  return (time: number) => {
    const date = new Date(time);
    if (rangeId === "1D") return date.toLocaleTimeString("en-GH", { hour: "numeric" });
    if (rangeId === "1W" || rangeId === "1M") {
      return date.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
    }
    return date.toLocaleDateString("en-GH", { month: "short", year: "numeric" });
  };
}

export function AnalyticsScreen() {
  const transactions = useTransactions();
  const [rangeId, setRangeId] = useState<RangeId>("1M");
  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[2];

  const points = useMemo(
    () => (transactions ? buildSeries(transactions, rangeId) : null),
    [transactions, rangeId],
  );

  const hasHistory = Boolean(transactions?.some((transaction) => transaction.status === "completed"));
  const first = points?.[0].value ?? 0;
  const last = points?.[points.length - 1].value ?? 0;
  const change = Math.round((last - first) * 100) / 100;
  const percent = first > 0 ? (change / first) * 100 : null;
  const totals =
    transactions && points ? summarize(transactions, points[0].time, points[points.length - 1].time) : null;

  const [whole, fraction] = formatCedisNumber(last, { exact: true }).split(".");

  return (
    <AppTabScreenLayout title="Analytics">
      <SampleDataNotice transactions={transactions} />

      {/* Value and change for the range */}
      <section aria-label="Portfolio value">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Portfolio value</p>
        <p className="mt-1.5 flex items-baseline gap-1.5 leading-none font-bold">
          <span className="text-xl text-neutral-500 dark:text-neutral-400">{CEDI_SYMBOL}</span>
          <span className="text-[2.5rem] tracking-tight">
            {whole}
            <span className="text-2xl text-neutral-400">.{fraction}</span>
          </span>
        </p>
        {transactions && (
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            {change === 0 ? (
              <span className="font-medium text-neutral-500 dark:text-neutral-400">No change</span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  change > 0 ? "text-brand-700 dark:text-brand-400" : "text-red-600 dark:text-red-400",
                )}
              >
                <TriangleUpIcon className={cn("size-3", change < 0 && "rotate-180")} />
                <span className="sr-only">{change > 0 ? "Up" : "Down"}</span>
                {formatCedis(Math.abs(change), { exact: true })}
                {percent !== null && ` (${change > 0 ? "+" : "−"}${Math.abs(percent).toFixed(1)}%)`}
              </span>
            )}
            <span className="text-neutral-400">· {range.period}</span>
          </p>
        )}
      </section>

      {/* Time range, spread evenly across the full width: scopes the chart and the totals below. */}
      <div role="group" aria-label="Time range" className="-mb-2 grid grid-cols-5 gap-1.5">
        {RANGES.map((item) => {
          const isActive = item.id === rangeId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRangeId(item.id)}
              className={cn(
                "h-9 w-full cursor-pointer rounded-full text-[0.8125rem] font-semibold transition-colors",
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {points ? (
        <PortfolioChart
          key={rangeId}
          points={points}
          label={`Portfolio value, ${range.period.toLowerCase()}: from ${formatCedis(first, { exact: true })} to ${formatCedis(last, { exact: true })}.`}
          formatTime={tooltipTime(rangeId)}
          formatAxisTime={axisTime(rangeId)}
          emptyMessage={
            hasHistory ? undefined : (
              <>
                <p className="text-sm font-semibold">Your growth will show here</p>
                <p className="mt-1 max-w-56 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Invest, and watch your portfolio move with every return.
                </p>
                <Link
                  href={ROUTES.invest}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 [&_svg]:size-4"
                >
                  <PlusIcon />
                  Start investing
                </Link>
                {/* Demo only: see the chart as an investor with a year of activity. */}
                <PreviewSampleButton />
              </>
            )
          }
        />
      ) : (
        <div aria-hidden className="h-52 animate-pulse rounded-2xl bg-neutral-100 motion-reduce:animate-none dark:bg-white/5" />
      )}

      {/* What happened in the range */}
      {totals && (
        <section aria-labelledby="period-title">
          <h2 id="period-title" className="text-base font-semibold">
            {range.period}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: "Invested", value: totals.invested },
              { label: "Profit earned", value: totals.profit },
              { label: "Withdrawn", value: totals.withdrawn },
              { label: "Referral rewards", value: totals.rewards },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
                <dt className="text-xs text-neutral-500 dark:text-neutral-400">{item.label}</dt>
                <dd className="mt-1.5 text-base font-semibold tracking-tight">
                  {formatCedis(item.value, { exact: true })}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </AppTabScreenLayout>
  );
}
