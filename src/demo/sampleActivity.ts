/**
 * ⚠️ DEMO ONLY: a year of SAMPLE activity, so the app can be previewed as an
 * active investor (the Analytics chart moving, Transactions filled, the
 * dashboard balance). Loaded only when the user taps "Preview with a sample
 * year" (demo mode), clearly labelled, and removable. Never shown otherwise.
 *
 * Follows the real package rules (config in investmentPackages.ts): amounts
 * within each package's limits, returns paid on its payout schedule at the
 * MIDDLE of its expected monthly range (e.g. 5–10% → 7.5%), before its
 * management fee, which then comes off the profit. Each return records that
 * calculation (ReturnBreakdown), so it can be checked by hand.
 * Deterministic: the same pattern every time, anchored to "now".
 */

import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import type { ReturnBreakdown, Transaction } from "@/features/transactions/transactionModel";

/** Sample transactions' ids start with this, so they can be told apart and removed. */
export const SAMPLE_ID_PREFIX = "SMP";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MONTH = 30.4 * DAY;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * One payout: amount invested × monthly rate × months = gross profit; the
 * management fee (a % of that profit) comes off; the rest is paid.
 */
export function returnFor(packageId: PackageId, principal: number, months: number): ReturnBreakdown & { paid: number } {
  const pkg = INVESTMENT_PACKAGES[packageId];
  const [low, high] = pkg.monthlyRoiPercent;
  const monthlyRatePercent = (low + high) / 2;
  const grossProfit = round2(principal * (monthlyRatePercent / 100) * months);
  const fee = round2(grossProfit * (pkg.managementFeePercent / 100));
  return {
    principal,
    monthlyRatePercent,
    months,
    grossProfit,
    fee,
    feePercent: pkg.managementFeePercent,
    paid: round2(grossProfit - fee),
  };
}

export function sampleYearOfActivity(now = Date.now()): Transaction[] {
  const list: Omit<Transaction, "id">[] = [];
  const at = (msAgo: number) => new Date(now - msAgo).toISOString();

  const invest = (packageId: PackageId, amount: number, msAgo: number, channel = "MTN MoMo") =>
    list.push({ type: "investment", amount, packageId, channel, status: "completed", createdAt: at(msAgo) });

  // Investments over the year (each within its package's limits). Start dates
  // are staggered, so returns land on different days, recent ones included.
  const holdings: { packageId: PackageId; amount: number; since: number }[] = [
    { packageId: "abc", amount: 3500, since: 12 * MONTH - 6 * DAY },
    { packageId: "mfc", amount: 450, since: 11 * MONTH - 12 * DAY },
    { packageId: "investwise", amount: 1500, since: 8 * MONTH - 20 * DAY },
  ];
  holdings.forEach((holding) => invest(holding.packageId, holding.amount, holding.since + 3 * HOUR));
  // A top-up today, so "1D" moves too.
  invest("mfc", 300, 3 * HOUR, "Vodafone Cash");

  // Returns, on each package's schedule (monthly, or every 3 months for ABC),
  // each with its calculation.
  holdings.forEach((holding) => {
    const every = INVESTMENT_PACKAGES[holding.packageId].withdrawalEveryMonths;
    for (let monthsIn = every; holding.since - monthsIn * MONTH > 0; monthsIn += every) {
      const { paid, ...breakdown } = returnFor(holding.packageId, holding.amount, every);
      list.push({
        type: "return",
        amount: paid,
        packageId: holding.packageId,
        status: "completed",
        createdAt: at(holding.since - monthsIn * MONTH + 9 * HOUR),
        breakdown,
      });
    }
  });

  // Withdrawals: two paid out, one that failed, one still pending.
  list.push(
    { type: "withdrawal", amount: 900, channel: "MTN MoMo", status: "completed", createdAt: at(6 * MONTH + 2 * DAY) },
    { type: "withdrawal", amount: 1500, channel: "MTN MoMo", status: "completed", createdAt: at(3 * MONTH + 5 * DAY) },
    { type: "withdrawal", amount: 300, channel: "MTN MoMo", status: "failed", createdAt: at(45 * DAY) },
    { type: "withdrawal", amount: 400, channel: "MTN MoMo", status: "pending", createdAt: at(2 * DAY + 4 * HOUR) },
  );

  // Referral rewards: friends who signed up (100 points = GH₵ 100 each).
  [9 * MONTH, 4 * MONTH, 5 * DAY].forEach((msAgo) =>
    list.push({ type: "referral", amount: 100, status: "completed", createdAt: at(msAgo) }),
  );

  return list.map((transaction, index) => ({
    ...transaction,
    id: `${SAMPLE_ID_PREFIX}${String(1_000_000 + ((index * 7919) % 9_000_000)).padStart(7, "0")}`,
  }));
}
