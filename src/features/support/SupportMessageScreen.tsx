"use client";

/**
 * Help & support › Send a message. Plain words, like Help & support (the
 * user's Kussbus reference): white page, black in dark mode.
 *
 *   ←  Send a message
 *   Tell us what's happening. Our team will get back to you.
 *   WHAT'S IT ABOUT?
 *   (Investing)(Withdrawals)(My account)(Referrals)(Something else)
 *   WHICH TRANSACTION? (optional)
 *   [ Withdrawal to MTN MoMo · GH₵ 400.00 · 30 Sept ▾ ]   ← from their history, so
 *   YOUR MESSAGE                                          the team gets the ID
 *   [                                              ]
 *   [                                    0 / 1000  ]
 *   (               Send message               )         ← pinned at the bottom
 *
 * Sent → a tick, the reference (e.g. SUP482913) and a way back to help.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDownIcon } from "@/components/icons";
import { AnimatedCheck } from "@/components/ui/AnimatedCheck";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { formatWhen, transactionTitle } from "@/features/transactions/transactionFormat";
import type { Transaction } from "@/features/transactions/transactionModel";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  sendSupportMessage,
  SUPPORT_TOPICS,
  type SupportRequest,
  type SupportTopic,
} from "./supportService";

const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };
const LABEL = "text-xs font-semibold tracking-wider text-neutral-400 uppercase";

/** The topic that fits a transaction, so a message about one starts on the right topic. */
const TOPIC_FOR_TYPE: Record<Transaction["type"], SupportTopic> = {
  investment: "investing",
  return: "investing",
  withdrawal: "withdrawals",
  referral: "referrals",
};

export function SupportMessageScreen() {
  useStatusBarColor(PAGE_COLORS);
  const router = useRouter();
  const transactions = useTransactions();

  const searchParams = useSearchParams();
  const [chosenTopic, setTopic] = useState<SupportTopic | null>(null);
  // Picked already when they came from a transaction's "Need help with this?"
  // (`?transaction=…`), until they choose another (or None).
  const [chosenTransactionId, setTransactionId] = useState<string | null>(null);
  const transactionId = chosenTransactionId ?? searchParams.get("transaction") ?? "";
  const [message, setMessage] = useState("");

  const picked = transactions?.find((transaction) => transaction.id === transactionId) ?? null;
  // Until they choose a topic, a picked transaction suggests one.
  const topic = chosenTopic ?? (picked ? TOPIC_FOR_TYPE[picked.type] : null);
  // The latest 20 to choose from, plus the picked one if it's older.
  const options = (transactions ?? []).slice(0, 20);
  if (picked && !options.includes(picked)) options.push(picked);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<SupportRequest | null>(null);

  const send = async () => {
    if (!topic) {
      setError("Choose what your message is about.");
      return;
    }
    setError(null);
    setIsSending(true);
    const result = await sendSupportMessage({ topic, message, transactionId: transactionId || undefined });
    setIsSending(false);
    if (result.ok) setSent(result.request);
    else setError(result.message);
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-background px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <AnimatedCheck className="size-20" />
        <h1 className="mt-6 text-xl font-bold tracking-tight">Message sent</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Your reference is <span className="font-semibold text-foreground">{sent.id}</span>.
        </p>
        <p className="mt-1 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Our team will get back to you. Keep the reference in case you need to follow up.
        </p>
        <button
          type="button"
          onClick={() => router.replace(ROUTES.support)}
          className="mt-8 flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-full bg-brand-600 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to help
        </button>
      </div>
    );
  }

  const length = message.trim().length;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="-ml-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(ROUTES.support))}
          aria-label="Back"
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-medium">Send a message</h1>
      </header>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Tell us what&apos;s happening. Our team will get back to you.
      </p>

      <fieldset className="mt-8">
        <legend className={LABEL}>What&apos;s it about?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPORT_TOPICS.map((item) => (
            <label key={item.id} className="cursor-pointer">
              <input
                type="radio"
                name="topic"
                value={item.id}
                checked={topic === item.id}
                onChange={() => setTopic(item.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-9 items-center rounded-full px-4 text-[0.8125rem] font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400",
                  topic === item.id
                    ? "bg-brand-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15",
                )}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8">
        <label htmlFor="support-transaction" className={LABEL}>
          Which transaction? <span className="font-medium normal-case tracking-normal">(optional)</span>
        </label>
        <div className="relative mt-3">
          <select
            id="support-transaction"
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            className="h-12 w-full cursor-pointer appearance-none truncate rounded-xl border border-neutral-200 bg-background pr-10 pl-4 text-base outline-none focus:border-neutral-400 dark:border-white/10"
          >
            <option value="">None</option>
            {options.map((transaction) => (
              <option key={transaction.id} value={transaction.id}>
                {transactionTitle(transaction)} · {formatCedis(transaction.amount, { exact: true })} ·{" "}
                {formatWhen(transaction.createdAt)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {transactionId && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            We&apos;ll attach transaction {transactionId}, so the team can look it up.
          </p>
        )}
      </div>

      <div className="mt-8">
        <label htmlFor="support-message" className={LABEL}>
          Your message
        </label>
        <textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX_LENGTH))}
          rows={6}
          placeholder="What happened, and when?"
          aria-describedby="support-message-count"
          // 16px text: smaller makes iPhones zoom in on tap.
          className="mt-3 w-full resize-none rounded-xl border border-neutral-200 bg-background p-4 text-base leading-relaxed outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/10"
        />
        <p
          id="support-message-count"
          className={cn(
            "mt-1.5 text-right text-xs tabular-nums",
            length > 0 && length < MESSAGE_MIN_LENGTH ? "text-amber-600" : "text-neutral-400",
          )}
        >
          {length < MESSAGE_MIN_LENGTH ? `At least ${MESSAGE_MIN_LENGTH} characters · ` : ""}
          {message.length} / {MESSAGE_MAX_LENGTH}
        </p>
      </div>

      {/* Pinned at the bottom, so it's always within reach. */}
      <div className="sticky bottom-0 mt-auto bg-background pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {error && (
          <div className="mb-3">
            <FormErrorMessage message={error} />
          </div>
        )}
        <button
          type="button"
          onClick={send}
          disabled={isSending}
          aria-busy={isSending || undefined}
          className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-brand-600 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {isSending ? "Sending…" : "Send message"}
        </button>
      </div>
    </div>
  );
}
