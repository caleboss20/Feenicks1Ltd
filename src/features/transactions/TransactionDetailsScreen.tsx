"use client";

/**
 * Transaction details: the receipt for one transaction, opened from
 * Transactions or the dashboard's Recent activity. White page (black in dark
 * mode), plain words.
 *
 *   ←          TRANSACTION DETAILS
 *                  (↙)
 *            + GH₵ 158.40               ← green in, red out; struck through if failed
 *     Return from InvestWise Capital
 *              [ Completed ]            ← green / amber (Pending) / red (Failed)
 *
 *   Date               22 Sept 2026, 9:01 am
 *   Reference          SMP1182137    Copy
 *   Type               Return
 *   Package            InvestWise Capital (IC)
 *   To / From          MTN MoMo         ← withdrawals / investments
 *
 *   HOW IT WAS WORKED OUT                ← returns: the calculation, line by line
 *   Amount invested            GH₵ 2,200.00
 *   Monthly return                     7.5%
 *   …
 *   Paid to you                  GH₵ 158.40
 *
 *   PROGRESS                             ← withdrawals and investments
 *   ✓ Requested · 30 Sept, 11:02 pm
 *   ◷ Processing
 *   ○ Paid to MTN MoMo
 *
 *   (           View receipt           )   ← completed: Share / Download
 *   Need help with this transaction?     ← Send a message, this one picked
 *
 * Honest by design: the only time shown in Progress is when it was made (the
 * app doesn't record when each later step happened, so it doesn't invent one).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckIcon, ClockIcon, CloseIcon, CopyIcon } from "@/components/icons";
import { ROUTES, supportMessageAboutHref, transactionReceiptHref } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { REFERRAL_POINTS_LABEL } from "@/features/referrals/referralService";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { transactionTitle } from "./transactionFormat";
import type { Transaction } from "./transactionModel";
import { isSampleTransaction } from "./transactionsService";
import { useTransactions } from "./useTransactions";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

const TYPE_LABELS: Record<Transaction["type"], string> = {
  investment: "Investment",
  return: "Return",
  withdrawal: "Withdrawal",
  referral: "Referral reward",
};

const STATUS_LABELS: Record<Transaction["status"], string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

/** "22 Sept 2026, 9:01 am". */
function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionDetailsScreen({ id }: { id: string }) {
  useStatusBarColor(PAGE_COLORS);
  const router = useRouter();
  const transactions = useTransactions();
  const transaction = transactions?.find((item) => item.id === id) ?? null;

  /** Back where they came from (Home or Transactions); Transactions if they landed here directly. */
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.transactions));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="-mx-2 grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-center text-sm font-semibold tracking-[0.12em] uppercase">Transaction details</h1>
      </header>

      {transactions === null ? null : transaction ? (
        <Receipt transaction={transaction} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
          <p className="text-lg font-semibold">Transaction not found</p>
          <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            It may have been removed. You can see all your transactions in Transactions.
          </p>
          <Link
            href={ROUTES.transactions}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Go to Transactions
          </Link>
        </div>
      )}
    </div>
  );
}

