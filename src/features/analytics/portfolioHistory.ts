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
 * The chart's time ranges: how far back, and how many points to plot. Dense
 * enough that each rise or drop is drawn crisp, not as a long slant.
 */
export const RANGES = [
  { id: "1D", label: "1D", period: "Past day", ms: DAY, points: 97 }, // every 15 min
  { id: "1W", label: "1W", period: "Past week", ms: 7 * DAY, points: 113 }, // every 1.5 h
  { id: "1M", label: "1M", period: "Past month", ms: 30 * DAY, points: 121 }, // every 6 h
  { id: "1Y", label: "1Y", period: "Past year", ms: 365 * DAY, points: 147 }, // every 2.5 days
  { id: "ALL", label: "All", period: "All time", ms: null, points: 147 },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];

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
  rangeId: RangeId,
  now = Date.now(),
): SeriesPoint[] {
  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[2];
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

/** What happened in a period: money in, profit, money out, rewards (completed only). */
export function summarize(transactions: Transaction[], from: number, to: number) {
  const totals = { invested: 0, profit: 0, withdrawn: 0, rewards: 0 };
  for (const transaction of transactions) {
    const time = Date.parse(transaction.createdAt);
    if (transaction.status !== "completed" || time <= from || time > to) continue;
    if (transaction.type === "investment") totals.invested += transaction.amount;
    if (transaction.type === "return") totals.profit += transaction.amount;
    if (transaction.type === "withdrawal") totals.withdrawn += transaction.amount;
    if (transaction.type === "referral") totals.rewards += transaction.amount;
  }
  return totals;
}
