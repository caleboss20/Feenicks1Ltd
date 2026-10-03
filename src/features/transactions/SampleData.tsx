"use client";

/**
 * Demo only: preview the app as an active investor with a year of SAMPLE
 * activity (see demo/sampleActivity.ts), and always say when it's showing.
 *
 *   "Preview with a sample year"   ← on empty screens (demo mode only)
 *   ┌ You're viewing sample data (demo), not real activity.  Remove ┐
 */

import { useState } from "react";
import type { Transaction } from "./transactionModel";
import {
  CAN_PREVIEW_SAMPLE_ACTIVITY,
  clearSampleActivity,
  isSampleTransaction,
  loadSampleActivity,
} from "./transactionsService";

/** Fills the account with a sample year (demo mode only; renders nothing otherwise). */
export function PreviewSampleButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  if (!CAN_PREVIEW_SAMPLE_ACTIVITY) return null;

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await loadSampleActivity();
        setIsLoading(false);
      }}
      className={
        className ??
        "mt-3 cursor-pointer text-xs font-semibold text-neutral-500 underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-60 dark:text-neutral-400"
      }
    >
      {isLoading ? "Loading sample…" : "Preview with a sample year"}
    </button>
  );
}

/** Shown whenever sample data is on screen, with a way to remove it. */
export function SampleDataNotice({ transactions }: { transactions: Transaction[] | null }) {
  const [isRemoving, setIsRemoving] = useState(false);
  if (!transactions?.some(isSampleTransaction)) return null;

  return (
    <div
      role="note"
      className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[0.8125rem] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <span className="flex-1">
        You&apos;re viewing <strong className="font-semibold">sample data</strong> (demo), not real
        activity.
      </span>
      <button
        type="button"
        disabled={isRemoving}
        onClick={async () => {
          setIsRemoving(true);
          await clearSampleActivity();
          setIsRemoving(false);
        }}
        className="shrink-0 cursor-pointer font-semibold underline underline-offset-2 disabled:opacity-60"
      >
        {isRemoving ? "Removing…" : "Remove"}
      </button>
    </div>
  );
}
