"use client";

/**
 * Invest (the dashboard's Invest button): the wallet of the investor's
 * package, after the user's bank-card reference.
 *
 *   ←          InvestWise Capital                 ← the package is the title
 *   ╭──────────────────────────────────────╮
 *   │ IC                              [▦]  │      ← WalletCard (features/wallets): the
 *   │ GH₵ 0.00                         👁  │         balance, the eye (hides amounts, same
 *   │ Holder        Wallet ID              │         setting as the dashboard), holder and
 *   ╰──────────────────────────────────────╯         wallet ID
 *   (             Continue             )          ← "Add money" once invested
 *   (          Change package          )          ← not once invested
 *             See package details
 *
 * The wallet is created when the package is chosen (terms accepted), so a
 * new investor sees it at GH₵ 0.00 before their first payment.
 *
 * The three cases (one investor, one package: packagePolicy.ts):
 *   - chose a package at sign-up but hasn't invested: this screen, with
 *     Change package (free until money goes in)
 *   - invested: this screen, locked (no Change package)
 *   - never chose: straight to the packages list, to choose one
 *
 * Continue / Add money opens the amount screen (InvestAmountScreen), then
 * the payment.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepScreenLayout, walletActionsClass } from "@/components/layout/StepScreenLayout";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { investAmountHref, packageDetailsHref } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useTransactions } from "@/features/transactions/useTransactions";
import { LiquidPull } from "@/features/wallets/LiquidPull";
import { WalletCard } from "@/features/wallets/WalletCard";
import { useWallet } from "@/features/wallets/useWallet";
import { walletBalance } from "@/features/wallets/walletModel";
import { useHideAmounts } from "@/hooks/useHideAmounts";
import { INVESTMENT_PACKAGES } from "./investmentPackages";
import { canInvest, heldPackageIds, investOptionFor } from "./packagePolicy";

export function InvestStartScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const transactions = useTransactions();

  const isReady = current.status === "signed-in" && transactions !== null;
  // The package they're in comes first (it's locked); otherwise their choice.
  const heldId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const chosenId = current.status === "signed-in" ? current.account.chosenPackageId : null;
  const packageId = heldId ?? chosenId;
  const wallet = useWallet(packageId);
  const [hideAmounts, toggleHideAmounts] = useHideAmounts();

  // Never chose one: the list, to choose.
  useEffect(() => {
    if (isReady && !packageId) router.replace(ROUTES.investPackages);
  }, [isReady, packageId, router]);

  if (current.status !== "signed-in" || transactions === null || !packageId) return null;

  const pkg = INVESTMENT_PACKAGES[packageId];
  const option = investOptionFor(transactions, packageId);
  const isInvested = option.kind === "top-up";
  const balance = walletBalance(transactions, packageId);
  const holderName = current.account.fullName ?? current.account.email;

  return (
    // The package's name is the title, high up (compactTop), with the card right under it.
    <StepScreenLayout title={pkg.name} centeredTitle stickyHeader compactTop backHref={ROUTES.dashboard}>
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* The card carries the balance (with the eye) and the status, like the reference card.
            Pulling it down is a shortcut to the same page as the button (LiquidPull). */}
        {wallet ? (
          <LiquidPull
            action={isInvested ? "add money" : "invest"}
            href={investAmountHref(pkg.id)}
            disabled={!canInvest(option)}
            tapHref={isInvested ? ROUTES.myInvestment : undefined}
          >
            <WalletCard
              wallet={wallet}
              pkg={pkg}
              holderName={holderName}
              balance={balance}
              hideAmounts={hideAmounts}
              onToggleHideAmounts={toggleHideAmounts}
              className="mt-0"
            />
          </LiquidPull>
        ) : (
          // Same size while the wallet loads, so nothing jumps.
          <div aria-hidden className="mt-0 aspect-[1.75] w-full animate-pulse rounded-xl bg-brand-600/20" />
        )}

        {/* At the bottom of the screen and always in view on first load (stuck
            there even on short screens: no scrolling to find the button), with a
            slightly shorter button (h-13, 52px) than the standard large one. */}
        <div className={cn(walletActionsClass, "flex flex-col items-center gap-2.5")}>
          {canInvest(option) && (
            <ButtonLink href={investAmountHref(pkg.id)} size="lg" fullWidth className="h-13!">
              {isInvested ? "Add money" : "Continue"}
            </ButtonLink>
          )}
          {!isInvested && (
            <ButtonLink href={ROUTES.investPackages} variant="soft" size="lg" fullWidth className="h-13!">
              Change portfolio
            </ButtonLink>
          )}
          <Link
            href={packageDetailsHref(pkg.id)}
            className="px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-400"
          >
            See portfolio details
          </Link>
        </div>
      </div>
    </StepScreenLayout>
  );
}
