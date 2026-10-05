"use client";

/**
 * Approve payment: after Pay on the confirm sheet, while the Mobile Money
 * prompt is on their phone. Same grey page and white cards as the amount
 * screen.
 *
 *                 Approve payment
 *                  ╭─────────╮
 *                 │   1:48    │        ← ring empties over the 2 minutes
 *                 │ to approve│
 *                  ╰─────────╯
 *              Check your phone
 *   We've sent a request for GH₵ 1,500.00 to MTN MoMo 024 123 4567.
 *   ╭─────────────────────────────────────────╮
 *   │ ① Look for the MTN MoMo prompt…          │
 *   │ ② Enter your MoMo PIN in it to approve   │
 *   │ ③ Come back here: this screen updates     │
 *   ╰─────────────────────────────────────────╯
 *   (          Resend request in 0:24          )   ← after 30 s
 *                 Cancel payment
 *     🔒 Feenicks1 never asks for your MoMo PIN.
 *
 * Then, by the payment's status (paymentService):
 *   approved                       → its receipt ("Payment successful",
 *                                    Share / Download: ReceiptScreen)
 *   declined / expired / cancelled → "Payment not completed" (below), with
 *                                    Try again (same amount and network).
 *
 * Their MoMo PIN is typed only into the network's prompt on their phone,
 * never into this app; the screen says so, so a fake "enter your PIN" page
 * elsewhere stands out.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, LockIcon, ShieldCheckIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { IS_DEMO_MODE } from "@/config/demoMode";
import { investAmountHref } from "@/config/investingFlow";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { investPaymentHref, ROUTES, transactionReceiptHref } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { formatLocalNumber, MOMO_NETWORKS } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  APPROVAL_WINDOW_MS,
  PAYMENT_POLL_MS,
  RESEND_AFTER_MS,
  type MomoPayment,
  type UnfinishedPaymentStatus,
} from "./paymentModel";
import {
  cancelPayment,
  getPayment,
  requestMomoPayment,
  resendPaymentRequest,
  subscribeToPayments,
} from "./paymentService";

const PAGE = "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-100 px-4 dark:bg-background";
const CARD = "rounded-3xl bg-white dark:bg-white/5";

/** The payment, kept up to date while it waits: undefined while loading, null if there's no such payment. */
function usePayment(id: string): MomoPayment | null | undefined {
  const [payment, setPayment] = useState<MomoPayment | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // TODO(api): also listen for a push (server-sent event) instead of only asking every 2 s.
    const poll = window.setInterval(() => load(), PAYMENT_POLL_MS);
    function load() {
      void getPayment(id).then((latest) => {
        if (cancelled) return;
        setPayment(latest);
        // It's over (approved, declined…): nothing more to wait for.
        if (latest?.status !== "pending") window.clearInterval(poll);
      });
    }
    load();
    const unsubscribe = subscribeToPayments(load);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      unsubscribe();
    };
  }, [id]);

  return payment;
}

