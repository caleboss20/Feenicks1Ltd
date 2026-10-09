import { cycleEnd, estimateProfit, type InvestmentPackage } from "@/features/packages/investmentPackages";
import type { Transaction } from "@/features/transactions/transactionModel";
import { walletBalance } from "@/features/wallets/walletModel";
import { firstDeposit, WITHDRAWAL_RULES, withdrawalTerms } from "@/features/withdraw/withdrawalModel";

/**
 * "What's happening with my money right now?", worked out from the
 * investor's own first deposit and the portfolio's rules (the same rules the
 * Withdraw screen and the withdrawal guide use):
 *
 *   waiting     the first 72 hours: the money isn't invested yet
 *   investing   inside a cycle: which one, which day of how many
 *
 * Cycles run back to back from "invested from" (each starts the moment the
 * last ends); the first WITHDRAWAL_RULES.standardWindowDays of each are free
 * for withdrawals. "Earned so far" is an ESTIMATE: the portfolio's expected
 * monthly return range after the management fee (estimateProfit), on the
 * current balance, for the part of the cycle that has passed. The actual
 * return is set when the cycle ends. TODO(api): the server's accrued figure.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;

export type CycleInfo = { number: number; start: Date; end: Date; day: number; lengthDays: number };

export type FinishedCycle = { number: number; start: Date; end: Date; returned: number | null };

export type InvestmentOverview = {
  balance: number;
  firstDepositAt: Date;
  investedFrom: Date;
  phase: "waiting" | "investing";
  /** Waiting: hours passed of the 72. */
  waitingHours: number;
  cycle: CycleInfo | null;
  /** Withdrawals are free right now until this time (waiting, or the first days of a cycle). */
  freeUntil: Date | null;
  /** The next free window (when not free right now, or the one after). */
  nextFree: { from: Date; until: Date };
  /** Months one cycle covers, for the return estimate (28 days counts as a month). */
  cycleMonths: number;
  /** Estimated return for the whole current cycle, after the fee: [low, high]. */
  expectedThisCycle: [number, number];
  /** The part of it earned so far (by days passed): [low, high]. */
  earnedSoFar: [number, number];
  finished: FinishedCycle[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function investmentOverview(
  pkg: InvestmentPackage,
  transactions: Transaction[],
  now = new Date(),
): InvestmentOverview | null {
  const firstDepositAt = firstDeposit(transactions, pkg.id);
  if (!firstDepositAt) return null;
  const terms = withdrawalTerms(pkg, firstDepositAt, now);
  const { investedFrom } = terms;
  const balance = walletBalance(transactions, pkg.id);
  const cycleMonths = "days" in pkg.cycle ? 1 : pkg.cycle.months;
  const freeDays = WITHDRAWAL_RULES.standardWindowDays;

  // Which cycle is running, and the ones that have finished.
  let cycle: CycleInfo | null = null;
  const ends: Date[] = [investedFrom];
  if (now >= investedFrom) {
    for (let count = 1; count < 2000; count += 1) {
      const start = cycleEnd(pkg, investedFrom, count - 1);
      const end = cycleEnd(pkg, investedFrom, count);
      ends.push(end);
      if (now < end) {
        const lengthDays = Math.round((end.getTime() - start.getTime()) / DAY);
        cycle = { number: count, start, end, day: Math.min(lengthDays, Math.floor((now.getTime() - start.getTime()) / DAY) + 1), lengthDays };
        break;
      }
    }
  }

  const returnsBetween = (from: Date, to: Date) =>
    transactions
      .filter(
        (item) =>
          item.type === "return" &&
          item.status === "completed" &&
          item.packageId === pkg.id &&
          Date.parse(item.createdAt) >= from.getTime() &&
          Date.parse(item.createdAt) < to.getTime(),
      )
      .reduce((sum, item) => sum + item.amount, 0);

  // Finished cycles, newest first: the return paid after each (until the next cycle's end).
  const finished: FinishedCycle[] = [];
  const lastFinished = (cycle ? cycle.number : ends.length) - 1;
  for (let number = lastFinished; number >= 1 && finished.length < 12; number -= 1) {
    const start = cycleEnd(pkg, investedFrom, number - 1);
    const end = cycleEnd(pkg, investedFrom, number);
    const paid = returnsBetween(end, cycleEnd(pkg, investedFrom, number + 1));
    finished.push({ number, start, end, returned: paid > 0 ? round2(paid) : null });
  }

  // Free right now? (Waiting, or the first days of the current cycle.) And the next free window.
  const freeUntil =
    terms.kind === "pre-investment" || terms.kind === "standard" ? (terms.freeUntil ?? null) : null;
  const nextStart = cycle ? cycle.end : cycleEnd(pkg, investedFrom, 1);
  const nextFree = { from: nextStart, until: new Date(nextStart.getTime() + freeDays * DAY) };

  const expected = estimateProfit(pkg, balance, cycleMonths).afterFee;
  const fraction = cycle ? Math.min(1, (now.getTime() - cycle.start.getTime()) / (cycle.end.getTime() - cycle.start.getTime())) : 0;

  return {
    balance,
    firstDepositAt,
    investedFrom,
    phase: now < investedFrom ? "waiting" : "investing",
    waitingHours: Math.max(0, Math.min(WITHDRAWAL_RULES.activationHours, (now.getTime() - firstDepositAt.getTime()) / HOUR)),
    cycle,
    freeUntil,
    nextFree,
    cycleMonths,
    expectedThisCycle: [round2(expected[0]), round2(expected[1])],
    earnedSoFar: [round2(expected[0] * fraction), round2(expected[1] * fraction)],
    finished,
  };
}
