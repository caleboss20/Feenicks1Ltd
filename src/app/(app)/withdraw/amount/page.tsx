import type { Metadata } from "next";
import { WithdrawScreen } from "@/features/withdraw/WithdrawScreen";

/**
 * Route: `/withdraw/amount`: Withdraw, step 2 (how much, and to which MoMo
 * wallet), after "Withdraw money" on the wallet screen (`/withdraw`).
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Withdraw",
  robots: { index: false, follow: false },
};

export default function WithdrawAmountPage() {
  return <WithdrawScreen />;
}
