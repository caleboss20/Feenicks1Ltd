"use client";

/**
 * RecentTransactions: the latest few transactions on the dashboard, after the
 * user's reference ("Transactions · View all"). White in light mode, black in
 * dark mode.
 *
 *   Recent activity                                   View all
 *   (↙)  Return from InvestWise Capital            + GH₵ 108.00
 *        Transaction ID: FX1182137
 *        22 Sept, 8:26 am
 *   (↗)  Withdrawal to MTN MoMo                     − GH₵ 400.00
 *        Transaction ID: FX1803811                       Pending
 *        30 Sept, 11:02 pm
 *
 * Arrows follow the portfolio: ↙ money in (investments, returns, rewards),
 * ↗ money out (withdrawals). Empty: "No activity yet". Same data as the
 * Transactions tab (useTransactions), so the two always agree.
 */

import Link from "next/link";
import { ArrowRight, ClockIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatWhen } from "./transactionFormat";
import type { Transaction } from "./transactionModel";

/** What happened, in words: "Return from InvestWise Capital", "Withdrawal to MTN MoMo"… */
function titleFor(transaction: Transaction): string {
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

export function RecentTransactions({
  transactions,
  limit = 5,
}: {
  /** Newest first; null while loading. */
  transactions: Transaction[] | null;
  limit?: number;
}) {
  const latest = transactions?.slice(0, limit) ?? [];

  return (
    <section aria-labelledby="recent-activity-title">
      <div className="flex items-center justify-between">
        <h2 id="recent-activity-title" className="text-lg font-semibold tracking-tight">
          Recent activity
        </h2>
        {latest.length > 0 && (
          <Link
            href={ROUTES.transactions}
            className="text-sm font-medium text-neutral-500 transition-colors hover:text-foreground dark:text-neutral-400"
          >
            View all
          </Link>
        )}
      </div>

      {transactions === null ? (
        <ul aria-busy="true" aria-label="Loading activity" className="mt-6 flex flex-col gap-7">
          {[0, 1, 2].map((index) => (
            <li key={index} className="flex animate-pulse items-start gap-4 motion-reduce:animate-none">
              <span className="size-11 shrink-0 rounded-full bg-neutral-100 dark:bg-white/10" />
              <span className="flex-1 pt-1">
                <span className="block h-3.5 w-3/5 rounded bg-neutral-200 dark:bg-white/10" />
                <span className="mt-2.5 block h-3 w-2/5 rounded bg-neutral-100 dark:bg-white/5" />
              </span>
              <span className="mt-1 h-3.5 w-16 rounded bg-neutral-200 dark:bg-white/10" />
            </li>
          ))}
        </ul>
      ) : latest.length === 0 ? (
        <div className="mt-6 flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-white/10">
            <ClockIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium">No activity yet</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Your investments, returns and withdrawals will show here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-7">
          {latest.map((transaction) => (
            <RecentRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentRow({ transaction }: { transaction: Transaction }) {
  const title = titleFor(transaction);
  const when = formatWhen(transaction.createdAt);
  const amount = formatCedis(transaction.amount, { exact: true });
  const isOut = transaction.type === "withdrawal";
  const isFailed = transaction.status === "failed";
  // Investments add to the portfolio but aren't income: no "+" on them.
  const sign = isOut ? "− " : transaction.type === "investment" ? "" : "+ ";

  // The visible text reads in a sensible order (title, ID, time, amount,
  // status), so screen readers get it as is. Only the arrow is decorative.
  return (
    <li className="flex items-start gap-4">
      {/* Round icon: ↙ in (green), ↗ out (red). The title already says which. */}
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full bg-neutral-100 dark:bg-white/10 [&_svg]:size-[18px]",
          isOut ? "text-red-600 dark:text-red-400" : "text-brand-600 dark:text-brand-400",
        )}
      >
        <ArrowRight className={isOut ? "-rotate-45" : "rotate-[135deg]"} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[0.9375rem] leading-snug font-medium">{title}</p>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {/* Beside a wide amount, "Transaction ID: …" only fits from 375px up;
              narrower phones (360px is common) get "ID: …". */}
          <span className="max-[375px]:hidden">Transaction </span>ID: {transaction.id}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{when}</p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-[0.9375rem] font-semibold whitespace-nowrap tabular-nums",
            isFailed && "text-neutral-400 line-through",
            !isFailed && isOut && "text-red-600 dark:text-red-400",
            !isFailed && sign === "+ " && "text-brand-600 dark:text-brand-400",
          )}
        >
          {sign}
          {amount}
        </p>
        {transaction.status !== "completed" && (
          <p
            className={cn(
              "mt-1 text-[0.6875rem] font-semibold",
              transaction.status === "pending"
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {transaction.status === "pending" ? "Pending" : "Failed"}
          </p>
        )}
      </div>
    </li>
  );
}
