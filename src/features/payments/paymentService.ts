import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { transactionDetailsHref } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";
import { chosenPackageOf } from "@/features/auth/useCurrentAccount";
import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import {
  heldPackageIds,
  investBlockedReason,
  investOptionFor,
  isWithinPaymentRange,
} from "@/features/packages/packagePolicy";
import type { Transaction } from "@/features/transactions/transactionModel";
import { MOMO_NETWORKS, type MomoNetwork } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import { APPROVAL_WINDOW_MS, PAYMENT_FEE, RESEND_AFTER_MS, type MomoPayment } from "./paymentModel";

/**
 * Payments service: the single place screens start a Mobile Money payment
 * and ask how it's going. Screens never `fetch` directly.
 *
 * The real flow (TODO(api)):
 *   1. the app asks our server to collect GH₵ X from the number on the account
 *   2. the server asks the payment provider (e.g. Hubtel or Paystack), and
 *      the network shows the approval prompt on the user's phone
 *   3. they approve with their MoMo PIN, in the network's prompt
 *   4. the provider tells our server (webhook); the server records the
 *      investment. The app only asks for the status until it changes.
 * The server re-checks every rule here; the browser is never trusted.
 *
 * DEMO MODE: nothing is sent and no prompt appears. A waiting payment
 * approves itself DEMO_APPROVE_AFTER_MS after its prompt was "sent" (the
 * waiting screen says so), recording the amount the user typed, so the rest
 * of the app (balance, transactions, chart) can be tried end to end.
 */

export type PaymentResult = { ok: true; payment: MomoPayment } | { ok: false; message: string };

/** Demo only: how long after "sending" a prompt it counts as approved. */
const DEMO_APPROVE_AFTER_MS = 10_000;

const SOMETHING_WENT_WRONG: PaymentResult = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

/** "48291736": random digits for references. */
function randomDigits(count: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(count)), (byte) => byte % 10).join("");
}

/**
 * Sends the approval prompt to the phone on the account. If a payment is
 * already waiting for approval, that one is returned instead: one prompt at
 * a time, so a user can't be charged twice by tapping Pay twice.
 */
export async function requestMomoPayment(input: {
  packageId: PackageId;
  amount: number;
  network: MomoNetwork;
}): Promise<PaymentResult> {
  // TODO(api): POST /api/payments/momo  { packageId, amount, network } → 201 MomoPayment
  //   (to the phone ON THE ACCOUNT; 409 with the waiting payment if one is pending)
  if (!IS_DEMO_MODE) return SOMETHING_WENT_WRONG;
  await wait(DEMO_DELAY_MS);

  const email = demo.getSessionEmail();
  if (!email) return { ok: false, message: "Please log in again, then try once more." };
  settleDemoPayments();
  const account = demo.findAccount(email);
  if (!account) return { ok: false, message: "Please log in again, then try once more." };
  if (!account.phone) return { ok: false, message: "Add your phone number to your profile first." };
  if (!(input.network in MOMO_NETWORKS)) return { ok: false, message: "Choose your Mobile Money network." };

  const waiting = account.payments?.find((payment) => payment.status === "pending");
  if (waiting) return { ok: true, payment: waiting };

  const amount = Math.round(input.amount * 100) / 100;
  const problem = amountProblem(account.transactions ?? [], chosenPackageOf(account), input.packageId, amount);
  if (problem) return { ok: false, message: problem };

  const now = Date.now();
  const payment: MomoPayment = {
    id: `PAY${randomDigits(8)}`,
    packageId: input.packageId,
    amount,
    fee: PAYMENT_FEE,
    network: input.network,
    phone: account.phone,
    status: "pending",
    createdAt: new Date(now).toISOString(),
    sentAt: new Date(now).toISOString(),
    expiresAt: new Date(now + APPROVAL_WINDOW_MS).toISOString(),
  };
  demo.updateAccount(email, { payments: [...(account.payments ?? []), payment] });
  return { ok: true, payment };
}

/**
 * Why this amount can't go into this package, or null if it can: only
 * their own package, and each payment within its range (packagePolicy.ts).
 */
function amountProblem(
  transactions: Transaction[],
  chosenId: PackageId | null,
  packageId: PackageId,
  amount: number,
): string | null {
  const theirs = heldPackageIds(transactions)[0] ?? chosenId;
  if (theirs !== packageId) return "You can only pay into your own portfolio.";
  const pkg = INVESTMENT_PACKAGES[packageId];
  const blocked = investBlockedReason(investOptionFor(transactions, packageId));
  if (blocked) return blocked;
  if (!isWithinPaymentRange(packageId, amount)) {
    return `Enter between ${formatCedis(pkg.minimum)} and ${formatCedis(pkg.maximum, { exact: true })}.`;
  }
  return null;
}

