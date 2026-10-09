"use client";

/**
 * A withdrawal's progress, after the user's third reference screen ("Your
 * withdrawal has…"), but honest about the steps: the team checks it first,
 * so it's Requested → Approved → Paid, never "Completed" straight away.
 *
 *                 (⟳ GH₵)                     ← icon
 *          Withdrawal requested               ← Approved, being paid / Paid / Cancelled
 *    GH₵ 500.00 to MTN MoMo · 024 ••• 4567
 *   ● Requested     7 Oct, 3:45 pm
 *   ◌ Approved      We're reviewing it
 *   ○ Paid          Within 3 working days
 *   Reference WD48291736 · Express · fee GH₵ 5.00
 *   (        Go to dashboard        )
 *            Cancel request                    ← only while just requested
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES, transactionReceiptHref } from "@/config/routes";
import { formatWhen } from "@/features/transactions/transactionFormat";
import { MOMO_NETWORKS } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { WITHDRAWAL_KIND_LABELS, WITHDRAWAL_RULES, type WithdrawalRequest } from "./withdrawalModel";
import { cancelWithdrawal, getWithdrawal, subscribeToWithdrawals } from "./withdrawalService";

/** How often to look for the next step while it's underway. */
const POLL_MS = 3000;

function useWithdrawal(id: string): WithdrawalRequest | null | undefined {
  const [withdrawal, setWithdrawal] = useState<WithdrawalRequest | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void getWithdrawal(id).then((latest) => {
        if (!cancelled) setWithdrawal(latest);
      });
    load();
    // TODO(api): a push from the server instead of asking every few seconds.
    const poll = window.setInterval(load, POLL_MS);
    const unsubscribe = subscribeToWithdrawals(load);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      unsubscribe();
    };
  }, [id]);
  return withdrawal;
}

const HEADLINES: Record<WithdrawalRequest["status"], string> = {
  requested: "Withdrawal requested",
  approved: "Approved, being paid",
  paid: "Withdrawal paid",
  rejected: "Withdrawal not approved",
  cancelled: "Withdrawal cancelled",
};


