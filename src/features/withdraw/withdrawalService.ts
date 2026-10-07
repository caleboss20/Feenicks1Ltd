import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { withdrawalStatusHref } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";
import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import type { Transaction } from "@/features/transactions/transactionModel";
import { MOMO_NETWORKS, type MomoNetwork } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import {
  firstDeposit,
  largestWithdrawal,
  WITHDRAWAL_RULES,
  withdrawableBalance,
  withdrawalFee,
  withdrawalTerms,
  type WithdrawalRequest,
} from "./withdrawalModel";

/**
 * Withdrawals service: the single place screens request a withdrawal and
 * follow it. Screens never `fetch` directly.
 *
 * The real flow (TODO(api)): POST /api/withdrawals creates a request; staff
 * review and approve it in the operations console (maker-checker); the
 * payout goes to the MoMo number through the payment provider, whose
 * confirmation marks it paid. The server re-checks every rule here.
 *
 * DEMO MODE: no staff, no payout. A request approves itself
 * DEMO_APPROVE_AFTER_MS after it's made and is paid DEMO_PAY_AFTER_MS after
 * (the status screen says so), so all three steps can be seen.
 */

export type WithdrawalResult = { ok: true; withdrawal: WithdrawalRequest } | { ok: false; message: string };

const DEMO_APPROVE_AFTER_MS = 20_000;
const DEMO_PAY_AFTER_MS = 40_000;

const SOMETHING_WENT_WRONG: WithdrawalResult = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

function randomDigits(count: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(count)), (byte) => byte % 10).join("");
}

/** Asks to send `amount` (what they receive) to the profile's MoMo number on `network`. */
export async function requestWithdrawal(input: { amount: number; network: MomoNetwork }): Promise<WithdrawalResult> {
  // TODO(api): POST /api/withdrawals  { amount, network } → 201 WithdrawalRequest
  if (!IS_DEMO_MODE) return SOMETHING_WENT_WRONG;
  await wait(DEMO_DELAY_MS);

  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  if (!email || !account) return { ok: false, message: "Please log in again, then try once more." };
  if (!account.phone) return { ok: false, message: "Add your phone number to your profile first." };
  if (!(input.network in MOMO_NETWORKS)) return { ok: false, message: "Choose your Mobile Money network." };

  const transactions = account.transactions ?? [];
  const packageId: PackageId | undefined = heldPackageIds(transactions)[0];
  if (!packageId) return { ok: false, message: "You don't have an investment to withdraw from yet." };

  const startedAt = firstDeposit(transactions, packageId);
  if (!startedAt) return { ok: false, message: "Your first payment hasn't come through yet." };
  // Standard, express or pre-investment: decided here by the date, never by the screen.
  const { kind } = withdrawalTerms(INVESTMENT_PACKAGES[packageId], startedAt);
  const amount = Math.round(input.amount * 100) / 100;
  const largest = largestWithdrawal(kind, withdrawableBalance(transactions, packageId));
  if (amount < WITHDRAWAL_RULES.minimum) {
    return { ok: false, message: `The minimum withdrawal is ${formatCedis(WITHDRAWAL_RULES.minimum)}.` };
  }
  if (amount > largest) {
    return { ok: false, message: `You can withdraw up to ${formatCedis(largest, { exact: true })}.` };
  }
  const fee = withdrawalFee(kind, amount);
  const debit = Math.round((amount + fee) * 100) / 100;

  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: `FX${randomDigits(7)}`,
    type: "withdrawal",
    // What leaves the account: the amount plus any express fee.
    amount: debit,
    packageId,
    channel: MOMO_NETWORKS[input.network].name,
    status: "pending",
    createdAt: now,
  };
  const withdrawal: WithdrawalRequest = {
    id: `WD${randomDigits(8)}`,
    packageId,
    kind,
    amount,
    fee,
    debit,
    network: input.network,
    phone: account.phone,
    status: "requested",
    createdAt: now,
    transactionId: transaction.id,
  };
  demo.updateAccount(email, {
    withdrawals: [...(account.withdrawals ?? []), withdrawal],
    transactions: [...transactions, transaction],
  });
  return { ok: true, withdrawal };
}

