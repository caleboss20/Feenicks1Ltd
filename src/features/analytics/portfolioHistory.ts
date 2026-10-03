import type { Transaction } from "@/features/transactions/transactionModel";

/**
 * Portfolio maths, from the transaction history only (nothing estimated or
 * made up): the value goes up with investments, returns and referral
 * rewards, and down with withdrawals. Only completed transactions count.
 *
 * Used by the Analytics chart and the dashboard's balance, so they agree.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * A time range for the chart: how far back (null = since the first
 * transaction), and how many points to plot: dense enough that each rise or
 * drop is drawn crisp, not as a long slant.
 */
export type ChartRange = {
  id: string;
  /** On the chip, e.g. "1M", "3Y". */
  label: string;
  /** In sentences, e.g. "Past month", "Past 3 years". */
  period: string;
  ms: number | null;
  points: number;
  /** Decides how dates are written (times for a day, years for long ranges). */
  kind: "day" | "week" | "month" | "years" | "all";
};

/** The short ranges, and "All". Years are chosen separately (yearsRange). */
export const FIXED_RANGES = {
  "1D": { id: "1D", label: "1D", period: "Past day", ms: DAY, points: 97, kind: "day" }, // every 15 min
  "1W": { id: "1W", label: "1W", period: "Past week", ms: 7 * DAY, points: 113, kind: "week" }, // every 1.5 h
  "1M": { id: "1M", label: "1M", period: "Past month", ms: 30 * DAY, points: 121, kind: "month" }, // every 6 h
  ALL: { id: "ALL", label: "All", period: "All time", ms: null, points: 147, kind: "all" },
} as const satisfies Record<string, ChartRange>;

/** Long-term tracking: 1 year up to this many. */
export const MAX_YEARS = 25;

/** The last `years` years (1–25): "1Y" · "Past year", "3Y" · "Past 3 years". */
export function yearsRange(years: number): ChartRange {
  const count = Math.min(Math.max(Math.round(years), 1), MAX_YEARS);
  return {
    id: `${count}Y`,
    label: `${count}Y`,
    period: count === 1 ? "Past year" : `Past ${count} years`,
    ms: count * 365 * DAY,
    // About every 2.5 days for a year, thinning out to about monthly for 25 years.
    points: Math.min(147 + (count - 1) * 12, 301),
    kind: "years",
  };
}

export type SeriesPoint = { time: number; value: number };

/** How a transaction changes the portfolio value (0 unless completed). */
export function valueEffect(transaction: Transaction): number {
  if (transaction.status !== "completed") return 0;
  return transaction.type === "withdrawal" ? -transaction.amount : transaction.amount;
}

/** The portfolio value at `time`: every completed transaction up to then. */
export function valueAt(transactions: Transaction[], time: number): number {
  let value = 0;
  for (const transaction of transactions) {
    if (Date.parse(transaction.createdAt) <= time) value += valueEffect(transaction);
  }
  // Rounded to pesewas, so floating-point sums never show "0.30000000004".
  return Math.round(value * 100) / 100;
}

/** The portfolio value now: every completed transaction. */
export function currentValue(transactions: Transaction[]): number {
  return valueAt(transactions, Number.POSITIVE_INFINITY);
}

/** Total profit paid (completed returns), all time. */
export function totalProfit(transactions: Transaction[]): number {
  return transactions
    .filter((transaction) => transaction.type === "return" && transaction.status === "completed")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

/** True once the user has a completed investment. */
export function hasCompletedInvestment(transactions: Transaction[]): boolean {
  return transactions.some(
    (transaction) => transaction.type === "investment" && transaction.status === "completed",
  );
}

/**
 * The value over a range, sampled at evenly spaced times from the start of
 * the range to now. "All" starts at the first transaction (at least a day).
 */
export function buildSeries(
  transactions: Transaction[],
  range: ChartRange,
  now = Date.now(),
): SeriesPoint[] {
  const firstTime = transactions.reduce(
    (earliest, transaction) => Math.min(earliest, Date.parse(transaction.createdAt)),
    now,
  );
  const span = range.ms ?? Math.max(now - firstTime, DAY);
  const start = now - span;

  return Array.from({ length: range.points }, (_, index) => {
    const time = start + (span * index) / (range.points - 1);
    return { time, value: valueAt(transactions, time) };
  });
}

/**
 * What happened in a period (completed only): money in, profit paid (after
 * fees), the management fees taken from that profit, money out, rewards.
 */
export function summarize(transactions: Transaction[], from: number, to: number) {
  const totals = { invested: 0, profit: 0, fees: 0, withdrawn: 0, rewards: 0 };
  for (const transaction of transactions) {
    const time = Date.parse(transaction.createdAt);
    if (transaction.status !== "completed" || time <= from || time > to) continue;
    if (transaction.type === "investment") totals.invested += transaction.amount;
    if (transaction.type === "return") {
      totals.profit += transaction.amount;
      totals.fees += transaction.breakdown?.fee ?? 0;
    }
    if (transaction.type === "withdrawal") totals.withdrawn += transaction.amount;
    if (transaction.type === "referral") totals.rewards += transaction.amount;
  }
  // Rounded to pesewas (floating-point sums).
  for (const key of Object.keys(totals) as (keyof typeof totals)[]) {
    totals[key] = Math.round(totals[key] * 100) / 100;
  }
  return totals;
}
