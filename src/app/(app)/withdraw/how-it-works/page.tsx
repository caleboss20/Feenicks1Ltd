import type { Metadata } from "next";
import { WithdrawalGuideScreen } from "@/features/withdraw/WithdrawalGuideScreen";

/**
 * Route: `/withdraw/how-it-works`: the withdrawal rules in plain words
 * (free first 72 hours, standard after each cycle, express with its fee),
 * with the investor's own dates. From the Withdraw screen's "How it works".
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "How withdrawals work",
  robots: { index: false, follow: false },
};

export default function WithdrawalGuidePage() {
  return <WithdrawalGuideScreen />;
}
