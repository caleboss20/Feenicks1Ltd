import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import type { Transaction } from "./transactionModel";

/**
 * Transactions service: the single place the Transactions screen gets its
 * data from. Honest by design: until investing and payments exist, the list
 * is empty (no made-up transactions).
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
