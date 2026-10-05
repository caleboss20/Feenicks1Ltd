"use client";

/**
 * Invest (the dashboard's Invest button): opens the investor's package.
 *
 *   ←              Invest
 *   YOUR PACKAGE
 *   ╭─────────────────────────────────────────╮   ← highlighted (green)
 *   │ (icon) IC  🔒 Your choice               │   ← "🔒 Invested" once money is in
 *   │        InvestWise Capital                │
 *   │ Expected return    5–10% /month          │
 *   │ Amount             GH₵ 500 – 2,999.99    │   ← invested: what's in, what's left
 *   │ Withdrawals        Monthly               │
 *   ╰─────────────────────────────────────────╯
 *   For now, you can invest in one package at a time. You can change your
 *   choice until you invest.
 *   (             Continue             )          ← "Add money" once invested;
 *                                                    none at the maximum
 *   (          Change package          )          ← not once invested
 *             See package details
 *
 * The three cases (one investor, one package: packagePolicy.ts):
 *   - chose a package at sign-up (agreed to its terms) but hasn't invested:
 *     this screen, with Change package. That opens the list with their choice
 *     marked; agreeing to another package's terms saves it as the new choice
 *     and comes back here. Changing is free until money goes in.
 *   - invested: this screen, locked (no Change package)
 *   - never chose: straight to the packages list, to choose one
 *
 * Continue / Add money opens the amount screen (InvestAmountScreen).
 * TODO(invest): then the payment step, once built.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockIcon } from "@/components/icons";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { investAmountHref, packageDetailsHref } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useTransactions } from "@/features/transactions/useTransactions";
import { formatCedis } from "@/lib/money";
import { INVESTMENT_PACKAGES, roiRangeLabel, withdrawalLabel, type InvestmentPackage } from "./investmentPackages";
import { canInvest, heldPackageIds, investOptionFor, PACKAGE_LIMIT_SENTENCE, type InvestOption } from "./packagePolicy";
import { PackageIcon } from "./PackageCard";

export function InvestStartScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const transactions = useTransactions();

  const isReady = current.status === "signed-in" && transactions !== null;
  // The package they're in comes first (it's locked); otherwise their choice.
  const heldId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const chosenId = current.status === "signed-in" ? current.account.chosenPackageId : null;
  const packageId = heldId ?? chosenId;

  // Never chose one: the list, to choose.
  useEffect(() => {
    if (isReady && !packageId) router.replace(ROUTES.investPackages);
  }, [isReady, packageId, router]);

  if (current.status !== "signed-in" || transactions === null || !packageId) return null;

  const pkg = INVESTMENT_PACKAGES[packageId];
  const option = investOptionFor(transactions, packageId);
  const isInvested = option.kind === "top-up" || option.kind === "at-maximum";

  return (
    <StepScreenLayout title="Invest" centeredTitle stickyHeader backHref={ROUTES.dashboard}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <h2 className="pt-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          {isInvested ? "You're invested in" : "Your package"}
        </h2>

        <YourPackageCard pkg={pkg} option={option} isInvested={isInvested} />

        <p className="mt-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {PACKAGE_LIMIT_SENTENCE}{" "}
          {isInvested
            ? "This is the package your money is in."
            : "This is the package you chose. You can change it until you invest."}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {/* Money in: the first investment, or more on top (none once it's at the maximum). */}
          {canInvest(option) && (
            <ButtonLink href={investAmountHref(pkg.id)} size="lg" fullWidth>
              {isInvested ? "Add money" : "Continue"}
            </ButtonLink>
          )}
          {!isInvested && (
            <ButtonLink href={ROUTES.investPackages} variant="soft" size="lg" fullWidth>
              Change package
            </ButtonLink>
          )}
          <Link
            href={packageDetailsHref(pkg.id)}
            className="px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-400"
          >
            See package details
          </Link>
        </div>
      </div>
    </StepScreenLayout>
  );
}

/** The package, highlighted and locked in: their choice, or the one they're invested in. */
function YourPackageCard({
  pkg,
  option,
  isInvested,
}: {
  pkg: InvestmentPackage;
  option: InvestOption;
  isInvested: boolean;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Expected return", value: `${roiRangeLabel(pkg.monthlyRoiPercent)} a month` },
    ...(option.kind === "top-up"
      ? [
          { label: "Invested", value: formatCedis(option.invested, { exact: true }) },
          { label: "You can add", value: `Up to ${formatCedis(option.roomLeft, { exact: true })}` },
        ]
      : option.kind === "at-maximum"
        ? [
            { label: "Invested", value: formatCedis(option.invested, { exact: true }) },
            { label: "You can add", value: "Nothing more: it's at its maximum" },
          ]
        : [{ label: "Amount", value: `${formatCedis(pkg.minimum)} – ${formatCedis(pkg.maximum)}` }]),
    { label: "Withdrawals", value: withdrawalLabel(pkg.withdrawalEveryMonths) },
  ];

  return (
    <section
      aria-label={`${isInvested ? "Invested in" : "Your choice:"} ${pkg.name}`}
      className="mt-3 rounded-3xl bg-brand-50 p-5 ring-2 ring-brand-600 ring-inset dark:bg-brand-500/10 dark:ring-brand-500"
    >
      <div className="flex items-center gap-3">
        <PackageIcon pkg={pkg} className="size-11" />
        <div className="min-w-0">
          {/* The tag sits by the ticker (as on the package cards), so the name
              has the full width and never gets cut off. */}
          <p className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            {pkg.ticker}
            {/* Locked in: their choice (changeable until they invest), or invested (fixed). */}
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
              <LockIcon className="size-3" />
              {isInvested ? "Invested" : "Your choice"}
            </span>
          </p>
          <p className="mt-1 text-lg leading-snug font-semibold">{pkg.name}</p>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2.5 border-t border-brand-600/15 pt-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-neutral-600 dark:text-neutral-400">{row.label}</dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
