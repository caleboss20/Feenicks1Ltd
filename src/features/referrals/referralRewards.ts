import { IS_DEMO_MODE } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";
import type { Transaction } from "@/features/transactions/transactionModel";
import { REFERRAL_POINTS_LABEL, REFERRAL_REWARD, REFERRAL_REWARD_LABEL, referralCodeFor } from "./referralService";

/**
 * Paying the referral reward. The rule: a friend signs up with the
 * investor's link (or QR code), and when the friend's FIRST investment is
 * completed, the investor who invited them gets 100 points (GH₵ 100):
 *
 *   - a "Referral reward" transaction, added to their balance
 *   - a notification: "Ama joined with your link and made her first
 *     investment. GH₵ 100 has been added to your balance."
 *
 * Paid once per friend (the friend's account remembers it), never for
 * inviting yourself. Waiting for the first investment (not just the
 * sign-up) keeps fake sign-ups from earning rewards.
 *
 * Demo limit: accounts live on the phone they were made on, so this works
 * when both accounts are on the same device. A friend on another phone is
 * rewarded once the backend exists.
 * TODO(api): the server does this when the friend's first payment is
 * confirmed (with anti-fraud checks: one reward per verified person) and
 * pushes the notification to the inviter's phone.
 */
export function rewardReferrer(friendEmail: string): void {
  if (!IS_DEMO_MODE) return;
  const friend = demo.findAccount(friendEmail);
  if (!friend?.referredBy || friend.referralRewarded) return;
  const hasInvested = friend.transactions?.some((item) => item.type === "investment" && item.status === "completed");
  if (!hasInvested) return;

  const inviter = demo
    .listAccounts()
    .find((account) => account.email !== friend.email && referralCodeFor(account.email) === friend.referredBy);
  // Not on this device (demo): leave it for the backend; nothing is lost.
  if (!inviter) return;

  const reward: Transaction = {
    id: `FX${Array.from(crypto.getRandomValues(new Uint8Array(7)), (byte) => byte % 10).join("")}`,
    type: "referral",
    amount: REFERRAL_REWARD,
    status: "completed",
    createdAt: new Date().toISOString(),
  };
  demo.updateAccount(inviter.email, { transactions: [...(inviter.transactions ?? []), reward] });
  demo.updateAccount(friend.email, { referralRewarded: true });

  const friendName = friend.fullName?.split(/\s+/)[0] ?? "A friend";
  notify(inviter.email, {
    kind: "investing",
    title: `You earned ${REFERRAL_POINTS_LABEL}`,
    body: `${friendName} joined with your link and made their first investment. ${REFERRAL_REWARD_LABEL} has been added to your balance.`,
    href: ROUTES.transactions,
  });
}
