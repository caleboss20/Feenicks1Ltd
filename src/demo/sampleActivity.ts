/**
 * ⚠️ DEMO ONLY: a year of SAMPLE activity, so the app can be previewed as an
 * active investor (the Analytics chart moving, Transactions filled, the
 * dashboard balance). Loaded only when the user taps "Preview with a sample
 * year" (demo mode), clearly labelled, and removable. Never shown otherwise.
 *
 * Follows the real rules, so the preview never shows something a real
 * investor couldn't do:
 *   - ONE PACKAGE (packagePolicy.ts, the CEO's one-investor-one-package
 *     rule): InvestWise Capital, topped up twice, the total staying within
 *     the package's minimum–maximum (investmentPackages.ts)
 *   - returns paid on the package's schedule at the MIDDLE of its expected
 *     monthly range (5–10% → 7.5%), before its management fee, which then
 *     comes off the profit; each return records that calculation
 *     (ReturnBreakdown), so it can be checked by hand
 *   - a top-up starts earning from the next full payout period
 *   - withdrawals only take out profit already paid
 * Deterministic: the same pattern every time, anchored to "now".
 *
 * The totals, for checking (Analytics → "How your portfolio adds up"):
 *   invested 1,500 + 700 + 500                              = GH₵ 2,700.00
 *   profit   7 × 108.00 (on 1,500) + 4 × 158.40 (on 2,200)  = GH₵ 1,389.60
 *            after fees of 7 × 4.50 + 4 × 6.60              = GH₵    57.90
 *   rewards  3 × 100                                        = GH₵   300.00
 *   withdrawn 400 + 500 (a failed 300 and a pending 400 don't count)
 *                                                           = GH₵   900.00
 *   portfolio value 2,700 + 1,389.60 + 300 − 900            = GH₵ 3,489.60
 * (The 500 was paid 3 hours ago, so it hasn't earned yet.)
 */

import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import type { ReturnBreakdown, Transaction } from "@/features/transactions/transactionModel";

/** Sample transactions' ids start with this, so they can be told apart and removed. */
export const SAMPLE_ID_PREFIX = "SMP";

/**
 * Which version of the sample this is. Bump it whenever the sample changes:
 * an account holding an older sample gets the current one automatically
 * (transactionsService.getTransactions), so the preview always follows
 * today's rules without the user having to remove and reload it.
 *   1: three packages (before the one-package rule)
 *   2: one package, topped up within its maximum
 *   3: every payment within the package's range (the range is per payment),
 *      and Telecel Cash (formerly Vodafone Cash)
 *   4: withdrawals linked to the package (so the wallet card counts them)
 */
export const SAMPLE_VERSION = 4;

/** The one package the sample investor is in (one investor, one package). */
const SAMPLE_PACKAGE: PackageId = "investwise";

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

  // When the sample investor started: a year ago, give or take, so payouts
  // land on different days of the month, recent ones included.
  const start = 12 * MONTH - 6 * DAY; // ms ago
  const pkg = INVESTMENT_PACKAGES[SAMPLE_PACKAGE];
  const every = pkg.withdrawalEveryMonths; // InvestWise pays monthly

  // Money in, all into the one package: a first investment, a top-up two days
  // before the 7th payout (so it earns from the 8th), and one today (so "1D"
  // moves too). 1,500 → 2,200 → 2,500: within InvestWise's GH₵ 500 –
  // 2,999.99 at every step.
  const deposits = [
    { amount: 1500, msAgo: start, channel: "MTN MoMo" },
    { amount: 700, msAgo: start - 7 * MONTH + 2 * DAY, channel: "MTN MoMo" },
    { amount: 500, msAgo: 3 * HOUR, channel: "Telecel Cash" },
  ];
  deposits.forEach((deposit) =>
    list.push({
      type: "investment",
      amount: deposit.amount,
      packageId: SAMPLE_PACKAGE,
      channel: deposit.channel,
      status: "completed",
      createdAt: at(deposit.msAgo),
    }),
  );

  // Returns on the package's schedule, each on the amount that was invested
  // for the whole period (deposits made before the period began), with its
  // calculation. Only payouts already due (in the past) are included.
  for (let payout = every; start - payout * MONTH > 0; payout += every) {
    const periodStartMsAgo = start - (payout - every) * MONTH;
    const principal = deposits
      .filter((deposit) => deposit.msAgo >= periodStartMsAgo)
      .reduce((sum, deposit) => sum + deposit.amount, 0);
    const { paid, ...breakdown } = returnFor(SAMPLE_PACKAGE, principal, every);
    list.push({
      type: "return",
      amount: paid,
      packageId: SAMPLE_PACKAGE,
      status: "completed",
      createdAt: at(start - payout * MONTH - 9 * HOUR),
      breakdown,
    });
  }

  // Withdrawals, of profit already paid: two paid out, one that failed, one
  // still pending.
  list.push(
    { type: "withdrawal", amount: 400, packageId: SAMPLE_PACKAGE, channel: "MTN MoMo", status: "completed", createdAt: at(6 * MONTH + 2 * DAY) },
    { type: "withdrawal", amount: 500, packageId: SAMPLE_PACKAGE, channel: "MTN MoMo", status: "completed", createdAt: at(2 * MONTH + 5 * DAY) },
    { type: "withdrawal", amount: 300, packageId: SAMPLE_PACKAGE, channel: "MTN MoMo", status: "failed", createdAt: at(45 * DAY) },
    { type: "withdrawal", amount: 400, packageId: SAMPLE_PACKAGE, channel: "MTN MoMo", status: "pending", createdAt: at(2 * DAY + 4 * HOUR) },
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
