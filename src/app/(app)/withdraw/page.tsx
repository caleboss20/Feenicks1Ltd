import type { Metadata } from "next";
import { WithdrawWalletScreen } from "@/features/withdraw/WithdrawWalletScreen";

/**
 * Route: `/withdraw`: Withdraw, step 1, from the dashboard's Withdraw button:
 * the wallet card, then "Withdraw money" → `/withdraw/amount`.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Withdraw",
  robots: { index: false, follow: false },
};

export default function WithdrawPage() {
  return <WithdrawWalletScreen />;
}