/** The payment, with its latest status, or null if there's no such payment on this account. */
export async function getPayment(id: string): Promise<MomoPayment | null> {
  // TODO(api): GET /api/payments/:id
  if (!IS_DEMO_MODE) return null;
  settleDemoPayments();
  const email = demo.getSessionEmail();
  return (email && demo.findAccount(email)?.payments?.find((payment) => payment.id === id)) || null;
}

/** The payment that recorded this transaction (for its receipt: wallet, fee), or null if none did. */
export async function getPaymentForTransaction(transactionId: string): Promise<MomoPayment | null> {
  // TODO(api): part of GET /api/transactions/:id (the server joins the payment)
  if (!IS_DEMO_MODE) return null;
  const email = demo.getSessionEmail();
  return (email && demo.findAccount(email)?.payments?.find((item) => item.transactionId === transactionId)) || null;
}

/** Sends the prompt again (after RESEND_AFTER_MS), with a fresh APPROVAL_WINDOW_MS to approve it. */
export async function resendPaymentRequest(id: string): Promise<PaymentResult> {
  // TODO(api): POST /api/payments/:id/resend
  if (!IS_DEMO_MODE) return SOMETHING_WENT_WRONG;
  await wait(DEMO_DELAY_MS);
  return changePendingPayment(id, (payment, now) => {
    if (now - Date.parse(payment.sentAt) < RESEND_AFTER_MS) return null;
    return {
      ...payment,
      sentAt: new Date(now).toISOString(),
      expiresAt: new Date(now + APPROVAL_WINDOW_MS).toISOString(),
    };
  });
}

/**
 * Stops waiting for approval. The network's prompt may still be on their
 * phone; the real server tells the provider to drop it, and if it's
 * approved anyway the money is refunded. TODO(api): POST /api/payments/:id/cancel
 */
export async function cancelPayment(id: string): Promise<PaymentResult> {
  if (!IS_DEMO_MODE) return SOMETHING_WENT_WRONG;
  await wait(DEMO_DELAY_MS);
  return changePendingPayment(id, (payment) => ({ ...payment, status: "cancelled" }));
}

/** Applies `change` to a payment that's still waiting (null from `change`: leave it). */
function changePendingPayment(
  id: string,
  change: (payment: MomoPayment, now: number) => MomoPayment | null,
): PaymentResult {
  settleDemoPayments();
  const email = demo.getSessionEmail();
  const payments = (email && demo.findAccount(email)?.payments) || [];
  const payment = payments.find((item) => item.id === id);
  if (!email || !payment) return SOMETHING_WENT_WRONG;
  // Already over (e.g. approved a moment ago): nothing to change, show how it ended.
  if (payment.status !== "pending") return { ok: true, payment };
  const changed = change(payment, Date.now());
  if (!changed) return { ok: true, payment };
  demo.updateAccount(email, { payments: payments.map((item) => (item.id === id ? changed : item)) });
  return { ok: true, payment: changed };
}

/** Calls `listener` when payments may have changed. Returns an unsubscribe function. */
export function subscribeToPayments(listener: () => void): () => void {
  return IS_DEMO_MODE ? demo.subscribeToSession(listener) : () => {};
}

/**
 * Demo only: plays the network's part. Each waiting payment whose prompt has
 * been out for DEMO_APPROVE_AFTER_MS is approved: the investment is recorded
 * (at that moment) and the user is notified. Runs whenever payments or
 * transactions are read, so it happens even if they left the waiting screen.
 * On the real backend the provider's webhook does this on the server.
 */
export function settleDemoPayments(): void {
  if (!IS_DEMO_MODE) return;
  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  if (!email || !account?.payments?.some((payment) => payment.status === "pending")) return;

  const now = Date.now();
  const recorded: Transaction[] = [];
  const payments = account.payments.map((payment): MomoPayment => {
    const approvedAt = Date.parse(payment.sentAt) + DEMO_APPROVE_AFTER_MS;
    if (payment.status !== "pending" || now < approvedAt) return payment;
    const transaction: Transaction = {
      id: `FX${randomDigits(7)}`,
      type: "investment",
      amount: payment.amount,
      packageId: payment.packageId,
      channel: MOMO_NETWORKS[payment.network].name,
      status: "completed",
      createdAt: new Date(approvedAt).toISOString(),
    };
    recorded.push(transaction);
    return { ...payment, status: "approved", transactionId: transaction.id };
  });
  if (recorded.length === 0) return;

  demo.updateAccount(email, { payments, transactions: [...(account.transactions ?? []), ...recorded] });
  for (const transaction of recorded) {
    notify(email, {
      kind: "investing",
      title: "Payment received",
      body: `${formatCedis(transaction.amount, { exact: true })} from ${transaction.channel} is now in ${
        INVESTMENT_PACKAGES[transaction.packageId as PackageId].name
      }.`,
      href: transactionDetailsHref(transaction.id),
    });
  }
}
