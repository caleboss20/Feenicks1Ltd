import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import { SAMPLE_ID_PREFIX, sampleYearOfActivity } from "@/demo/sampleActivity";
import type { Transaction } from "./transactionModel";

/**
 * Transactions service: the single place screens get transactions from.
 * Honest by design: until investing and payments exist, the list is empty
 * (no made-up transactions), unless the user deliberately loads the demo's
 * sample year, which is labelled and removable.
 */

/** The user's transactions, newest first. */
export async function getTransactions(): Promise<Transaction[]> {
  // TODO(api): GET /api/transactions (newest first, paginated; the server is the record)
  if (IS_DEMO_MODE) {
    const email = demo.getSessionEmail();
    const saved = (email && demo.findAccount(email)?.transactions) || [];
    return [...saved].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return [];
}

/** Calls `listener` when the transactions may have changed. Returns an unsubscribe function. */
export function subscribeToTransactions(listener: () => void): () => void {
  // TODO(api): refetch on focus / after a payment instead.
  return IS_DEMO_MODE ? demo.subscribeToSession(listener) : () => {};
}

/* ── Demo only: preview the app as an active investor ───────────────── */

/** Sample data can be loaded (demo mode only; never with the real backend). */
export const CAN_PREVIEW_SAMPLE_ACTIVITY = IS_DEMO_MODE;

export function isSampleTransaction(transaction: Transaction): boolean {
  return transaction.id.startsWith(SAMPLE_ID_PREFIX);
}

/** Adds a year of sample activity to the account (replacing any earlier sample). */
export async function loadSampleActivity(): Promise<void> {
  if (!IS_DEMO_MODE) return;
  const email = demo.getSessionEmail();
  const saved = (email && demo.findAccount(email)?.transactions) || [];
  demo.updateSessionAccount({
    transactions: [...saved.filter((item) => !isSampleTransaction(item)), ...sampleYearOfActivity()],
  });
}

/** Removes the sample activity, keeping anything real. */
export async function clearSampleActivity(): Promise<void> {
  if (!IS_DEMO_MODE) return;
  const email = demo.getSessionEmail();
  const saved = (email && demo.findAccount(email)?.transactions) || [];
  demo.updateSessionAccount({ transactions: saved.filter((item) => !isSampleTransaction(item)) });
}
