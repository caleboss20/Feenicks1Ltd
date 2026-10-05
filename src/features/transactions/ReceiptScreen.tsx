"use client";

/**
 * Transaction receipt: opens by itself once a Mobile Money payment is
 * approved, and from a completed transaction's details (View receipt).
 * After the user's "Transaction Receipts" reference, in our type and green.
 *
 *   ←            Transaction receipt            🎧   ← help with this one
 *                      (✓)
 *                 GH₵ 1,500.00
 *              Payment successful
 *     [ Invested in InvestWise Capital (IC) ]       ← their package, up top
 *            5 Oct 2026, at 3:45 PM
 *   ╭──────────────────── ▬ ────────────────────╮   ← white panel
 *   │ Investment details                     (⌄) │   ← each section folds
 *   │ Package           InvestWise Capital (IC) │
 *   │ Type                      First investment │
 *   │ Expected return              5–10% a month │
 *   │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 *   │ Payment details                        (⌄) │
 *   │ Transaction ID                  ⧉ FX4991600 │
 *   │ Paid from        MTN MoMo · 024 123 4567  │
 *   │ Fee                                 No fee │
 *   │ Total paid                    GH₵ 1,500.00 │
 *   │ (    Share    )  (     Download     )      │   ← a PNG of the receipt
 *   ╰────────────────────────────────────────────╯
 *
 * Only for completed transactions; anything else shows its details instead.
 * Download saves the image (receiptImage); Share sends it (WhatsApp…) where
 * the phone can share files, else the text, else copies the text.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDownIcon, CopyIcon, SupportIcon } from "@/components/icons";
import { AnimatedCheck } from "@/components/ui/AnimatedCheck";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ROUTES, supportMessageAboutHref, transactionDetailsHref } from "@/config/routes";
import type { MomoPayment } from "@/features/payments/paymentModel";
import { getPaymentForTransaction } from "@/features/payments/paymentService";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { CEDI_SYMBOL, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { receiptDetails, receiptText, type ReceiptDetails, type ReceiptSection } from "./receiptDetails";
import { receiptImage } from "./receiptImage";
import { useTransactions } from "./useTransactions";

/** The payment behind a transaction: undefined while it loads. */
function usePaymentFor(transactionId: string): MomoPayment | null | undefined {
  const [payment, setPayment] = useState<MomoPayment | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    void getPaymentForTransaction(transactionId).then((found) => {
      if (!cancelled) setPayment(found);
    });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);
  return payment;
}

