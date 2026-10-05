"use client";

/**
 * How much to invest (Invest › Continue), or add to their package (Invest ›
 * Add money), after the user's "Top Up" reference: a grey page with white
 * rounded cards, in our type.
 *
 *   (‹)                 Invest
 *              GH₵ 500 – GH₵ 2,999.99          ← top-up: "Invested: GH₵ 2,500.00"
 *   ╭─────────────────────────────────────────╮
 *   │ From   (M) MTN MoMo  [024 123 4567]      │  ← their MoMo number; network
 *   ╰─────────────────────────────────────────╯    from its prefix
 *   ╭─────────────────────────────────────────╮
 *   │ To     InvestWise Capital                │
 *   │        IC · 5–10% a month                │
 *   ╰─────────────────────────────────────────╯
 *   ╭─────────────────────────────────────────╮
 *   │ GH₵  1,500|                              │  ← opens the phone's number pad
 *   ╰─────────────────────────────────────────╯
 *     Between GH₵ 500 and GH₵ 2,999.99           ← red when outside the limits
 *   By proceeding, you authorize this payment and agree to the terms…
 *   Read Terms and Conditions
 *   (            Invest GH₵ 1,500            )   ← off for now
 *
 * Limits (packagePolicy.ts): a first investment within the package's
 * minimum–maximum; a top-up anything up to what's left before the maximum
 * (no minimum per top-up). Only for their own package: anything else goes
 * back to Invest.
 *
 * TODO(invest): the button, once the payment step is built (pay with MoMo,
 * approve on the phone, then "Transaction successful"). Off until then.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { packageTermsHref } from "@/config/investingFlow";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { formatLocalNumber, MOMO_NETWORKS, networkForNumber } from "@/lib/mobileMoney";
import { CEDI_SYMBOL, formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { roiRangeLabel, type InvestmentPackage } from "./investmentPackages";
import { canInvest, heldPackageIds, investOptionFor } from "./packagePolicy";

/** What can be typed: digits and one decimal point, at most 2 decimals, no leading zeros. */
function cleanAmount(raw: string): string {
  let clean = raw.replace(/[^\d.]/g, "");
  const dot = clean.indexOf(".");
  if (dot !== -1) clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return clean.replace(/^0+(?=\d)/, "").slice(0, 9);
}

/** "1500.5" → "1,500.5", as it's typed. */
function withCommas(clean: string): string {
  if (!clean) return "";
  const [whole, fraction] = clean.split(".");
  const wholeText = whole ? Number(whole).toLocaleString("en-GH") : "0";
  return fraction === undefined ? wholeText : `${wholeText}.${fraction}`;
}

