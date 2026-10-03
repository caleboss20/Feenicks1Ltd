"use client";

/**
 * Analytics tab: how the user's portfolio is doing, after the user's
 * stock-app references (value + change, range chips, a moving line).
 *
 *   Analytics
 *   Portfolio value
 *   GH₵ 3,240.00
 *   ▲ GH₵ 340.00 (+11.7%) · Past month        ← green up / red down
 *   ( 1D )( 1W )(●1M )( 1Y▾)( All )            ← time range (scopes everything below);
 *                                                 1Y▾ picks 1 to 25 years
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
import { ChevronDownIcon, PlusIcon, TriangleUpIcon } from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ROUTES } from "@/config/routes";
import {
  PreviewSampleButton,
  SampleDataNotice,
} from "@/features/transactions/SampleData";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PortfolioChart } from "./PortfolioChart";
import {
  buildSeries,
  FIXED_RANGES,
  MAX_YEARS,
  summarize,
  yearsRange,
  type ChartRange,
} from "./portfolioHistory";

/** Tooltip time for each range: "2:00 pm" · "1 Oct, 2:00 pm" · "1 Oct 2026". */
function tooltipTime(range: ChartRange) {
  return (time: number) => {
    const date = new Date(time);
    const clock = date.toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (range.kind === "day") return clock;
    const day = date.toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      ...(range.kind === "years" || range.kind === "all" ? { year: "numeric" } : {}),
    });
    return range.kind === "week" || range.kind === "month" ? `${day}, ${clock}` : day;
  };
}

