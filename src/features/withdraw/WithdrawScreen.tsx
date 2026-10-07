"use client";

/**
 * Withdraw (the dashboard's Withdraw button), after the user's "Money
 * withdraw" reference, with the CEO's withdrawal rules (withdrawalModel.ts).
 *
 *   (‹)  Withdraw
 *   Send to
 *   ┌───────────────────────────────────────┐
 *   │ (MTN) MTN MoMo                     ⌄  │   ← their MoMo wallet; tap to change network
 *   │       024 ••• 4567                    │
 *   └───────────────────────────────────────┘
 *   ✓ Standard withdrawal: free until 13 Oct   ← or "Express: 1% fee added. Free from 3 Nov", or
 *                                                 in the first 72 h "Your money starts working on…"
 *              GH₵ 408|                        ← typed on the pad below
 *     Available  GH₵ 1,500.00 · Max
 *   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
 *   ░  [1]  [2]  [3]                        ░   ← grey panel: the number pad
 *   ░  [4]  [5]  [6]                        ░
 *   ░  [7]  [8]  [9]                        ░
 *   ░  [.]  [0]  [⌫]                        ░
 *   ░  (        Withdraw now        )       ░   → confirm sheet → status screen
 *
 * Not invested yet (or the first payment hasn't come through): "Nothing to
 * withdraw yet", with Invest now.
 */

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BackspaceIcon, CheckIcon, ChevronDownIcon, ClockIcon } from "@/components/icons";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES, withdrawalStatusHref } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import { MomoNetworkLogo } from "@/features/payments/MomoNetworkLogo";
import { useTransactions } from "@/features/transactions/useTransactions";
import { MOMO_NETWORKS, networkForNumber, type MomoNetwork } from "@/lib/mobileMoney";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  firstDeposit,
  largestWithdrawal,
  tierAfterWithdrawal,
  WITHDRAWAL_RULES,
  withdrawableBalance,
  withdrawalFee,
  withdrawalTerms,
  type WithdrawalKind,
  type WithdrawalRequest,
  type WithdrawalTerms,
} from "./withdrawalModel";
import { getWithdrawals, requestWithdrawal, subscribeToWithdrawals } from "./withdrawalService";

/** "241234567" → "024 ••• 4567": enough to recognise, not to copy. */
function maskedNumber(phone: string): string {
  return `0${phone.slice(0, 2)} ••• ${phone.slice(5)}`;
}

/** "13 Oct" / "13 Oct, 3:45 pm" for the free-window line. */
function shortDate(date: Date, withTime = false): string {
  const day = date.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
  return withTime ? `${day}, ${date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" })}` : day;
}

/** Adds a key press to the typed amount: digits, one dot, two decimals, no leading zeros. */
function typeKey(current: string, key: string): string {
  if (key === "backspace") return current.slice(0, -1);
  if (key === ".") return current.includes(".") ? current : `${current || "0"}.`;
  const [, decimals] = current.split(".");
  if (decimals !== undefined && decimals.length >= 2) return current;
  if (current.replace(".", "").length >= 9) return current;
  return current === "0" ? key : current + key;
}

/** "1500.5" → "1,500.5", as it's typed. */
function withCommas(clean: string): string {
  if (!clean) return "0";
  const [whole, fraction] = clean.split(".");
  const wholeText = Number(whole || "0").toLocaleString("en-GH");
  return fraction === undefined ? wholeText : `${wholeText}.${fraction}`;
}

