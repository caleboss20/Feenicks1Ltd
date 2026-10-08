"use client";

/**
 * Package details: one package, laid out as a calm vertical page the user
 * scrolls through (no boxes inside boxes, regular text sizes, generous
 * spacing between sections).
 *
 *   ←            Package details
 *
 *   (🌱)  Agribusiness Capital
 *         ABC
 *   Agriculture-backed investment opportunities…
 *   [ Suits Moderate investors ]
 *
 *   KEY FIGURES
 *   Minimum investment                 GH₵ 5,000
 *   ─────────────────────────────────────────────
 *   Maximum investment              GH₵ 9,999.99
 *   …
 *
 *   ESTIMATE YOUR RETURNS
 *   Amount
 *   [ GH₵ 6000                                  ]
 *   Between GH₵ 5,000 and GH₵ 9,999.99
 *   Period
 *   ( 1 mo ) ( 3 mo ) ( 6 mo ) ( 12 mo )
 *
 *   You could receive over 6 months
 *   GH₵ … – GH₵ …                                ← after the fee
 *   About GH₵ … – GH₵ … a month
 *
 *   Profit before fee             GH₵ … – …
 *   Fee (4% a month)                 − GH₵ …
 *   …not guaranteed…
 *
 *   (            Choose ABC            )         ← pinned; opens the Terms
 *
 * The button follows their chosen package (saved when they agree to a
 * package's terms; Invest opens it) and the package rules (packagePolicy.ts:
 * for now, one investor, one package):
 *   - a package they haven't chosen   → "Choose ABC" → its terms → saved as
 *                                       their choice → back to Invest
 *   - their chosen package (in the app) → "Back to your package"
 *   - their package, invested         → a note with how much is in and how
 *                                       much more fits; "Back to your package"
 *   - another, while invested         → a note ("You're invested in …") and
 *                                       "View your package" instead
 * TODO(invest): "Add money" on their invested package once the amount step exists.
 * Everything else (figures, calculator) stays readable for every package.
 *
 * Estimate (estimateProfit): amount × monthly ROI × months, using the low
 * and high ends of the expected range; then the management fee comes off by
 * the CEO's formula (gross ROI − fee points, never more than the profit).
 *
 * Two flows, same screen (config/investingFlow.ts): Back and "Invest" stay in
 * the flow it was opened from: /invest/… in the app, /packages/… during onboarding.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import {
  INVESTING_ROUTES,
  packageDetailsHref,
  packageTermsHref,
  type InvestingFlow,
} from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import { useLeaveFinishedOnboarding } from "@/features/investor-profile/useLeaveFinishedOnboarding";
import { useTransactions } from "@/features/transactions/useTransactions";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  estimateProfit,
  riskLevelsForPackage,
  roiRangeLabel,
  withdrawalLabel,
  type InvestmentPackage,
} from "./investmentPackages";
import { PackageIcon } from "./PackageCard";
import { canInvest, investBlockedReason, investOptionFor } from "./packagePolicy";
import { PackageRuleNotice } from "./PackageRuleNotice";

/** Periods offered in the estimate, in months. */
const PERIODS = [1, 3, 6, 12];
const DEFAULT_PERIOD = 12;

/** Small, quiet section heading used throughout the page. */
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
      {children}
    </h3>
  );
}