/** Date under the chart: "2 pm" · "1 Oct" · "Oct 2026". */
function axisTime(range: ChartRange) {
  return (time: number) => {
    const date = new Date(time);
    if (range.kind === "day")
      return date.toLocaleTimeString("en-GH", { hour: "numeric" });
    if (range.kind === "week" || range.kind === "month") {
      return date.toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("en-GH", {
      month: "short",
      year: "numeric",
    });
  };
}

export function AnalyticsScreen() {
  useStatusBarColor(GREY_PAGE_COLORS);
  const transactions = useTransactions();
  // A short range, "All", or a number of years (1–25, chosen on the year chip).
  const [rangeKey, setRangeKey] = useState<keyof typeof FIXED_RANGES | "YEARS">("1M");
  const [years, setYears] = useState(1);
  const range = useMemo<ChartRange>(
    () => (rangeKey === "YEARS" ? yearsRange(years) : FIXED_RANGES[rangeKey]),
    [rangeKey, years],
  );

  const points = useMemo(
    () => (transactions ? buildSeries(transactions, range) : null),
    [transactions, range],
  );

  const hasHistory = Boolean(
    transactions?.some((transaction) => transaction.status === "completed"),
  );
  const first = points?.[0].value ?? 0;
  const last = points?.[points.length - 1].value ?? 0;
  const change = Math.round((last - first) * 100) / 100;
  const percent = first > 0 ? (change / first) * 100 : null;
  const totals =
    transactions && points
      ? summarize(transactions, points[0].time, points[points.length - 1].time)
      : null;

  const [whole, fraction] = formatCedisNumber(last, { exact: true }).split(".");

  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-neutral-100 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] dark:bg-background",
        appTabBarPadding,
      )}
    >
      <h1 className="px-1 text-[1.75rem] leading-tight font-bold tracking-tight">
        Analytics
      </h1>

      <SampleDataNotice transactions={transactions} />

      {/* Performance card: value, range and chart together, the focus of the page
          (white on the grey page, with a soft brand wash across the top). */}
      <section
        aria-label="Portfolio performance"
        className="relative isolate overflow-hidden rounded-3xl bg-white p-5 dark:bg-white/5"
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-28 bg-linear-to-b from-brand-50 to-transparent dark:from-brand-500/10"
        />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Portfolio value
        </p>
        <p className="mt-1.5 flex items-baseline gap-1.5 leading-none font-bold">
          <span className="text-xl text-neutral-500 dark:text-neutral-400">
            {CEDI_SYMBOL}
          </span>
          <span className="text-[2.5rem] tracking-tight">
            {whole}
            <span className="text-2xl text-neutral-400">.{fraction}</span>
          </span>
        </p>
        {transactions && (
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            {change === 0 ? (
              <span className="font-medium text-neutral-500 dark:text-neutral-400">
                No change
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  change > 0
                    ? "text-brand-700 dark:text-brand-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                <TriangleUpIcon
                  className={cn("size-3", change < 0 && "rotate-180")}
                />
                <span className="sr-only">{change > 0 ? "Up" : "Down"}</span>
                {formatCedis(Math.abs(change), { exact: true })}
                {percent !== null &&
                  ` (${change > 0 ? "+" : "−"}${Math.abs(percent).toFixed(1)}%)`}
              </span>
            )}
            <span className="text-neutral-400">· {range.period}</span>
          </p>
        )}

        {/* Time range, spread evenly across the full width: scopes the chart and
            the totals below. 1D · 1W · 1M · years (1–25, a picker) · All. */}
        <div
          role="group"
          aria-label="Time range"
          className="mt-5 grid grid-cols-5 gap-1.5"
        >
          {(["1D", "1W", "1M", "YEARS", "ALL"] as const).map((key) => {
            const isActive = key === rangeKey;
            const chip = cn(
              "h-9 w-full cursor-pointer rounded-full text-[0.8125rem] font-semibold transition-colors",
              isActive
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10",
            );

            if (key === "YEARS") {
              // The phone's own picker, over the chip: tap → choose 1 to 25 years.
              return (
                <label
                  key={key}
                  className={cn(chip, "relative inline-flex items-center justify-center gap-0.5")}
                >
                  <span aria-hidden>{years}Y</span>
                  <ChevronDownIcon aria-hidden className="size-3" />
                  <select
                    aria-label="Years to show"
                    value={years}
                    onClick={() => setRangeKey("YEARS")}
                    onChange={(event) => {
                      setYears(Number(event.target.value));
                      setRangeKey("YEARS");
                    }}
                    className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                  >
                    {Array.from({ length: MAX_YEARS }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count === 1 ? "1 year" : `${count} years`}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }

            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setRangeKey(key)}
                className={chip}
              >
                {FIXED_RANGES[key].label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {points ? (
            <PortfolioChart
              key={range.id}
              points={points}
              label={`Portfolio value, ${range.period.toLowerCase()}: from ${formatCedis(first, { exact: true })} to ${formatCedis(last, { exact: true })}.`}
              formatTime={tooltipTime(range)}
              formatAxisTime={axisTime(range)}
              emptyMessage={
                hasHistory ? undefined : (
                  <>
                    <p className="text-sm font-semibold">
                      Your growth will show here
                    </p>
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
            <div
              aria-hidden
              className="h-56 animate-pulse rounded-2xl bg-neutral-100 motion-reduce:animate-none dark:bg-white/5"
            />
          )}
        </div>
      </section>

      {/* What happened in the range */}
      {totals && (
        <section
          aria-labelledby="period-title"
          className="rounded-3xl bg-white p-5 dark:bg-white/5"
        >
          <h2 id="period-title" className="text-base font-semibold">
            {range.period}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: "Invested", value: totals.invested },
              {
                label: "Profit earned",
                value: totals.profit,
                // Profit is shown after the management fee; say how much that was.
                note: totals.fees > 0 ? `after ${formatCedis(totals.fees, { exact: true })} fees` : undefined,
              },
              { label: "Withdrawn", value: totals.withdrawn },
              { label: "Referral rewards", value: totals.rewards },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/5"
              >
                <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-base font-semibold tracking-tight">
                  {formatCedis(item.value, { exact: true })}
                  {item.note && (
                    <span className="mt-0.5 block text-[0.6875rem] font-normal tracking-normal text-neutral-500 dark:text-neutral-400">
                      {item.note}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <AppTabBar />
    </div>
  );
}