/** The current time, every second (for the countdowns). */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** 108_000 → "1:48". */
function minutesAndSeconds(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MomoApprovalScreen({ paymentId }: { paymentId: string }) {
  useStatusBarColor(GREY_PAGE_COLORS);
  const router = useRouter();
  const payment = usePayment(paymentId);

  // Approved: on to the receipt. No such payment: back to Invest.
  const transactionId = payment?.status === "approved" ? payment.transactionId : undefined;
  useEffect(() => {
    if (payment === null) router.replace(ROUTES.invest);
    else if (transactionId) router.replace(transactionReceiptHref(transactionId, { isNewPayment: true }));
  }, [payment, transactionId, router]);

  if (!payment || payment.status === "approved") {
    return (
      <div className={cn(PAGE, "items-center justify-center")}>
        <LoadingSpinner label={payment ? "Opening your receipt" : "Loading"} />
      </div>
    );
  }
  if (payment.status === "pending") return <WaitingForApproval payment={payment} />;
  return <PaymentNotCompleted payment={payment} status={payment.status} />;
}

/* ── Waiting for approval ───────────────────────────────────────────── */

function WaitingForApproval({ payment }: { payment: MomoPayment }) {
  const now = useNow();
  const [isResending, setIsResending] = useState(false);
  const [isAskingToCancel, setIsAskingToCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = MOMO_NETWORKS[payment.network];
  const remaining = Math.max(0, Date.parse(payment.expiresAt) - now);
  const resendIn = Math.max(0, Date.parse(payment.sentAt) + RESEND_AFTER_MS - now);

  const resend = async () => {
    setError(null);
    setIsResending(true);
    const result = await resendPaymentRequest(payment.id);
    setIsResending(false);
    if (!result.ok) setError(result.message);
  };

  const cancel = async () => {
    setIsCancelling(true);
    const result = await cancelPayment(payment.id);
    // The screen switches to "not completed" by itself (the payment changed).
    setIsCancelling(false);
    setIsAskingToCancel(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className={cn(PAGE, "pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]")}>
      <header className="flex h-11 items-center justify-center">
        <h1 className="text-base font-semibold">Approve payment</h1>
      </header>

      <CountdownRing remaining={remaining} className="mt-6" />

      <div className="mt-6 text-center">
        <h2 className="text-[1.375rem] leading-tight font-semibold tracking-tight">Check your phone</h2>
        <p className="mx-auto mt-2.5 max-w-[20rem] text-[0.9375rem] leading-relaxed text-neutral-600 dark:text-neutral-400">
          We&apos;ve sent a request for{" "}
          <strong className="font-semibold whitespace-nowrap text-foreground">
            {formatCedis(payment.amount + payment.fee, { exact: true })}
          </strong>{" "}
          to{" "}
          <strong className="font-semibold whitespace-nowrap text-foreground">
            {network.name} {formatLocalNumber(payment.phone)}
          </strong>
          .
        </p>
      </div>

      <ol className={cn(CARD, "mt-5 flex flex-col gap-3 px-5 py-4")}>
        {[
          `Look for the ${network.name} prompt on your phone.`,
          "Enter your MoMo PIN in the prompt to approve.",
          "Come back here. This screen updates by itself.",
        ].map((step, index) => (
          <li key={step} className="flex items-start gap-3.5 text-sm leading-snug">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      {IS_DEMO_MODE && (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Test mode: no real prompt. It approves by itself in a few seconds.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <FormErrorMessage message={error} />
        <Button
          variant="soft"
          size="lg"
          fullWidth
          onClick={resend}
          disabled={resendIn > 0}
          isLoading={isResending}
          loadingLabel="Sending the request again"
        >
          <span className="tabular-nums">
            {resendIn > 0 ? `Resend request in ${minutesAndSeconds(resendIn)}` : "Resend request"}
          </span>
        </Button>
        <button
          type="button"
          onClick={() => setIsAskingToCancel(true)}
          className="mx-auto cursor-pointer px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
        >
          Cancel payment
        </button>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <LockIcon className="size-3.5" />
          Feenicks1 never asks for your MoMo PIN in the app.
        </p>
      </div>

      <ConfirmDialog
        open={isAskingToCancel}
        tone="danger"
        icon={<CloseIcon />}
        title="Cancel this payment?"
        message="If the prompt is still on your phone, just ignore it. No money will be taken."
        confirmLabel="Cancel payment"
        cancelLabel="Keep waiting"
        isConfirming={isCancelling}
        onConfirm={cancel}
        onCancel={() => setIsAskingToCancel(false)}
      />
    </div>
  );
}

/**
 * The time left to approve, as a ring that empties (2 minutes → 0) around
 * the countdown, on a softly pulsing halo: something is happening.
 */
function CountdownRing({ remaining, className }: { remaining: number; className?: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const left = Math.min(1, remaining / APPROVAL_WINDOW_MS);

  return (
    <div className={cn("relative mx-auto grid size-40 place-items-center", className)}>
      <span
        aria-hidden
        className="absolute inset-0 animate-pulse rounded-full bg-brand-500/10 motion-reduce:animate-none dark:bg-brand-500/15"
      />
      <svg aria-hidden viewBox="0 0 120 120" className="absolute inset-3 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="5" className="stroke-white dark:stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - left)}
          className="stroke-brand-600 transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none dark:stroke-brand-500"
        />
      </svg>
      <p className="relative text-center" role="timer" aria-live="off">
        <span className="block text-[2.25rem] leading-none font-semibold tracking-tight tabular-nums">
          {minutesAndSeconds(remaining)}
        </span>
        <span className="mt-1.5 block text-xs text-neutral-500 dark:text-neutral-400">to approve</span>
      </p>
    </div>
  );
}

/* ── Not completed ──────────────────────────────────────────────────── */

const NOT_COMPLETED: Record<UnfinishedPaymentStatus, { label: string; reason: string; reassurance: string }> = {
  declined: {
    label: "Declined",
    reason: "The payment was declined on your phone, or the PIN wasn't accepted.",
    reassurance: "No money was taken from your wallet.",
  },
  expired: {
    label: "Timed out",
    reason: "The request wasn't approved in time, so it was stopped.",
    reassurance: "No money was taken from your wallet.",
  },
  cancelled: {
    label: "Cancelled",
    reason: "You cancelled this payment.",
    reassurance: "If the prompt is still on your phone, ignore it. No money will be taken.",
  },
};

function PaymentNotCompleted({ payment, status }: { payment: MomoPayment; status: UnfinishedPaymentStatus }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const pkg = INVESTMENT_PACKAGES[payment.packageId];
  const network = MOMO_NETWORKS[payment.network];
  const copy = NOT_COMPLETED[status];

  // The screen changed under them: move screen readers (and focus) to the news.
  useEffect(() => headingRef.current?.focus(), []);

  /** A new request: same package, amount and network. */
  const tryAgain = async () => {
    setError(null);
    setIsRetrying(true);
    const result = await requestMomoPayment({
      packageId: payment.packageId,
      amount: payment.amount,
      network: payment.network,
    });
    if (!result.ok) {
      setError(result.message);
      setIsRetrying(false);
      return;
    }
    router.replace(investPaymentHref(result.payment.id));
  };

  const rows = [
    { label: "Amount", value: formatCedis(payment.amount + payment.fee, { exact: true }) },
    { label: "To", value: pkg.name },
    { label: "From", value: `${network.name} · ${formatLocalNumber(payment.phone)}` },
    { label: "Status", value: copy.label },
  ];

  return (
    <div className={cn(PAGE, "pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]")}>
      <div className="text-center">
        <span
          aria-hidden
          className="mx-auto grid size-20 animate-pop-in place-items-center rounded-full bg-red-50 text-red-600 motion-reduce:animate-none dark:bg-red-500/10 dark:text-red-400"
        >
          <CloseIcon className="size-9" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-[1.625rem] leading-tight font-semibold tracking-tight outline-none"
        >
          Payment not completed
        </h1>
        <p className="mx-auto mt-2.5 max-w-[20rem] text-[0.9375rem] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {copy.reason}
        </p>
      </div>

      <dl className={cn(CARD, "mt-8 px-5")}>
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-4 py-3.5 text-sm",
              index > 0 && "border-t border-neutral-100 dark:border-white/10",
            )}
          >
            <dt className="text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            <dd
              className={cn(
                "text-right font-medium tabular-nums",
                row.label === "Status" && "text-red-600 dark:text-red-400",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-snug text-brand-800 dark:bg-brand-500/10 dark:text-brand-300">
        <ShieldCheckIcon className="mt-px size-[18px]" />
        {copy.reassurance}
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <FormErrorMessage message={error} />
        <Button size="lg" fullWidth onClick={tryAgain} isLoading={isRetrying} loadingLabel="Sending a new request">
          Try again
        </Button>
        <ButtonLink href={investAmountHref(payment.packageId)} variant="soft" size="lg" fullWidth>
          Change amount
        </ButtonLink>
      </div>
    </div>
  );
}
