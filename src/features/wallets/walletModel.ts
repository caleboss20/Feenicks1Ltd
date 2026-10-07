import type { PackageId } from "@/features/packages/investmentPackages";
import type { Transaction } from "@/features/transactions/transactionModel";

/**
 * A package wallet: where an investor's money in one package lives, shown
 * as a card ("InvestWise wallet"). Created the moment they choose the
 * package, so a new investor sees their wallet at GH₵ 0.00 before paying.
 * One per package (one investor, one package for now: packagePolicy.ts).
 */
export type PackageWallet = {
  /** e.g. "F1-IC-48217365": the F1 prefix and package code, then 8 digits. Never a bank card number. */
  id: string;
  packageId: PackageId;
  createdAt: string;
};

/** "F1-IC-48217365" → "F1 IC 4821 7365", grouped like a card number for reading aloud. */
export function formatWalletId(id: string): string {
  const [prefix, code, digits = ""] = id.split("-");
  return [prefix, code, digits.slice(0, 4), digits.slice(4)].filter(Boolean).join(" ");
}

/**
 * What's in the wallet: paid investments and returns into this package,
 * less paid withdrawals from it. Pending or failed movements don't count
 * until they complete.
 * TODO(api): the server's figure from the latest approved period, with its
 * "as at" date (Core Business & Product Architecture v1.1, §13).
 */
export function walletBalance(transactions: Transaction[], packageId: PackageId): number {
  const total = transactions
    .filter((item) => item.packageId === packageId && item.status === "completed")
    .reduce((sum, item) => {
      if (item.type === "investment" || item.type === "return") return sum + item.amount;
      if (item.type === "withdrawal") return sum - item.amount;
      return sum;
    }, 0);
  return Math.round(total * 100) / 100;
}
