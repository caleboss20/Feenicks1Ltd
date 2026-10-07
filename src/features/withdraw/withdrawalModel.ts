import {
  cycleEnd,
  INVESTMENT_PACKAGES,
  type InvestmentPackage,
  type PackageId,
} from "@/features/packages/investmentPackages";
import type { Transaction } from "@/features/transactions/transactionModel";
import type { MomoNetwork } from "@/lib/mobileMoney";

/**
 * Withdrawals, by the CEO's rules (October 2026):
 *
 *   PRE-INVESTMENT  within 72 hours of the first deposit the money isn't
 *                   invested yet: it can all come back, free
 *   STANDARD        after an investment cycle ends (28 days for MFC and IC,
 *                   3 months for ABC, 6 months for REPF): any part or all
 *                   of the account, no fee. GH₵ 1,000 asked = GH₵ 1,000 received
 *   EXPRESS         any other time after the 72 hours: a premium / emergency
 *                   withdrawal with a 1% fee ON TOP. GH₵ 500 asked = GH₵ 500
 *                   received, GH₵ 505 taken from the account
 *
 * What's left must still fit a package: if it falls below the package's
 * minimum it moves down to the package whose range it fits (e.g. to MFC),
 * and earns that package's rates (tierAfterWithdrawal).
 *
 * Every request then shows three steps: requested → approved → paid
 * (Core Business & Product Architecture v1.1, §13).
 */

export type WithdrawalKind = "pre-investment" | "standard" | "express";
export type WithdrawalStatus = "requested" | "approved" | "paid" | "rejected" | "cancelled";

export type WithdrawalRequest = {
  /** e.g. "WD48291736", the reference to quote to support. */
  id: string;
  packageId: PackageId;
  kind: WithdrawalKind;
  /** What they receive on MoMo, in GH₵. */
  amount: number;
  /** The express fee (0 otherwise), in GH₵. */
  fee: number;
  /** What leaves the account: amount + fee. */
  debit: number;
  network: MomoNetwork;
  /** The MoMo number it's paid to: the profile number, 9 digits. */
  phone: string;
  status: WithdrawalStatus;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  /** The withdrawal in Transactions (pending until paid), for the debit. */
  transactionId: string;
};

/**
 * The rules as settings, so a change from the CEO changes a number, not screens.
 * TODO(ceo): confirm standardWindowDays (how long after a cycle ends a
 * withdrawal still counts as standard) and minimum: not in his rules yet.
 */
export const WITHDRAWAL_RULES = {
  /** A first deposit is invested this long after it's made. */
  activationHours: 72,
  /** After each cycle ends, standard (free) withdrawals stay open this many days. */
  standardWindowDays: 3,
  /** Express withdrawals: this % of the amount asked, charged on top. */
  expressFeePercent: 1,
  /** Smallest withdrawal, in GH₵. */
  minimum: 1,
  /** Working days the team takes to review and pay. */
  processingDays: 3,
} as const;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const round2 = (value: number) => Math.round(value * 100) / 100;

/** The investor's first paid deposit into the package (when the 72 hours start), or null. */
export function firstDeposit(transactions: Transaction[], packageId: PackageId): Date | null {
  const dates = transactions
    .filter((item) => item.type === "investment" && item.packageId === packageId && item.status === "completed")
    .map((item) => Date.parse(item.createdAt));
  return dates.length > 0 ? new Date(Math.min(...dates)) : null;
}

export type WithdrawalTerms = {
  kind: WithdrawalKind;
  /** When the money became (or becomes) invested: first deposit + 72 hours. */
  investedFrom: Date;
  /** Express now: when the next free (standard) withdrawal opens. */
  nextStandardFrom: Date | null;
  /** Standard or pre-investment now: until when it stays free. */
  freeUntil: Date | null;
};