function Receipt({ transaction }: { transaction: Transaction }) {
  const isOut = transaction.type === "withdrawal";
  const isFailed = transaction.status === "failed";
  // Investments add to the portfolio but aren't income: no "+" (as in the lists).
  const sign = isOut ? "− " : transaction.type === "investment" ? "" : "+ ";
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  const breakdown = transaction.breakdown;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Date", value: fullDate(transaction.createdAt) },
    { label: "Reference", value: <CopyableReference id={transaction.id} /> },
    { label: "Type", value: TYPE_LABELS[transaction.type] },
    ...(pkg ? [{ label: "Portfolio", value: `${pkg.name} (${pkg.ticker})` }] : []),
    // "To" / "From", not "Paid to": a pending or failed one hasn't been paid.
    ...(transaction.channel ? [{ label: isOut ? "To" : "From", value: transaction.channel }] : []),
    ...(transaction.type === "referral" ? [{ label: "Reward", value: REFERRAL_POINTS_LABEL }] : []),
  ];

  return (
    <>
      {/* ── The amount and what it was ── */}
      <section aria-label="Summary" className="mt-6 flex flex-col items-center text-center">
        <span
          aria-hidden
          className={cn(
            "grid size-14 place-items-center rounded-full bg-neutral-100 dark:bg-white/10 [&_svg]:size-6",
            isOut ? "text-red-600 dark:text-red-400" : "text-brand-600 dark:text-brand-400",
          )}
        >
          <ArrowRight className={isOut ? "-rotate-45" : "rotate-[135deg]"} />
        </span>
        <p
          className={cn(
            "mt-4 text-[2rem] leading-none font-bold tracking-tight tabular-nums",
            isFailed && "text-neutral-400 line-through",
            !isFailed && isOut && "text-red-600 dark:text-red-400",
            !isFailed && sign === "+ " && "text-brand-600 dark:text-brand-400",
          )}
        >
          {sign}
          {formatCedis(transaction.amount, { exact: true })}
        </p>
        <p className="mt-2.5 text-[0.9375rem] font-medium">{transactionTitle(transaction)}</p>
        <span
          className={cn(
            "mt-3 rounded-full px-3 py-1 text-xs font-semibold",
            transaction.status === "completed" && "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
            transaction.status === "pending" && "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
            isFailed && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
          )}
        >
          {STATUS_LABELS[transaction.status]}
        </span>
        {isSampleTransaction(transaction) && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            Sample data (demo): not a real transaction.
          </p>
        )}
      </section>

      {/* ── The details ── */}
      <dl className="mt-8 border-t border-neutral-100 dark:border-white/10">
        {details.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-6 border-b border-neutral-100 py-3.5 dark:border-white/10"
          >
            <dt className="text-sm text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            <dd className="text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {/* ── Returns: how the amount was worked out ── */}
      {breakdown && (
        <section aria-labelledby="calculation-title" className="mt-8">
          <h2 id="calculation-title" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            How it was worked out
          </h2>
          <dl className="mt-2">
            {[
              { label: "Amount invested", value: formatCedis(breakdown.principal, { exact: true }) },
              { label: "Monthly return", value: `${breakdown.monthlyRatePercent}%` },
              { label: "Months", value: String(breakdown.months) },
              { label: "Profit before fee", value: formatCedis(breakdown.grossProfit, { exact: true }) },
              {
                label: `Management fee (${breakdown.feePercent}% a month)`,
                value: `− ${formatCedis(breakdown.fee, { exact: true })}`,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-6 py-2">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">{row.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-6 border-t border-neutral-100 pt-3 dark:border-white/10">
              <dt className="text-sm font-semibold">Paid to you</dt>
              <dd className="text-sm font-bold tabular-nums">{formatCedis(transaction.amount, { exact: true })}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* ── Withdrawals and investments: where it's up to ── */}
      {(transaction.type === "withdrawal" || transaction.type === "investment") && (
        <Progress transaction={transaction} />
      )}

      {/* Completed: its receipt, to share or download. */}
      {transaction.status === "completed" && (
        <Link
          href={transactionReceiptHref(transaction.id)}
          className="mt-10 flex h-12 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          View receipt
        </Link>
      )}

      <Link
        href={supportMessageAboutHref(transaction.id)}
        className={cn(transaction.status === "completed" ? "mt-3" : "mt-10", "flex h-12 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold transition-colors hover:bg-neutral-50 dark:border-white/15 dark:hover:bg-white/5",
        )}
      >
        Need help with this transaction?
      </Link>
    </>
  );
}

/** The reference, with a Copy button (to quote it to support). */
function CopyableReference({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the reference is still there to read.
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">{id}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Reference copied" : "Copy reference"}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10"
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

/**
 * Where a withdrawal or investment is up to. Only the first step has a time
 * (when it was made); later steps show their state, not invented times.
 */
function Progress({ transaction }: { transaction: Transaction }) {
  const isOut = transaction.type === "withdrawal";
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  const destination = isOut
    ? `Paid to ${transaction.channel ?? "your account"}`
    : `Invested in ${pkg?.name ?? "your portfolio"}`;

  type Step = { label: string; detail?: string; state: "done" | "current" | "failed" | "todo" };
  const steps: Step[] =
    transaction.status === "failed"
      ? [
          { label: isOut ? "Requested" : "Payment started", detail: fullDate(transaction.createdAt), state: "done" },
          {
            label: isOut ? "Withdrawal failed" : "Payment failed",
            detail: isOut
              ? "No money left your portfolio. Check your MoMo or bank details and try again."
              : "No money was taken. You can try again.",
            state: "failed",
          },
        ]
      : [
          { label: isOut ? "Requested" : "Payment started", detail: fullDate(transaction.createdAt), state: "done" },
          {
            label: isOut ? "Processing" : "Payment confirmed",
            detail: transaction.status === "pending" ? "In progress" : undefined,
            state: transaction.status === "pending" ? "current" : "done",
          },
          { label: destination, state: transaction.status === "completed" ? "done" : "todo" },
        ];

  return (
    <section aria-labelledby="progress-title" className="mt-8">
      <h2 id="progress-title" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
        Progress
      </h2>
      <ol className="mt-3">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {/* The line joining the steps. */}
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute top-7 bottom-0 left-[0.6875rem] w-px bg-neutral-200 dark:bg-white/15" />
            )}
            <span
              aria-hidden
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3.5",
                step.state === "done" && "bg-brand-600 text-white dark:bg-brand-500",
                step.state === "current" && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                step.state === "failed" && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
                step.state === "todo" && "border-2 border-neutral-200 dark:border-white/20",
              )}
            >
              {step.state === "done" ? <CheckIcon /> : step.state === "current" ? <ClockIcon /> : step.state === "failed" ? <CloseIcon /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "todo" && "text-neutral-400",
                  step.state === "failed" && "text-red-700 dark:text-red-300",
                )}
              >
                <span className="sr-only">
                  {step.state === "done" ? "Done: " : step.state === "current" ? "In progress: " : step.state === "failed" ? "Failed: " : "Not yet: "}
                </span>
                {step.label}
              </p>
              {step.detail && (
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{step.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
