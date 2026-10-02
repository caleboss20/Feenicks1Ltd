import type { Metadata } from "next";
import { WithdrawScreen } from "@/features/withdraw/WithdrawScreen";

/**
 * Route: `/withdraw` (withdraw returns), from the dashboard.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Withdraw",
  robots: { index: false, follow: false },
};

export default function WithdrawPage() {
  return <WithdrawScreen />;
}