/** Which kind of withdrawal it would be right now, and the dates that matter. */
export function withdrawalTerms(pkg: InvestmentPackage, firstDepositAt: Date, now = new Date()): WithdrawalTerms {
  const investedFrom = new Date(firstDepositAt.getTime() + WITHDRAWAL_RULES.activationHours * HOUR);
  if (now < investedFrom) {
    return { kind: "pre-investment", investedFrom, nextStandardFrom: null, freeUntil: investedFrom };
  }
  // Walk the cycles from when it was invested: inside a cycle → express;
  // in the few days after a cycle ends → standard.
  for (let count = 1; count < 2000; count += 1) {
    const end = cycleEnd(pkg, investedFrom, count);
    if (now < end) return { kind: "express", investedFrom, nextStandardFrom: end, freeUntil: null };
    const windowEnd = new Date(end.getTime() + WITHDRAWAL_RULES.standardWindowDays * DAY);
    if (now < windowEnd) return { kind: "standard", investedFrom, nextStandardFrom: null, freeUntil: windowEnd };
  }
  return { kind: "express", investedFrom, nextStandardFrom: null, freeUntil: null };
}

/**
 * What's in the account that can be withdrawn: paid deposits and returns,
 * less withdrawals paid or still in progress (failed or cancelled ones
 * don't count). The CEO's rule: standard withdrawals can take any part or
 * all of the account, not only the profit.
 * TODO(api): the server's figure (withdrawable = closing − locked − pending).
 */
export function withdrawableBalance(transactions: Transaction[], packageId: PackageId): number {
  const total = transactions.reduce((sum, item) => {
    const isThisPackage = item.packageId === packageId || item.packageId === undefined;
    if (!isThisPackage) return sum;
    if ((item.type === "investment" || item.type === "return") && item.status === "completed") return sum + item.amount;
    if (item.type === "withdrawal" && item.status !== "failed") return sum - item.amount;
    return sum;
  }, 0);
  return Math.max(0, round2(total));
}

/** The fee for asking `amount` as this kind of withdrawal, in GH₵. */
export function withdrawalFee(kind: WithdrawalKind, amount: number): number {
  return kind === "express" ? round2((amount * WITHDRAWAL_RULES.expressFeePercent) / 100) : 0;
}

/** The most they can ask for: the balance, or (express) what the balance covers with the fee on top. */
export function largestWithdrawal(kind: WithdrawalKind, balance: number): number {
  if (kind !== "express") return balance;
  // Largest amount whose amount + fee still fits the balance (fee rounds to the pesewa).
  let amount = Math.floor((balance / (1 + WITHDRAWAL_RULES.expressFeePercent / 100)) * 100) / 100;
  while (amount > 0 && amount + withdrawalFee(kind, amount) > balance) amount = round2(amount - 0.01);
  return Math.max(0, amount);
}

/**
 * Where what's left would sit after the withdrawal: the same package, a
 * lower one (its range fits the remainder), or none (below every
 * minimum: "below-minimum"), or "emptied" when nothing is left.
 *
 * Only the withdrawal itself can cause a move: if the balance was already
 * below the package minimum before it (the range changed after they
 * invested, e.g. ABC's minimum went from GH₵ 3,000 to GH₵ 5,000), they keep
 * their package. A range change never re-classifies an existing position
 * (Core Business & Product Architecture v1.1, §6).
 */
export function tierAfterWithdrawal(
  current: PackageId,
  balanceBefore: number,
  remaining: number,
): { kind: "same" } | { kind: "moves"; to: InvestmentPackage } | { kind: "below-minimum" } | { kind: "emptied" } {
  if (remaining <= 0) return { kind: "emptied" };
  const pkg = INVESTMENT_PACKAGES[current];
  if (remaining >= pkg.minimum || balanceBefore < pkg.minimum) return { kind: "same" };
  const fits = Object.values(INVESTMENT_PACKAGES).find((item) => remaining >= item.minimum && remaining <= item.maximum);
  return fits ? { kind: "moves", to: fits } : { kind: "below-minimum" };
}
