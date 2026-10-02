import type { Metadata } from "next";
import { TransactionsScreen } from "@/features/transactions/TransactionsScreen";

/**
 * Route: `/transactions` (your transaction history). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Transactions",
  robots: { index: false, follow: false },
};

export default function TransactionsPage() {
  return <TransactionsScreen />;
}