"use client";

/**
 * Transactions tab: the history of the user's money, after the user's
 * "Account History" reference. Light-grey page, white list; dark-mode ready.
 *
 *   Transactions
 *   (All) (Investments) (Returns) (Withdrawals) (Referrals)   ← filters, scroll sideways
 *   ╭─────────────────────────────────────────────╮
 *   │ 🗂  Agribusiness Capital          GH₵ 5,000.00 │  ← investment: plain amount
 *   │     Investment                Today, 1:23 pm │     (when: under the amount)
 *   │ ↗  Agribusiness Capital        + GH₵ 240.00  │  ← return: green +
 *   │     Return paid           Yesterday, 9:00 am │
 *   │ ↓  Withdrawal (Pending)        − GH₵ 200.00  │  ← withdrawal: red −;
 *   │     To MTN MoMo              20 Oct, 2:23 pm │     status badge if not completed
 *   │ 🎁 Referral reward             + GH₵ 100.00  │
 *   │     100 points                18 Oct, 7:00 am │
 *   ╰─────────────────────────────────────────────╯
 *
 * Empty (per filter): a white card, "No transactions yet", and a button to
 * start investing (or to invite a friend, under Referrals).
 * Data: transactionsService (empty until investing and payments exist).
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseIcon, GiftIcon, PlusIcon, TrendUpIcon } from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ROUTES, transactionDetailsHref } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { REFERRAL_POINTS, REFERRAL_POINTS_LABEL, REFERRAL_REWARD_LABEL } from "@/features/referrals/referralService";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatWhen } from "./transactionFormat";
import type { Transaction, TransactionType } from "./transactionModel";
import { SampleDataNotice } from "./SampleData";
import { useTransactions } from "./useTransactions";

/** How each kind of transaction is shown. */
const TYPES: Record<
  TransactionType,
  { label: string; icon: React.ReactNode; direction: "in" | "out" | "into-package" }
> = {
  investment: { label: "Investment", icon: <BriefcaseIcon />, direction: "into-package" },
  return: { label: "Return paid", icon: <TrendUpIcon />, direction: "in" },
  withdrawal: { label: "Withdrawal", icon: <ArrowRight className="rotate-90" />, direction: "out" },
  referral: { label: "Referral reward", icon: <GiftIcon />, direction: "in" },
};

