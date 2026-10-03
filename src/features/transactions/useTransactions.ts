"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "./transactionModel";
import { getTransactions, subscribeToTransactions } from "./transactionsService";

/**
 * The user's transactions (newest first), or null while they first load.
 * Shared by the Transactions list, the Analytics chart and the dashboard, so
 * they always agree, and reloaded when the transactions change.
 */
export function useTransactions(): Transaction[] | null {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void getTransactions().then((list) => {
        if (!cancelled) setTransactions(list);
      });
    };
    load();
    const unsubscribe = subscribeToTransactions(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return transactions;
}