/** A withdrawal underway (requested or approved), if any. */
function useWithdrawalInProgress(): WithdrawalRequest | null {
  const [inProgress, setInProgress] = useState<WithdrawalRequest | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void getWithdrawals().then((list) => {
        if (!cancelled) {
          setInProgress(list.find((item) => item.status === "requested" || item.status === "approved") ?? null);
        }
      });
    load();
    const unsubscribe = subscribeToWithdrawals(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return inProgress;
}

export function WithdrawScreen() {
  const current = useCurrentAccount();
  const transactions = useTransactions();
  if (current.status !== "signed-in" || transactions === null) return null;

  const heldId = heldPackageIds(transactions)[0] ?? null;
  const startedAt = heldId ? firstDeposit(transactions, heldId) : null;
  const phone = current.account.phone;

  if (!heldId || !startedAt || !phone) {
    return <NothingToWithdraw needsPhone={Boolean(heldId && startedAt && !phone)} />;
  }
  return (
    <WithdrawForm
      packageId={heldId}
      startedAt={startedAt}
      phone={phone}
      balance={withdrawableBalance(transactions, heldId)}
    />
  );
}

function NothingToWithdraw({ needsPhone }: { needsPhone: boolean }) {
  return (
    <StepScreenLayout title="Withdraw" centeredTitle backHref={ROUTES.dashboard}>
      <div className="mt-12 flex flex-col items-center text-center [@media(max-height:700px)]:mt-8">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <ArrowRight className="size-7 rotate-90" />
        </span>
        <h2 className="mt-5 text-lg font-semibold">{needsPhone ? "Add your phone number" : "Nothing to withdraw yet"}</h2>
        <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {needsPhone
            ? "Withdrawals are paid to your Mobile Money number. Add it to your profile first."
            : "Once your first payment is in, you can withdraw from your wallet here."}
        </p>
      </div>
      <div className={stickyActionsClass}>
        <ButtonLink href={needsPhone ? ROUTES.editProfile : ROUTES.invest} size="lg" fullWidth>
          {needsPhone ? "Edit profile" : "Invest now"}
        </ButtonLink>
      </div>
    </StepScreenLayout>
  );
}

function WithdrawForm({
  packageId,
  startedAt,
  phone,
  balance,
}: {
  packageId: PackageId;
  startedAt: Date;
  phone: string;
  balance: number;
}) {
  const pkg = INVESTMENT_PACKAGES[packageId];
  const terms = withdrawalTerms(pkg, startedAt);
  const largest = largestWithdrawal(terms.kind, balance);
  const inProgress = useWithdrawalInProgress();

  const [amountText, setAmountText] = useState("");
  const [network, setNetwork] = useState<MomoNetwork>(networkForNumber(phone) ?? "mtn");
  const [isChoosingNetwork, setIsChoosingNetwork] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const amount = Number(amountText) || 0;
  const error =
    amount === 0
      ? null
      : amount < WITHDRAWAL_RULES.minimum
        ? `The minimum is ${formatCedis(WITHDRAWAL_RULES.minimum)}`
        : amount > largest
          ? `You can withdraw up to ${formatCedis(largest, { exact: true })}${terms.kind === "express" ? " (with the 1% fee)" : ""}`
          : null;
  const isValid = amount > 0 && !error;

  // A physical keyboard works too (laptops): digits, the dot and backspace.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isConfirming || isChoosingNetwork) return;
      const key = event.key === "Backspace" ? "backspace" : event.key === "," ? "." : event.key;
      if (/^[0-9.]$/.test(key) || key === "backspace") setAmountText((text) => typeKey(text, key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isConfirming, isChoosingNetwork]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3">
          <Link
            href={ROUTES.dashboard}
            aria-label="Back to home"
            className="-ml-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Withdraw</h1>
        </header>

        {inProgress && (
          <Link
            href={withdrawalStatusHref(inProgress.id)}
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-[0.8125rem] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <span>
              {formatCedis(inProgress.amount, { exact: true })} withdrawal{" "}
              {inProgress.status === "approved" ? "approved, being paid" : "being reviewed"}
            </span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        )}

        <p className="mt-4 text-[0.8125rem] text-neutral-500 [@media(max-height:660px)]:mt-2 dark:text-neutral-400">Send to</p>
        <button
          type="button"
          onClick={() => setIsChoosingNetwork(true)}
          aria-label={`Send to ${MOMO_NETWORKS[network].name}, ${maskedNumber(phone)}. Change network`}
          className="mt-1.5 flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 text-left ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50 dark:ring-white/15 dark:hover:bg-white/5"
        >
          <MomoNetworkLogo network={network} className="size-9" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold">{MOMO_NETWORKS[network].name}</span>
            <span className="block text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              {maskedNumber(phone)}
            </span>
          </span>
          <ChevronDownIcon className="size-5 text-neutral-500" />
        </button>

        <KindLine terms={terms} />

        {/* The amount, typed on the pad below. */}
        <p
          className="mt-[clamp(0.75rem,3dvh,1.5rem)] flex items-baseline justify-center gap-2 font-bold tracking-tight text-brand-800 tabular-nums dark:text-brand-300"
          aria-live="polite"
        >
          <span className="text-[1.75rem]">{CEDI_SYMBOL}</span>
          <span
            className={cn(
              "text-[clamp(2.25rem,6dvh,3rem)] leading-none",
              !amountText && "text-neutral-300 dark:text-neutral-600",
            )}
          >
            {withCommas(amountText)}
          </span>
          <span aria-hidden className="h-[clamp(2rem,5dvh,2.75rem)] w-0.5 animate-pulse self-center bg-brand-600 motion-reduce:animate-none" />
        </p>

        <p
          className={cn(
            "mt-3 mb-3 text-center text-[0.8125rem] [@media(max-height:660px)]:mt-2 [@media(max-height:660px)]:mb-2",
            error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400",
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? (
            <>
              Available{" "}
              <span className="font-semibold text-foreground tabular-nums">{formatCedis(balance, { exact: true })}</span>
              {largest > 0 && (
                <>
                  {" · "}
                  {/* The most they can ask for (with an express fee, a little under the balance). */}
                  <button
                    type="button"
                    onClick={() => setAmountText(String(largest))}
                    className="cursor-pointer font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    Max
                  </button>
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* The number pad and the button, on a grey panel at the bottom. */}
      {/* Sized to the screen's height (dvh), so the button is always visible without scrolling. */}
      <div className="mt-auto rounded-t-[2rem] bg-neutral-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] [@media(max-height:660px)]:pt-3 dark:bg-white/5">
        <div role="group" aria-label="Number pad" className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAmountText((text) => typeKey(text, key))}
              aria-label={key === "backspace" ? "Delete" : key === "." ? "Decimal point" : key}
              className="grid h-[clamp(2.5rem,6.5dvh,3.25rem)] cursor-pointer place-items-center rounded-2xl bg-white text-xl font-medium transition-colors active:bg-neutral-50 dark:bg-white/10 dark:active:bg-white/15"
            >
              {key === "backspace" ? <BackspaceIcon className="size-6" /> : key}
            </button>
          ))}
        </div>
        <Button size="lg" fullWidth disabled={!isValid} onClick={() => setIsConfirming(true)} className="mt-3 h-13 lg:h-13 [@media(max-height:660px)]:h-12">
          Withdraw now
        </Button>
      </div>

      {isChoosingNetwork && (
        <NetworkSheet
          selected={network}
          phone={phone}
          onChoose={(id) => {
            setNetwork(id);
            setIsChoosingNetwork(false);
          }}
          onClose={() => setIsChoosingNetwork(false)}
        />
      )}
      {isConfirming && (
        <ConfirmWithdrawalSheet
          packageId={packageId}
          kind={terms.kind}
          amount={amount}
          balance={balance}
          network={network}
          phone={phone}
          onClose={() => setIsConfirming(false)}
        />
      )}
    </div>
  );
}

/** One line on which kind of withdrawal this would be right now, and its cost. */
function KindLine({ terms }: { terms: WithdrawalTerms }) {
  const isFree = terms.kind !== "express";
  return (
    <p
      className={cn(
        "mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-snug [@media(max-height:660px)]:mt-2.5 [@media(max-height:660px)]:py-1.5 [@media(max-height:660px)]:text-[0.6875rem]",
        isFree
          ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
          : "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200",
      )}
    >
      {isFree ? <CheckIcon className="mt-px size-3.5 shrink-0" /> : <ClockIcon className="mt-px size-3.5 shrink-0" />}
      <span>
        {terms.kind === "pre-investment" &&
          `Your money starts working on ${shortDate(terms.investedFrom, true)}. Until then you can take it back free.`}
        {terms.kind === "standard" &&
          `Standard withdrawal: free${terms.freeUntil ? ` until ${shortDate(terms.freeUntil)}` : ""}.`}
        {terms.kind === "express" &&
          `Express withdrawal: ${WITHDRAWAL_RULES.expressFeePercent}% fee added.${
            terms.nextStandardFrom ? ` Free from ${shortDate(terms.nextStandardFrom)}.` : ""
          }`}
      </span>
    </p>
  );
}

/** Choose which network the MoMo number is on (numbers can move between networks). */
function NetworkSheet({
  selected,
  phone,
  onChoose,
  onClose,
}: {
  selected: MomoNetwork;
  phone: string;
  onChoose: (network: MomoNetwork) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <BottomSheet open onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="mt-4 text-center text-base font-semibold">
        Send to
      </h2>
      <p className="mt-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
        Your number {maskedNumber(phone)}. Which network is it on?
      </p>
      <ul className="mt-5 flex flex-col gap-2">
        {(Object.keys(MOMO_NETWORKS) as MomoNetwork[]).map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onChoose(id)}
              aria-pressed={id === selected}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-colors",
                id === selected
                  ? "bg-brand-50 ring-2 ring-brand-600 dark:bg-brand-500/10"
                  : "ring-neutral-200 hover:bg-neutral-50 dark:ring-white/15 dark:hover:bg-white/5",
              )}
            >
              <MomoNetworkLogo network={id} className="size-9" />
              <span className="flex-1 text-[0.9375rem] font-semibold">{MOMO_NETWORKS[id].name}</span>
              {id === selected && <CheckIcon className="size-5 text-brand-600" />}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/** The last look: what they receive, the fee, what leaves the account, and where what's left will sit. */
function ConfirmWithdrawalSheet({
  packageId,
  kind,
  amount,
  balance,
  network,
  phone,
  onClose,
}: {
  packageId: PackageId;
  kind: WithdrawalKind;
  amount: number;
  balance: number;
  network: MomoNetwork;
  phone: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fee = withdrawalFee(kind, amount);
  const debit = Math.round((amount + fee) * 100) / 100;
  const remaining = Math.round((balance - debit) * 100) / 100;
  const tier = tierAfterWithdrawal(packageId, remaining);
  const pkg = INVESTMENT_PACKAGES[packageId];

  const send = async () => {
    setError(null);
    setIsSending(true);
    const result = await requestWithdrawal({ amount, network });
    if (!result.ok) {
      setError(result.message);
      setIsSending(false);
      return;
    }
    router.push(withdrawalStatusHref(result.withdrawal.id));
  };

  const rows = [
    { label: "Type", value: kind === "express" ? "Express" : kind === "standard" ? "Standard" : "Free (first 72 hours)" },
    { label: "To", value: `${MOMO_NETWORKS[network].name} · ${maskedNumber(phone)}` },
    {
      label: kind === "express" ? `Fee (${WITHDRAWAL_RULES.expressFeePercent}%)` : "Fee",
      value: fee === 0 ? "No fee" : formatCedis(fee, { exact: true }),
    },
    { label: "Taken from your wallet", value: formatCedis(debit, { exact: true }) },
    { label: "Left in your wallet", value: formatCedis(Math.max(0, remaining), { exact: true }) },
  ];

  return (
    <BottomSheet open onClose={onClose} labelledBy={titleId} canClose={!isSending}>
      <h2 id={titleId} className="mt-4 text-center text-base font-semibold tracking-tight">
        Confirm withdrawal
      </h2>
      <div className="mt-4 text-center">
        <p className="text-[0.8125rem] text-neutral-500 dark:text-neutral-400">You&apos;ll receive</p>
        <p className="mt-1.5 flex items-start justify-center gap-1.5 font-semibold tracking-tight tabular-nums">
          <span className="mt-0.5 text-base text-neutral-400 dark:text-neutral-500">{CEDI_SYMBOL}</span>
          <span className="text-[2.25rem] leading-none">{formatCedisNumber(amount, { exact: true })}</span>
        </p>
      </div>
      <dl className="mt-5 rounded-3xl bg-neutral-50 px-4 dark:bg-white/5">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-4 py-2.5 text-[0.8125rem]",
              index > 0 && "border-t border-neutral-200/70 dark:border-white/10",
            )}
          >
            <dt className="text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            <dd className="text-right font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      {/* What's left must still fit a package (CEO's rule). */}
      {(tier.kind === "moves" || tier.kind === "below-minimum") && (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {tier.kind === "moves"
            ? `What's left is below the ${pkg.name} minimum (${formatCedis(pkg.minimum)}), so it moves to ${tier.to.name} and earns its rates from the next cycle.`
            : "What's left is below the smallest package minimum, so it won't earn returns. Consider withdrawing everything."}
        </p>
      )}
      <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        Our team reviews it, then pays within {WITHDRAWAL_RULES.processingDays} working days. You&apos;ll be notified at
        each step.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <FormErrorMessage message={error} />
        <Button size="lg" fullWidth onClick={send} isLoading={isSending} loadingLabel="Sending your request">
          Request withdrawal
        </Button>
      </div>
    </BottomSheet>
  );
}