export function ReceiptScreen({ id, isNewPayment }: { id: string; isNewPayment: boolean }) {
  useStatusBarColor(GREY_PAGE_COLORS);
  const router = useRouter();
  const transactions = useTransactions();
  const payment = usePaymentFor(id);
  const transaction = transactions?.find((item) => item.id === id) ?? null;
  const isLoading = transactions === null || payment === undefined;

  // Not (yet) completed, or unknown: its details page says what's going on.
  const hasReceipt = transaction?.status === "completed";
  useEffect(() => {
    if (!isLoading && !hasReceipt) router.replace(transactionDetailsHref(id));
  }, [isLoading, hasReceipt, id, router]);

  /** Just paid: Back goes home (not back into the payment). Otherwise, where they came from. */
  const goBack = () => {
    if (isNewPayment) router.replace(ROUTES.dashboard);
    else if (window.history.length > 1) router.back();
    else router.push(transactionDetailsHref(id));
  };

  if (isLoading || !transaction || !hasReceipt) {
    return (
      <div className="mx-auto grid min-h-dvh w-full max-w-md place-items-center bg-neutral-100 dark:bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  const details = receiptDetails(transaction, payment ?? null, transactions ?? []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-100 pt-[max(0.75rem,env(safe-area-inset-top))] dark:bg-background">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-3">
        <button
          type="button"
          onClick={goBack}
          aria-label={isNewPayment ? "Done, back to Home" : "Back"}
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-center text-[0.9375rem] font-semibold">Transaction receipt</h1>
        <Link
          href={supportMessageAboutHref(transaction.id)}
          aria-label="Help with this transaction"
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <SupportIcon className="size-5" />
        </Link>
      </header>

      {/* The outcome, big. */}
      <section className="px-6 pt-5 pb-8 text-center" aria-live="polite">
        <AnimatedCheck className="mx-auto size-16" />
        <p className="mt-4 flex items-start justify-center gap-1 font-semibold tracking-tight tabular-nums">
          <span className="mt-1 text-base text-neutral-500 dark:text-neutral-400">{CEDI_SYMBOL}</span>
          <span className="text-[2.125rem] leading-none">{formatCedisNumber(details.total, { exact: true })}</span>
        </p>
        <p className="mt-2.5 text-[0.9375rem] font-semibold">{details.headline}</p>
        {/* Which package the money went into (or came from), never just "a package". */}
        {details.packageLine && (
          <p className="mx-auto mt-2.5 w-fit max-w-full rounded-full bg-brand-50 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
            {details.packageLine}
          </p>
        )}
        <p className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">{details.when}</p>
      </section>

      {/* The details, on a white panel that rises to the bottom of the screen. */}
      <div className="flex flex-1 flex-col rounded-t-[2rem] bg-white px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-neutral-900">
        <span aria-hidden className="mx-auto block h-1.5 w-10 rounded-full bg-neutral-200 dark:bg-white/15" />
        <div className="mt-3">
          {details.sections.map((section) => (
            <ReceiptSectionBlock key={section.title} section={section} />
          ))}
        </div>
        <ReceiptActions details={details} reference={transaction.id} />
        {isNewPayment && (
          <Link
            href={ROUTES.dashboard}
            replace
            className="mx-auto mt-4 px-4 py-2 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400"
          >
            Back to Home
          </Link>
        )}
      </div>
    </div>
  );
}

/** One section: its title folds it open and shut; a dashed rule below, like a paper receipt. */
function ReceiptSectionBlock({ section }: { section: ReceiptSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const listId = `receipt-${section.title.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <section className="border-b border-dashed border-neutral-300 py-4 dark:border-white/15">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
      >
        <h2 className="text-[0.9375rem] font-semibold">{section.title}</h2>
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full ring-1 ring-neutral-300 dark:ring-white/20"
        >
          <ChevronDownIcon className={cn("size-3.5 transition-transform", !isOpen && "-rotate-90")} />
        </span>
      </button>
      {isOpen && (
        <dl id={listId} className="mt-3 flex flex-col gap-3">
          {section.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 text-[0.8125rem]">
              <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">{row.label}</dt>
              <dd
                className={cn(
                  "min-w-0 text-right font-medium tabular-nums",
                  row.isTotal && "text-[0.9375rem] font-semibold",
                )}
              >
                {row.isReference ? <CopyableReference value={row.value} /> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** The reference with a copy button in front, as in the reference design. */
function CopyableReference({ value }: { value: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard blocked: the reference is on screen to copy by hand.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={isCopied ? "Copied" : `Copy transaction ID ${value}`}
      className="inline-flex cursor-pointer items-center gap-1.5 font-medium"
    >
      <CopyIcon className="size-3.5 text-neutral-500" />
      {isCopied ? <span className="text-brand-700 dark:text-brand-400">Copied</span> : value}
    </button>
  );
}

/** Share and Download: the receipt as an image (made on the phone, nothing uploaded). */
function ReceiptActions({ details, reference }: { details: ReceiptDetails; reference: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileName = `Feenicks1-receipt-${reference}.png`;

  const download = async () => {
    setIsBusy(true);
    try {
      const url = URL.createObjectURL(await receiptImage(details));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus("Receipt saved to your downloads.");
    } catch {
      setStatus("Couldn't save the receipt. Please try again.");
    }
    setIsBusy(false);
  };

  const share = async () => {
    setIsBusy(true);
    const title = `Feenicks1 receipt ${reference}`;
    try {
      const file = new File([await receiptImage(details)], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else if (navigator.share) {
        await navigator.share({ title, text: receiptText(details) });
      } else {
        await navigator.clipboard.writeText(receiptText(details));
        setStatus("Receipt copied. Paste it anywhere to share.");
      }
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("Couldn't share the receipt. Try Download instead.");
      }
    }
    setIsBusy(false);
  };

  const button =
    "flex h-13 flex-1 cursor-pointer items-center justify-center rounded-full text-[0.9375rem] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";

  return (
    <div className="mt-auto pt-8">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={share}
          disabled={isBusy}
          className={cn(
            button,
            "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
          )}
        >
          Share
        </button>
        <button
          type="button"
          onClick={download}
          disabled={isBusy}
          className={cn(button, "bg-brand-600 text-white hover:bg-brand-700")}
        >
          Download
        </button>
      </div>
      <p role="status" className="mt-3 min-h-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {status}
      </p>
    </div>
  );
}