/** The filters, and what each shows when it has nothing. */
const FILTERS = [
  {
    id: "all",
    label: "All",
    emptyTitle: "No transactions yet",
    emptyText: "Your investments, returns and withdrawals will show here.",
  },
  {
    id: "investment",
    label: "Investments",
    emptyTitle: "No investments yet",
    emptyText: "Choose a portfolio to make your first investment.",
  },
  {
    id: "return",
    label: "Returns",
    emptyTitle: "No returns yet",
    emptyText: "Profit paid on your investments will show here.",
  },
  {
    id: "withdrawal",
    label: "Withdrawals",
    emptyTitle: "No withdrawals yet",
    emptyText: "Money you withdraw to Mobile Money or your bank will show here.",
  },
  {
    id: "referral",
    label: "Referrals",
    emptyTitle: "No referral rewards yet",
    emptyText: `Earn ${REFERRAL_POINTS_LABEL} (${REFERRAL_REWARD_LABEL}) for every friend who signs up.`,
  },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

export function TransactionsScreen() {
  useStatusBarColor(GREY_PAGE_COLORS);
  /** null while loading. */
  const transactions = useTransactions();
  const [filterId, setFilterId] = useState<FilterId>("all");

  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];
  const shown =
    transactions?.filter((transaction) => filterId === "all" || transaction.type === filterId) ?? [];

  return (
    <main
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-100 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] dark:bg-background",
        appTabBarPadding,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Transactions</h1>
        {/* All of this as a document (PDF / Excel) for any period. */}
        <Link
          href={ROUTES.statements}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[0.8125rem] font-semibold text-brand-700 transition-colors hover:bg-white/70 dark:bg-white/10 dark:text-brand-400 dark:hover:bg-white/15"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" />
          </svg>
          Statement
        </Link>
      </div>

      <div className="mt-3 empty:hidden">
        <SampleDataNotice transactions={transactions} />
      </div>

      {/* Filters: one row that scrolls sideways on narrow phones. */}
      <div
        role="group"
        aria-label="Show"
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map((item) => {
          const isActive = item.id === filterId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilterId(item.id)}
              className={cn(
                "h-9 shrink-0 cursor-pointer rounded-full px-4 text-[0.8125rem] font-medium transition-colors",
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {transactions === null ? (
        <LoadingList />
      ) : shown.length > 0 ? (
        <ul className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-3xl bg-white px-4 dark:divide-white/10 dark:bg-white/5">
          {shown.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={filter.emptyTitle}
          text={filter.emptyText}
          action={
            filterId === "referral"
              ? { label: "Invite a friend", href: ROUTES.refer, icon: <GiftIcon /> }
              : { label: "Start investing", href: ROUTES.invest, icon: <PlusIcon /> }
          }
        />
      )}

      <AppTabBar />
    </main>
  );
}

/** One transaction: icon, what happened (and the package), when, and the amount. */
function TransactionRow({ transaction }: { transaction: Transaction }) {
  const type = TYPES[transaction.type];
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  const when = formatWhen(transaction.createdAt);

  // Investments and returns are titled by their package; the rest by what they are.
  const title = pkg ? pkg.name : type.label;
  const breakdown = transaction.breakdown;
  const detail =
    transaction.type === "withdrawal"
      ? transaction.channel
        ? `To ${transaction.channel}`
        : "To your account"
      : transaction.type === "referral"
        ? `${REFERRAL_POINTS} points`
        : breakdown
          ? // How a return was worked out: rate × months, less the fee.
            `(${breakdown.monthlyRatePercent}% − ${breakdown.feePercent}% fee) × ${breakdown.months} mo`
          : type.label;

  const amount = formatCedis(transaction.amount, { exact: true });
  const isFailed = transaction.status === "failed";

  return (
    // Tapping opens the transaction's details. Generous row spacing, so each
    // transaction reads on its own.
    <li>
      <Link
        href={transactionDetailsHref(transaction.id)}
        className="-mx-4 flex items-center gap-4 px-4 py-5 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
      aria-label={`${title}, ${
        breakdown
          ? `return: ${formatCedis(breakdown.principal, { exact: true })} at ${breakdown.monthlyRatePercent}% a month for ${breakdown.months} ${breakdown.months === 1 ? "month" : "months"} is ${formatCedis(breakdown.grossProfit, { exact: true })}, less a ${breakdown.feePercent}% fee of ${formatCedis(breakdown.fee, { exact: true })}`
          : detail
      }, ${amount}, ${when}${transaction.status === "completed" ? "" : `, ${transaction.status}`}. Reference ${transaction.id}.`}
    >
      <span aria-hidden className="shrink-0 text-neutral-500 dark:text-neutral-400 [&_svg]:size-5">
        {type.icon}
      </span>
      {/* Left: what and which package. Right: how much and when (amounts are wide,
          so the time sits under the amount rather than getting cut off). */}
      <div aria-hidden className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className="truncate text-[0.9375rem] font-semibold">{title}</span>
          {transaction.status !== "completed" && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] leading-none font-semibold",
                transaction.status === "pending"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
              )}
            >
              {transaction.status === "pending" ? "Pending" : "Failed"}
            </span>
          )}
        </p>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">{detail}</p>
      </div>
      <div aria-hidden className="shrink-0 text-right">
        <p
          className={cn(
            "text-[0.9375rem] font-semibold whitespace-nowrap tabular-nums",
            isFailed && "text-neutral-500 line-through",
            !isFailed && type.direction === "in" && "text-brand-700 dark:text-brand-400",
            !isFailed && type.direction === "out" && "text-red-600 dark:text-red-400",
          )}
        >
          {type.direction === "in" ? "+ " : type.direction === "out" ? "− " : ""}
          {amount}
        </p>
        <p className="mt-1 text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400">{when}</p>
      </div>
      </Link>
    </li>
  );
}

/** Placeholder rows while the list loads. */
function LoadingList() {
  return (
    <ul aria-busy="true" aria-label="Loading transactions" className="mt-4 rounded-3xl bg-white px-4 dark:bg-white/5">
      {[0, 1, 2].map((index) => (
        <li key={index} className="flex animate-pulse items-center gap-4 py-5 motion-reduce:animate-none">
          <span className="size-5 rounded-md bg-neutral-200 dark:bg-white/10" />
          <span className="flex-1">
            <span className="block h-3.5 w-2/5 rounded bg-neutral-200 dark:bg-white/10" />
            <span className="mt-2 block h-3 w-3/5 rounded bg-neutral-100 dark:bg-white/5" />
          </span>
          <span className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-white/10" />
        </li>
      ))}
    </ul>
  );
}

/** Nothing to show (for this filter): a white card filling the space, with a next step. */
function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action: { label: string; href: string; icon: React.ReactNode };
}) {
  return (
    <section className="mt-4 mb-4 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white px-6 py-14 text-center dark:bg-white/5">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{text}</p>
      <Link
        href={action.href}
        className="mt-6 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-neutral-900 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 [&_svg]:size-[18px]"
      >
        {action.icon}
        {action.label}
      </Link>
    </section>
  );
}