/** All the account's withdrawal requests, newest first. TODO(api): GET /api/withdrawals */
export async function getWithdrawals(): Promise<WithdrawalRequest[]> {
  if (!IS_DEMO_MODE) return [];
  settleDemoWithdrawals();
  const email = demo.getSessionEmail();
  const list = (email && demo.findAccount(email)?.withdrawals) || [];
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The withdrawal with its latest status, or null if there's no such request on this account. */
export async function getWithdrawal(id: string): Promise<WithdrawalRequest | null> {
  // TODO(api): GET /api/withdrawals/:id
  if (!IS_DEMO_MODE) return null;
  settleDemoWithdrawals();
  const email = demo.getSessionEmail();
  return (email && demo.findAccount(email)?.withdrawals?.find((item) => item.id === id)) || null;
}

/** Cancels a request that hasn't been approved yet. TODO(api): POST /api/withdrawals/:id/cancel */
export async function cancelWithdrawal(id: string): Promise<WithdrawalResult> {
  if (!IS_DEMO_MODE) return SOMETHING_WENT_WRONG;
  await wait(DEMO_DELAY_MS);
  settleDemoWithdrawals();
  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  const withdrawal = account?.withdrawals?.find((item) => item.id === id);
  if (!email || !account || !withdrawal) return SOMETHING_WENT_WRONG;
  if (withdrawal.status !== "requested") {
    return { ok: false, message: "It's already been approved, so it can't be cancelled now." };
  }
  const cancelled: WithdrawalRequest = { ...withdrawal, status: "cancelled" };
  demo.updateAccount(email, {
    withdrawals: account.withdrawals?.map((item) => (item.id === id ? cancelled : item)),
    transactions: account.transactions?.map((item) =>
      item.id === withdrawal.transactionId ? { ...item, status: "failed" as const } : item,
    ),
  });
  return { ok: true, withdrawal: cancelled };
}

/** Calls `listener` when withdrawals may have changed. Returns an unsubscribe function. */
export function subscribeToWithdrawals(listener: () => void): () => void {
  return IS_DEMO_MODE ? demo.subscribeToSession(listener) : () => {};
}

/**
 * Demo only: plays the staff's and provider's parts. Moves each request on
 * by time (approved, then paid), marks its transaction completed when paid,
 * and notifies the user at each step. Runs whenever withdrawals or
 * transactions are read.
 */
export function settleDemoWithdrawals(): void {
  if (!IS_DEMO_MODE) return;
  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  if (!email || !account?.withdrawals?.some((item) => item.status === "requested" || item.status === "approved")) {
    return;
  }

  const now = Date.now();
  const events: { withdrawal: WithdrawalRequest; step: "approved" | "paid" }[] = [];
  const withdrawals = account.withdrawals.map((item): WithdrawalRequest => {
    const created = Date.parse(item.createdAt);
    let next = item;
    if (next.status === "requested" && now >= created + DEMO_APPROVE_AFTER_MS) {
      next = { ...next, status: "approved", approvedAt: new Date(created + DEMO_APPROVE_AFTER_MS).toISOString() };
      events.push({ withdrawal: next, step: "approved" });
    }
    if (next.status === "approved" && now >= created + DEMO_PAY_AFTER_MS) {
      next = { ...next, status: "paid", paidAt: new Date(created + DEMO_PAY_AFTER_MS).toISOString() };
      events.push({ withdrawal: next, step: "paid" });
    }
    return next;
  });
  if (events.length === 0) return;

  const paid = new Set(withdrawals.filter((item) => item.status === "paid").map((item) => item.transactionId));
  demo.updateAccount(email, {
    withdrawals,
    transactions: account.transactions?.map((item) =>
      paid.has(item.id) && item.status === "pending" ? { ...item, status: "completed" as const } : item,
    ),
  });
  for (const { withdrawal, step } of events) {
    const amount = formatCedis(withdrawal.amount, { exact: true });
    const network = MOMO_NETWORKS[withdrawal.network].name;
    notify(email, {
      kind: "investing",
      title: step === "approved" ? "Withdrawal approved" : "Withdrawal paid",
      body:
        step === "approved"
          ? `Your ${amount} withdrawal was approved. It's on its way to your ${network}.`
          : `${amount} was paid to your ${network}.`,
      href: withdrawalStatusHref(withdrawal.id),
    });
  }
}
