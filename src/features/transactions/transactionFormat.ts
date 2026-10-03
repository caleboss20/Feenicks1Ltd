import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import type { Transaction } from "./transactionModel";

/**
 * How transactions are written, shared by the Transactions list, the
 * dashboard's Recent activity and Help & support, so they read the same
 * everywhere.
 */

/** What happened, in words: "Return from InvestWise Capital", "Withdrawal to MTN MoMo"… */
export function transactionTitle(transaction: Transaction): string {
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  switch (transaction.type) {
    case "investment":
      return pkg ? `Invested in ${pkg.name}` : "Investment";
    case "return":
      return pkg ? `Return from ${pkg.name}` : "Return paid";
    case "withdrawal":
      return transaction.channel ? `Withdrawal to ${transaction.channel}` : "Withdrawal";
    case "referral":
      return "Referral reward";
  }
}

/** "Today, 1:23 pm" · "Yesterday, 9:00 am" · "20 Oct, 2:23 pm" · "20 Oct 2025, 2:23 pm". */
export function formatWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  return `${day}, ${time}`;
}
