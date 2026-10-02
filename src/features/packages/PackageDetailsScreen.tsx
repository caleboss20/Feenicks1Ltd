"use client";

/**
 * Package details: everything about one package, plus a returns estimate.
 *
 *   ←          Package details
 *   (💼)  Mutual Fund Capital · MFC
 *   An entry-level investment portfolio…
 *   Suits: Conservative · Moderate investors
 *
 *   Minimum investment        GH₵ 140
 *   Maximum investment        GH₵ 499.99
 *   Monthly ROI (expected)    5–10%
 *   Management fee            2%
 *   Withdrawals               Every month
 *
 *   ESTIMATE YOUR RETURNS
 *   Amount   [ GH₵ 300        ]
 *   Period   (1) (3) (6) (12 months)
 *   ┌ Estimated return over 12 months ┐
 *   │ GH₵ 180 – GH₵ 360               │
 *   │ GH₵ 15 – GH₵ 30 per month       │
 *   └─────────────────────────────────┘
 *   Estimates before the 2% management fee. Not guaranteed.
 *
 *   (        Invest in MFC        )
 *
 * Estimate = amount × monthly ROI × months (simple monthly returns, using
 * the low and high ends of the expected range).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  riskLevelsForPackage,
  roiRangeLabel,
  withdrawalLabel,
  type InvestmentPackage,
} from "./investmentPackages";
import { PackageIcon } from "./PackageCard";

/** Periods offered in the estimate, in months. */
const PERIODS = [1, 3, 6, 12];
const DEFAULT_PERIOD = 12;

/**
 * Where "Invest" leads.
 * TODO(invest): the investment flow (amount → payment by MoMo/bank → confirm) once built.
 */
const INVEST_SCREEN = ROUTES.dashboard;

export function PackageDetailsScreen({ pkg }: { pkg: InvestmentPackage }) {
  const router = useRouter();
  const [amountText, setAmountText] = useState(String(pkg.minimum));
  const [months, setMonths] = useState(DEFAULT_PERIOD);

  const amount = Number(amountText.replace(/,/g, ""));
  const amountError =
    !amountText || Number.isNaN(amount)
      ? "Enter an amount"
      : amount < pkg.minimum
        ? `The minimum is ${formatCedis(pkg.minimum)}`
        : amount > pkg.maximum
          ? `The maximum is ${formatCedis(pkg.maximum)}`
          : null;

  const [lowRoi, highRoi] = pkg.monthlyRoiPercent;
  const perMonth = [(amount * lowRoi) / 100, (amount * highRoi) / 100];
  const total = [perMonth[0] * months, perMonth[1] * months];

  const suits = riskLevelsForPackage(pkg.id).map((level) => RISK_LEVELS[level].name);

  const facts = [
    { label: "Minimum investment", value: formatCedis(pkg.minimum) },
    { label: "Maximum investment", value: formatCedis(pkg.maximum) },
    { label: "Monthly ROI (expected)", value: roiRangeLabel(pkg.monthlyRoiPercent) },
    { label: "Management fee", value: `${pkg.managementFeePercent}%` },
    { label: "Withdrawals", value: withdrawalLabel(pkg.withdrawalEveryMonths) },
  ];

  return (
    <StepScreenLayout
      // Generic title: the package name is shown big just below (never twice).
      title="Package details"
      centeredTitle
      stickyHeader
      backHref={ROUTES.packages}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* Identity */}
        <div className="flex items-center gap-3.5">
          <PackageIcon pkg={pkg} className="size-13 [&_svg]:size-6" />
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-bold">{pkg.name}</h2>
            <p className="text-sm font-medium text-neutral-500">{pkg.ticker}</p>
          </div>
        </div>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
          {pkg.description}
        </p>
        {suits.length > 0 && (
          <p className="mt-2 text-sm text-neutral-500">
            Suits <span className="font-semibold text-foreground">{suits.join(" · ")}</span>{" "}
            investors
          </p>
        )}

        {/* Key figures */}
        <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-white/10 dark:border-white/10">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-neutral-500">{fact.label}</dt>
              <dd className="text-right text-sm font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {/* Returns estimate */}
        <section className="mt-8" aria-labelledby="estimate-title">
          <h3
            id="estimate-title"
            className="text-xs font-semibold tracking-wider text-neutral-500 uppercase"
          >
            Estimate your returns
          </h3>

          <label htmlFor="estimate-amount" className="mt-4 block text-[0.8125rem] font-medium text-neutral-500">
            Amount
          </label>
          <div
            className={cn(
              "mt-2 flex h-13 items-center gap-2 rounded-xl border px-4 transition-colors",
              amountError
                ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                : "border-transparent bg-neutral-100 focus-within:border-brand-600 focus-within:bg-brand-50 dark:bg-white/5 dark:focus-within:bg-brand-500/10",
            )}
          >
            <span className="text-base font-semibold text-neutral-500">GH₵</span>
            <input
              id="estimate-amount"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? "estimate-amount-error" : "estimate-amount-hint"}
              className="h-full w-0 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none"
            />
          </div>
          {amountError ? (
            <p id="estimate-amount-error" role="alert" className="mt-2 px-1 text-sm text-red-600">
              {amountError}
            </p>
          ) : (
            <p id="estimate-amount-hint" className="mt-2 px-1 text-xs text-neutral-500">
              Between {formatCedis(pkg.minimum)} and {formatCedis(pkg.maximum)}
            </p>
          )}

          <p className="mt-4 text-[0.8125rem] font-medium text-neutral-500" id="estimate-period">
            Period
          </p>
          <div role="radiogroup" aria-labelledby="estimate-period" className="mt-2 grid grid-cols-4 gap-2">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                role="radio"
                aria-checked={months === period}
                onClick={() => setMonths(period)}
                className={cn(
                  "h-10 cursor-pointer rounded-xl border text-sm font-semibold transition-colors",
                  months === period
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:text-neutral-300",
                )}
              >
                {period} mo
              </button>
            ))}
          </div>

          {/* The result, or nothing while the amount is invalid. */}
          <div
            aria-live="polite"
            className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/10"
          >
            {amountError ? (
              <p className="text-sm text-neutral-500">Enter a valid amount to see an estimate.</p>
            ) : (
              <>
                <p className="text-[0.8125rem] text-neutral-600 dark:text-neutral-400">
                  Estimated return over {months} {months === 1 ? "month" : "months"}
                </p>
                <p className="mt-1 text-xl font-bold text-brand-700 dark:text-brand-300">
                  {formatCedis(total[0])} – {formatCedis(total[1])}
                </p>
                <p className="mt-1 text-[0.8125rem] text-neutral-600 dark:text-neutral-400">
                  {formatCedis(perMonth[0])} – {formatCedis(perMonth[1])} per month
                </p>
              </>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            Estimates use the expected monthly ROI, before the {pkg.managementFeePercent}%
            management fee. Returns are not guaranteed.
          </p>
        </section>

        <div className={stickyActionsClass}>
          <Button size="lg" fullWidth onClick={() => router.push(INVEST_SCREEN)}>
            Invest in {pkg.ticker}
          </Button>
        </div>
      </div>
    </StepScreenLayout>
  );
}
