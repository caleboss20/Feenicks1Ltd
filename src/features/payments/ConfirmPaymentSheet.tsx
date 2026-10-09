"use client";

/**
 * Confirm payment: slides up over the amount screen when they tap Invest.
 * The last look before the prompt goes to their phone.
 *
 *   ╭──────────────── ▬ ──────────────(×)╮
 *   │           Confirm payment            │
 *   │           You're investing           │   ← "You're adding" (top-up)
 *   │        GH₵ 1,500.00                  │
 *   │  ┌──────────────────────────────┐    │
 *   │  │ To        InvestWise Capital  │    │
 *   │  │ From      024 123 4567        │    │
 *   │  │ Fee       No fee              │    │
 *   │  │ Total     GH₵ 1,500.00        │    │
 *   │  └──────────────────────────────┘    │
 *   │  Pay with                            │
 *   │  [(MTN) MTN MoMo][(T) Telecel][(AT)] │   ← guessed from the number;
 *   │  You'll get a prompt on 024 123 4567  │     they can change it
 *   │  (        Pay GH₵ 1,500.00        )   │
 *   ╰──────────────────────────────────────╯
 *
 * Pay asks for the prompt (paymentService) and opens the waiting screen.
 * The network is theirs to pick: numbers can move between networks, so the
 * guess from the prefix (lib/mobileMoney) is only where it starts.
 */

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { investPaymentHref } from "@/config/routes";
import type { InvestmentPackage } from "@/features/packages/investmentPackages";
import { formatLocalNumber, MOMO_NETWORKS, type MomoNetwork } from "@/lib/mobileMoney";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MomoNetworkLogo } from "./MomoNetworkLogo";
import { PAYMENT_FEE } from "./paymentModel";
import { requestMomoPayment } from "./paymentService";

type ConfirmPaymentSheetProps = {
  open: boolean;
  onClose: () => void;
  pkg: InvestmentPackage;
  amount: number;
  /** Adding to money already in the package (wording only). */
  isTopUp: boolean;
  /** Their profile number, 9 digits. */
  phone: string;
  /** The network guessed from the number, if it could be. */
  suggestedNetwork: MomoNetwork | null;
};

export function ConfirmPaymentSheet({
  open,
  onClose,
  pkg,
  amount,
  isTopUp,
  phone,
  suggestedNetwork,
}: ConfirmPaymentSheetProps) {
  const router = useRouter();
  const titleId = useId();
  const [network, setNetwork] = useState<MomoNetwork | null>(suggestedNetwork);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = amount + PAYMENT_FEE;
  const number = formatLocalNumber(phone);

  const pay = async () => {
    if (!network) return;
    setError(null);
    setIsPaying(true);
    const result = await requestMomoPayment({ packageId: pkg.id, amount, network });
    if (!result.ok) {
      setError(result.message);
      setIsPaying(false);
      return;
    }
    // Stays "paying" while the waiting screen opens.
    router.push(investPaymentHref(result.payment.id));
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "To",
      value: (
        <>
          {pkg.name} <span className="font-normal text-neutral-500 dark:text-neutral-400">· {pkg.ticker}</span>
        </>
      ),
    },
    { label: "From", value: <span className="tabular-nums">{number}</span> },
    { label: "Fee", value: PAYMENT_FEE === 0 ? "No fee" : formatCedis(PAYMENT_FEE, { exact: true }) },
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      canClose={!isPaying}
      // Up to just below the top of the amount screen's From card (its top
      // padding + 2.75rem header + 3.5rem gap): only the header shows above.
      className="min-h-[calc(100dvh-max(1rem,env(safe-area-inset-top))-6.25rem)]"
    >
      <h2 id={titleId} className="mt-4 text-center text-base font-semibold tracking-tight">
        Confirm payment
      </h2>

      {/* The amount, big: what this is all about. */}
      <div className="mt-5 text-center">
        <p className="text-[0.8125rem] text-neutral-500 dark:text-neutral-400">
          {isTopUp ? "You're adding" : "You're investing"}
        </p>
        <p className="mt-1.5 flex items-start justify-center gap-1.5 font-semibold tracking-tight tabular-nums">
          <span className="mt-0.5 text-base text-neutral-500 dark:text-neutral-400">{CEDI_SYMBOL}</span>
          <span className="text-[2.25rem] leading-none max-[360px]:text-[2rem]">
            {formatCedisNumber(amount, { exact: true })}
          </span>
        </p>
      </div>

      <dl className="mt-6 rounded-3xl bg-neutral-50 px-4 dark:bg-white/5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-neutral-200/70 py-2.5 text-[0.8125rem] dark:border-white/10"
          >
            <dt className="text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-[0.8125rem] font-semibold">Total</dt>
          <dd className="text-[0.9375rem] font-semibold tabular-nums">{formatCedis(total, { exact: true })}</dd>
        </div>
      </dl>

      {/* The network: real radio buttons (arrow keys, screen readers), drawn as tiles. */}
      <fieldset className="mt-5" disabled={isPaying}>
        <legend className="text-[0.8125rem] font-semibold">Pay with</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(MOMO_NETWORKS) as MomoNetwork[]).map((id) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl bg-neutral-50 px-1 py-2.5 text-center ring-inset transition-colors dark:bg-white/5",
                "has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600 dark:has-checked:bg-brand-500/10 dark:has-checked:ring-brand-500",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-400",
              )}
            >
              <input
                type="radio"
                name="momo-network"
                value={id}
                aria-label={MOMO_NETWORKS[id].name}
                checked={network === id}
                onChange={() => setNetwork(id)}
                className="sr-only"
              />
              <MomoNetworkLogo network={id} className="size-8" />
              <span className="text-[0.6875rem] leading-tight font-medium">{MOMO_NETWORKS[id].name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-3.5 text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {network ? (
          <>
            We&apos;ll send a prompt to <span className="font-medium text-foreground tabular-nums">{number}</span>.
            Approve it with your {MOMO_NETWORKS[network].name} PIN.
          </>
        ) : (
          "Choose your Mobile Money network."
        )}
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-5">
        <FormErrorMessage message={error} />
        {/* A slide, not a tap: money moves only on purpose. */}
        <SlideToConfirm
          label={`Slide to pay ${formatCedis(total, { exact: true })}`}
          onConfirm={pay}
          disabled={!network}
          isLoading={isPaying}
          loadingLabel="Sending the payment request"
        />
      </div>
    </BottomSheet>
  );
}