export function WithdrawalStatusScreen({ id }: { id: string }) {
  const router = useRouter();
  const withdrawal = useWithdrawal(id);
  const [isAskingToCancel, setIsAskingToCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No such request on this account: back to Withdraw.
  useEffect(() => {
    if (withdrawal === null) router.replace(ROUTES.withdraw);
  }, [withdrawal, router]);

  if (!withdrawal) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  const network = MOMO_NETWORKS[withdrawal.network].name;
  const isOver = withdrawal.status === "cancelled" || withdrawal.status === "rejected";
  const number = `0${withdrawal.phone.slice(0, 2)} ••• ${withdrawal.phone.slice(5)}`;

  const cancel = async () => {
    setIsCancelling(true);
    const result = await cancelWithdrawal(withdrawal.id);
    setIsCancelling(false);
    setIsAskingToCancel(false);
    if (!result.ok) setError(result.message);
  };

  const steps: { label: string; detail: string; state: "done" | "current" | "todo" }[] = [
    { label: "Requested", detail: formatWhen(withdrawal.createdAt), state: "done" },
    {
      label: "Approved",
      detail: withdrawal.approvedAt ? formatWhen(withdrawal.approvedAt) : "We're reviewing it",
      state: withdrawal.approvedAt ? "done" : "current",
    },
    {
      label: `Paid to ${network}`,
      detail: withdrawal.paidAt ? formatWhen(withdrawal.paidAt) : `Within ${WITHDRAWAL_RULES.processingDays} working days`,
      state: withdrawal.paidAt ? "done" : withdrawal.approvedAt ? "current" : "todo",
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="text-center" aria-live="polite">
        <WithdrawalIcon done={withdrawal.status === "paid"} muted={isOver} />
        <h1 className="mt-6 text-[1.75rem] leading-tight font-bold tracking-tight">{HEADLINES[withdrawal.status]}</h1>
        <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          <strong className={cn("font-semibold text-foreground", isOver && "line-through")}>
            {formatCedis(withdrawal.amount, { exact: true })}
          </strong>{" "}
          to {network} · {number}
        </p>
      </div>

      {isOver ? (
        <p className="mt-8 rounded-2xl bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-neutral-400">
          {withdrawal.status === "cancelled"
            ? "You cancelled this request. Nothing was taken from your wallet."
            : "This request wasn't approved, and nothing was taken from your wallet. Contact support to find out why."}
        </p>
      ) : (
        <ol className="mt-8 rounded-3xl bg-neutral-50 px-5 py-5 dark:bg-white/5">
          {steps.map((step, index) => (
            <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-7 bottom-1 left-[0.6875rem] w-0.5 rounded-full",
                    step.state === "done" ? "bg-brand-600" : "bg-neutral-200 dark:bg-white/15",
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative grid size-6 shrink-0 place-items-center rounded-full",
                  step.state === "done" && "bg-brand-700 text-white",
                  step.state === "current" && "bg-brand-50 ring-2 ring-brand-600 dark:bg-brand-500/15",
                  step.state === "todo" && "bg-neutral-200 dark:bg-white/15",
                )}
              >
                {step.state === "done" && <CheckIcon className="size-3.5" />}
                {step.state === "current" && <span className="size-2 animate-pulse rounded-full bg-brand-600" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-sm font-semibold", step.state === "todo" && "text-neutral-500")}>
                  {step.label}
                  <span className="sr-only">
                    {step.state === "done" ? ", done" : step.state === "current" ? ", in progress" : ", to come"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-center text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
        Ref {withdrawal.id} · {WITHDRAWAL_KIND_LABELS[withdrawal.kind]}
        {withdrawal.fee > 0 && ` · fee ${formatCedis(withdrawal.fee, { exact: true })}`}
      </p>

      <div className="mt-auto flex flex-col items-center gap-2 pt-10">
        <FormErrorMessage message={error} />
        {/* Paid: its receipt (Share / Download), as for a payment into a package. */}
        {withdrawal.status === "paid" && (
          <ButtonLink href={transactionReceiptHref(withdrawal.transactionId)} size="lg" fullWidth>
            View receipt
          </ButtonLink>
        )}
        <ButtonLink href={ROUTES.dashboard} variant="soft" size="lg" fullWidth>
          Go to dashboard
        </ButtonLink>
        {withdrawal.status === "requested" ? (
          <button
            type="button"
            onClick={() => setIsAskingToCancel(true)}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
          >
            Cancel request
          </button>
        ) : (
          <ButtonLink href={ROUTES.transactions} variant="ghost" size="md">
            View transactions
          </ButtonLink>
        )}
      </div>

      <ConfirmDialog
        open={isAskingToCancel}
        tone="danger"
        title="Cancel this withdrawal?"
        message="Nothing will be taken from your wallet. You can request it again any time."
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        isConfirming={isCancelling}
        onConfirm={cancel}
        onCancel={() => setIsAskingToCancel(false)}
      />
    </div>
  );
}

/** Money going round to the wallet (like the reference's icon), or a tick once paid. */
function WithdrawalIcon({ done, muted }: { done: boolean; muted: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mx-auto grid size-24 place-items-center rounded-full",
        muted ? "bg-neutral-100 text-neutral-500 dark:bg-white/10" : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
      )}
    >
      {done ? (
        <CheckIcon className="size-11" />
      ) : (
        <svg viewBox="0 0 48 48" className="size-14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 18a17 17 0 0 0-30-5M8 30a17 17 0 0 0 30 5" />
          <path d="M10 6v7h7M38 42v-7h-7" />
          <circle cx="24" cy="24" r="8.5" />
          <text x="24" y="27.6" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">
            ₵
          </text>
        </svg>
      )}
    </span>
  );
}
