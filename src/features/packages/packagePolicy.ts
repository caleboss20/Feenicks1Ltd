import type { Transaction } from "@/features/transactions/transactionModel";
import { INVESTMENT_PACKAGES, type PackageId } from "./investmentPackages";

/**
 * Package holding rules: how many packages one investor can be in at a time.
 *
 * ┌ Business rules (confirmed by the CEO, October 2026) ─────────────────────┐
 * │ ONE INVESTOR, ONE PACKAGE. Once someone has invested in a package, they │
 * │ can add money to that same package (a top-up) as often as they like,    │
 * │ but can't invest in a second package.                                   │
 * │                                                                         │
 * │ THE RANGE IS PER PAYMENT. A package's minimum–maximum applies to each   │
 * │ payment, first or top-up, NOT to the total. InvestWise (GH₵ 500 –       │
 * │ 4,999.99): 500 now, 4,999.99 next month, 1,000 after… a total of        │
 * │ GH₵ 10,000 is fine; a single payment of 300 or 5,000 isn't.             │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * The rule is expected to change. To let investors hold more packages, raise
 * MAX_PACKAGES_PER_INVESTOR: every screen and check reads the rule from this
 * file and never assumes "one", so the app needs no other change. The server
 * must enforce the same rule, because the app's checks are only for guidance.
 * TODO(api): reject an investment in a new package once the investor holds
 * MAX_PACKAGES_PER_INVESTOR packages, and any payment outside the package's
 * minimum–maximum (isWithinPaymentRange).
 *
 * Where the rule shows up:
 *   - Invest list (RecommendedPackagesScreen): the investor's package first,
 *     marked "Your package"; the others can be browsed but not invested in
 *   - Package details: "Add money" on their package; elsewhere, why not
 *   - Terms (investmentService.acceptPackageTerms): refused when not allowed
 *   - Amount screen and payments (paymentService): each payment in range
 *   - Demo sample year (demo/sampleActivity.ts): one package, every
 *     payment within its range
 */
export const MAX_PACKAGES_PER_INVESTOR = 1;

/** "one package" / "3 packages", for sentences about the rule. */
const LIMIT_IN_WORDS =
  MAX_PACKAGES_PER_INVESTOR === 1 ? "one package" : `${MAX_PACKAGES_PER_INVESTOR} packages`;

/**
 * Does this transaction put money into a package? Investments that are paid
 * (completed) or being paid (pending) count, so a second package can't be
 * started while the first payment is still going through. Failed ones don't.
 */
function holdsMoneyIn(transaction: Transaction): transaction is Transaction & { packageId: PackageId } {
  return transaction.type === "investment" && transaction.status !== "failed" && Boolean(transaction.packageId);
}

/**
 * The packages the investor is in, in the order they first invested.
 * TODO(invest): when investments can end (mature or be cashed out), an ended
 * package should no longer count. That needs the holdings model, which isn't
 * built yet.
 */
export function heldPackageIds(transactions: Transaction[]): PackageId[] {
  const held: PackageId[] = [];
  const oldestFirst = [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const transaction of oldestFirst) {
    if (holdsMoneyIn(transaction) && !held.includes(transaction.packageId)) held.push(transaction.packageId);
  }
  return held;
}

/** How much the investor has put into a package (paid and pending), in GH₵. */
export function amountInvestedIn(transactions: Transaction[], packageId: PackageId): number {
  const total = transactions
    .filter((transaction) => holdsMoneyIn(transaction) && transaction.packageId === packageId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return Math.round(total * 100) / 100;
}

/** Whether the investor can put money into a package, and if not, why. */
export type InvestOption =
  /** A package they're not in, and they have room for one more. */
  | { kind: "new" }
  /** Their own package: they can add more (each payment within its range; no cap on the total). */
  | { kind: "top-up"; invested: number }
  /** Another package, but they're already in as many as allowed. */
  | { kind: "limit-reached"; held: PackageId[] };

export function investOptionFor(transactions: Transaction[], packageId: PackageId): InvestOption {
  const held = heldPackageIds(transactions);
  if (held.includes(packageId)) return { kind: "top-up", invested: amountInvestedIn(transactions, packageId) };
  return held.length >= MAX_PACKAGES_PER_INVESTOR ? { kind: "limit-reached", held } : { kind: "new" };
}

/** True when one payment of `amount` GH₵ is within the package's minimum–maximum (first or top-up alike). */
export function isWithinPaymentRange(packageId: PackageId, amount: number): boolean {
  const { minimum, maximum } = INVESTMENT_PACKAGES[packageId];
  return amount >= minimum && amount <= maximum;
}

/** True when money can go into the package now (a first investment or a top-up). */
export function canInvest(option: InvestOption): boolean {
  return option.kind === "new" || option.kind === "top-up";
}

/** "InvestWise Capital", "InvestWise Capital and Mutual Fund Capital". */
function packageNames(ids: PackageId[]): string {
  const names = ids.map((id) => INVESTMENT_PACKAGES[id].name);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** The rule, in a sentence: "For now, you can invest in one package at a time." */
export const PACKAGE_LIMIT_SENTENCE = `For now, you can invest in ${LIMIT_IN_WORDS} at a time.`;

/** Why money can't go into the package, in words; null when it can. */
export function investBlockedReason(option: InvestOption): string | null {
  switch (option.kind) {
    case "limit-reached":
      return `You're invested in ${packageNames(option.held)}. ${PACKAGE_LIMIT_SENTENCE}`;
    default:
      return null;
  }
}