/** One "label … value" row with a hairline divider. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3.5">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export function PackageDetailsScreen({ pkg, flow }: { pkg: InvestmentPackage; flow: InvestingFlow }) {
  const router = useRouter();
  const [months, setMonths] = useState(DEFAULT_PERIOD);
  const isLeaving = useLeaveFinishedOnboarding(packageDetailsHref(pkg.id, "app"), flow === "onboarding");
  // Can they put money in here (package rules)? null while their history loads.
  const transactions = useTransactions();
  const option = transactions ? investOptionFor(transactions, pkg.id) : null;
  const blockedReason = option ? investBlockedReason(option) : null;
  // Their package already, in the app: chosen (not invested yet), or invested in.
  const current = useCurrentAccount();
  const chosenId = current.status === "signed-in" ? current.account.chosenPackageId : null;
  const isChosenHere = flow === "app" && option?.kind === "new" && chosenId === pkg.id;
  const isYourPackage = flow === "app" && (isChosenHere || option?.kind === "top-up");

  // The amount to estimate: what they typed, or a sensible start. On their
  // own package, what they've invested (what their money could earn: any
  // total, since the range is per payment); otherwise the minimum.
  const [typedAmount, setTypedAmount] = useState<string | null>(null);
  const ownInvested = option?.kind === "top-up" ? option.invested : null;
  const amountText = typedAmount ?? String(ownInvested ?? pkg.minimum);

  const amount = Number(amountText.replace(/,/g, ""));
  const amountError =
    !amountText || Number.isNaN(amount)
      ? "Enter an amount"
      : amount < pkg.minimum
        ? `The minimum is ${formatCedis(pkg.minimum)}`
        : // The maximum is per payment; on their own package they can estimate their whole total.
          amount > pkg.maximum && ownInvested === null
          ? `The maximum is ${formatCedis(pkg.maximum)}`
          : null;

  const estimate = estimateProfit(pkg, amount, months);
  const suits = riskLevelsForPackage(pkg.id).map((level) => RISK_LEVELS[level].name);

  const facts = [
    { label: "Minimum investment", value: formatCedis(pkg.minimum) },
    { label: "Maximum investment", value: formatCedis(pkg.maximum) },
    { label: "Expected monthly return", value: roiRangeLabel(pkg.monthlyRoiPercent) },
    { label: "Management fee", value: `${pkg.managementFeePercent}% a month, off the return` },
    { label: "Withdrawals", value: withdrawalLabel(pkg) },
  ];

  const range = ([low, high]: [number, number]) => `${formatCedis(low)} – ${formatCedis(high)}`;
  /** Shorter range for table rows: "GH₵ 67.20 – 96" (one currency sign). */
  const shortRange = ([low, high]: [number, number]) =>
    `${formatCedis(low)} – ${formatCedis(high).replace("GH₵ ", "")}`;

  if (isLeaving) return null;

  return (
    <StepScreenLayout
      // Generic title: the package name is shown just below (never twice).
      title="Portfolio details"
      centeredTitle
      stickyHeader
      // Back to the packages list of the same flow.
      backHref={INVESTING_ROUTES[flow].packages}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* ── About ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 pt-2">
          <PackageIcon pkg={pkg} className="size-12" />
          <div className="min-w-0">
            <h2 className="text-lg leading-snug font-semibold">{pkg.name}</h2>
            <p className="text-[0.8125rem] text-neutral-500">{pkg.ticker}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {pkg.description}
        </p>
        {suits.length > 0 && (
          <p className="mt-4 w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
            Suits {suits.join(" and ")} investors
          </p>
        )}

        {/* ── Key figures ───────────────────────────────────────── */}
        <section aria-labelledby="figures-title" className="mt-10">
          <SectionTitle id="figures-title">Key figures</SectionTitle>
          <dl className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
            {facts.map((fact) => (
              <Row key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </dl>
        </section>

        {/* ── Estimate your returns ─────────────────────────────── */}
        <section aria-labelledby="estimate-title" className="mt-10">
          <SectionTitle id="estimate-title">Estimate your returns</SectionTitle>

          <label htmlFor="estimate-amount" className="mt-5 block text-sm text-neutral-600 dark:text-neutral-400">
            Amount
          </label>
          <div
            className={cn(
              "mt-2 flex h-12 items-center gap-2 rounded-xl border px-4 transition-colors",
              amountError
                ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                : "border-neutral-200 bg-background focus-within:border-brand-600 dark:border-white/10",
            )}
          >
            <span className="text-sm text-neutral-500">GH₵</span>
            <input
              id="estimate-amount"
              value={amountText}
              onChange={(event) => setTypedAmount(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? "estimate-amount-error" : "estimate-amount-hint"}
              // 16px text: smaller makes iPhones zoom in on tap.
              className="h-full w-0 min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          </div>
          {amountError ? (
            <p id="estimate-amount-error" role="alert" className="mt-2 text-xs text-red-600">
              {amountError}
            </p>
          ) : (
            <p id="estimate-amount-hint" className="mt-2 text-xs text-neutral-500">
              Between {formatCedis(pkg.minimum)} and {formatCedis(pkg.maximum)}
            </p>
          )}

          <p id="estimate-period" className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
            Period
          </p>
          <div role="radiogroup" aria-labelledby="estimate-period" className="mt-2 grid grid-cols-4 gap-2">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                role="radio"
                aria-checked={months === period}
                aria-label={`${period} ${period === 1 ? "month" : "months"}`}
                onClick={() => setMonths(period)}
                className={cn(
                  "h-9 cursor-pointer rounded-full border text-[0.8125rem] font-medium transition-colors",
                  months === period
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:text-neutral-300",
                )}
              >
                {period} mo
              </button>
            ))}
          </div>

          {/* Result: plain text, then the breakdown as quiet rows. */}
          <div aria-live="polite" className="mt-8">
            {amountError ? (
              <p className="text-sm text-neutral-500">Enter a valid amount to see an estimate.</p>
            ) : (
              <>
                <p className="text-sm text-neutral-500">
                  You could receive over {months} {months === 1 ? "month" : "months"}
                </p>
                <p className="mt-1.5 text-lg font-semibold text-brand-700 dark:text-brand-400">
                  {range(estimate.afterFee)}
                </p>
                <p className="mt-1 text-[0.8125rem] text-neutral-500">
                  About {range(estimate.afterFeePerMonth)} a month
                </p>

                <dl className="mt-5 divide-y divide-neutral-100 border-t border-neutral-100 dark:divide-white/10 dark:border-white/10">
                  <Row label="Profit before fee" value={shortRange(estimate.beforeFee)} />
                  <Row
                    label={`Fee (${pkg.managementFeePercent}% a month)`}
                    value={`− ${shortRange(estimate.fee)}`}
                  />
                </dl>
              </>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-neutral-400">
            Based on the expected monthly return. The management fee comes off that return: a 7%
            month with a {pkg.managementFeePercent}% fee pays {7 - pkg.managementFeePercent}%. It&apos;s never more than the
            month&apos;s profit. Returns are not guaranteed.
          </p>
        </section>

        {/* Investing (or adding money) starts with the package's Terms &
            Conditions, when the package rules allow it. */}
        <div className={cn(stickyActionsClass, "sm:mt-10")}>
          {option?.kind === "top-up" && (
            <p className="mb-3 text-center text-[0.8125rem] leading-relaxed text-neutral-600 dark:text-neutral-400">
              You&apos;ve invested{" "}
              <span className="font-semibold text-foreground">
                {formatCedis(option.invested, { exact: true })}
              </span>{" "}
              here. You can add more at any time: {formatCedis(pkg.minimum)} – {formatCedis(pkg.maximum)} per
              payment.
            </p>
          )}
          {blockedReason && (
            <div className="mb-3">
              <PackageRuleNotice>{blockedReason}</PackageRuleNotice>
            </div>
          )}

          {isChosenHere && (
            <p className="mb-3 text-center text-[0.8125rem] text-neutral-600 dark:text-neutral-400">
              This is your chosen portfolio.
            </p>
          )}

          {option?.kind === "limit-reached" ? (
            // Can't invest here: point them to the package they're in.
            <Button size="lg" fullWidth onClick={() => router.push(ROUTES.invest)}>
              View your portfolio
            </Button>
          ) : isYourPackage ? (
            // Already their package (chosen, or invested): nothing to choose.
            <Button size="lg" fullWidth onClick={() => router.push(ROUTES.invest)}>
              Back to your portfolio
            </Button>
          ) : (
            // Choosing it starts with its Terms; agreeing saves it as their package.
            <Button
              size="lg"
              fullWidth
              disabled={!option || !canInvest(option)}
              onClick={() => router.push(packageTermsHref(pkg.id, flow))}
            >
              Choose {pkg.ticker}
            </Button>
          )}
        </div>
      </div>
    </StepScreenLayout>
  );
}