export function InvestAmountScreen({ pkg }: { pkg: InvestmentPackage }) {
  useStatusBarColor(GREY_PAGE_COLORS);
  const router = useRouter();
  const current = useCurrentAccount();
  const transactions = useTransactions();
  const [amountText, setAmountText] = useState("");

  const isReady = current.status === "signed-in" && transactions !== null;
  const option = transactions ? investOptionFor(transactions, pkg.id) : null;
  const heldId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const chosenId = current.status === "signed-in" ? current.account.chosenPackageId : null;
  // Only their own package (the one they're in, or else their choice), and only if money can go in.
  const isTheirs = heldId ? heldId === pkg.id : chosenId === pkg.id;
  const isAllowed = Boolean(option && isTheirs && canInvest(option));

  useEffect(() => {
    if (isReady && !isAllowed) router.replace(ROUTES.invest);
  }, [isReady, isAllowed, router]);

  if (current.status !== "signed-in" || !option || !isAllowed) return null;

  const isTopUp = option.kind === "top-up";
  // A top-up has no minimum, only what's left before the package maximum.
  const minimum = isTopUp ? 0.01 : pkg.minimum;
  const maximum = isTopUp ? option.roomLeft : pkg.maximum;
  const amount = Number(amountText) || 0;
  // Checked as they type, both ways: red the moment it's below the minimum or above the maximum.
  const error = !amountText
    ? null
    : amount < minimum
      ? isTopUp
        ? "Enter an amount"
        : `The minimum is ${formatCedis(pkg.minimum)}`
      : amount > maximum
        ? isTopUp
          ? `You can add up to ${formatCedis(maximum, { exact: true })}`
          : `The maximum is ${formatCedis(pkg.maximum, { exact: true })}`
        : null;
  const hint = isTopUp
    ? `You can add up to ${formatCedis(maximum, { exact: true })}`
    : `Between ${formatCedis(pkg.minimum)} and ${formatCedis(pkg.maximum, { exact: true })}`;

  // From: their registered MoMo number, with the network worked out from it.
  const phone = current.account.phone;
  const network = networkForNumber(phone);

  const card = "rounded-3xl bg-white px-5 py-4 dark:bg-white/5";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-100 px-4 pt-[max(2.75rem,calc(env(safe-area-inset-top)+1.75rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-background">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <Link
          href={ROUTES.invest}
          aria-label="Back to your package"
          className="grid size-11 place-items-center rounded-full bg-white transition-colors hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-base font-semibold">{isTopUp ? "Add money" : "Invest"}</h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {isTopUp
              ? `Invested: ${formatCedis(option.invested, { exact: true })}`
              : `${formatCedis(pkg.minimum)} – ${formatCedis(pkg.maximum, { exact: true })}`}
          </p>
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-5">
        {/* From: the MoMo wallet the money comes from. */}
        <div className={cn(card, "flex min-h-16 items-center gap-4")}>
          <span className="w-10 shrink-0 text-sm text-neutral-500 dark:text-neutral-400">From</span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
            {network && (
              <span
                aria-hidden
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[0.5625rem] font-bold",
                  MOMO_NETWORKS[network].className,
                )}
              >
                {MOMO_NETWORKS[network].short}
              </span>
            )}
            <span className="text-[0.9375rem] font-medium">
              {network ? MOMO_NETWORKS[network].name : "Mobile Money"}
            </span>
            {phone && (
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 tabular-nums dark:bg-white/10 dark:text-neutral-300">
                {formatLocalNumber(phone)}
              </span>
            )}
          </span>
        </div>

        {/* To: their package. */}
        <div className={cn(card, "flex min-h-16 items-center gap-4")}>
          <span className="w-10 shrink-0 text-sm text-neutral-500 dark:text-neutral-400">To</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium">{pkg.name}</span>
            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
              {pkg.ticker} · {roiRangeLabel(pkg.monthlyRoiPercent)} a month
            </span>
          </span>
        </div>

        {/* The amount: big, with the phone's number pad; its hint sits close under it. */}
        <div>
          <label
            className={cn(
              card,
              "flex items-baseline gap-3 py-5 ring-inset focus-within:ring-2",
              error ? "ring-2 ring-red-500" : "focus-within:ring-brand-600/40",
            )}
          >
            <span aria-hidden className="text-xl font-semibold text-neutral-500 dark:text-neutral-400">
              {CEDI_SYMBOL}
            </span>
            <input
              aria-label={`Amount to ${isTopUp ? "add" : "invest"}, in cedis`}
              value={withCommas(amountText)}
              onChange={(event) => setAmountText(cleanAmount(event.target.value))}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby="amount-hint"
              className="w-0 min-w-0 flex-1 bg-transparent text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
            />
          </label>
          <p
            id="amount-hint"
            role={error ? "alert" : undefined}
            className={cn(
              "mt-2.5 px-2 text-xs",
              error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {error ?? hint}
          </p>
        </div>
      </div>

      <p className="mt-8 px-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        By proceeding, you authorize this payment and agree to the terms of {pkg.name}.
      </p>
      <Link
        href={packageTermsHref(pkg.id)}
        className="mt-1.5 w-fit px-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        Read Terms and Conditions
      </Link>

      {/* Off until the payment step exists (TODO(invest)). */}
      <Button size="lg" fullWidth disabled className="mt-10">
        {amount >= minimum && amount <= maximum
          ? `${isTopUp ? "Add" : "Invest"} ${formatCedis(amount, { exact: true })}`
          : isTopUp
            ? "Add money"
            : "Invest"}
      </Button>
      <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
        Paying with Mobile Money is the next step.
      </p>
    </div>
  );
}
