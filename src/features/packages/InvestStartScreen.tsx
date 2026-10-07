"use client";

/**
 * Invest (the dashboard's Invest button): the wallet of the investor's
 * package, after the user's bank-card reference.
 *
 *   ←          InvestWise Capital                 ← the package is the title
 *               (🔒 Your choice)                  ← status, locked in ("Invested" once paid)
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
import { LockIcon } from "@/components/icons";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { investAmountHref, packageDetailsHref } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useTransactions } from "@/features/transactions/useTransactions";
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
    // The package's name is the page title, so the card sits right at the top.
    <StepScreenLayout title={pkg.name} centeredTitle stickyHeader backHref={ROUTES.dashboard}>
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* The card carries the balance (with the eye) and the status, like the reference card. */}
        {/* The status, locked in, right under the package name at the top: their
            choice (changeable until they invest), or invested (fixed). -mt-3 pulls
            it up against the title (the layout leaves a gap under the header). */}
        <span className="-mt-3 inline-flex items-center gap-1 self-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <LockIcon className="size-3.5" />
          {isInvested ? "Invested" : "Your choice"}
        </span>

        {wallet ? (
          <WalletCard
            wallet={wallet}
            pkg={pkg}
            holderName={holderName}
            balance={balance}
            hideAmounts={hideAmounts}
            onToggleHideAmounts={toggleHideAmounts}
            className="mt-4"
          />
        ) : (
          // Same size while the wallet loads, so nothing jumps.
          <div aria-hidden className="mt-4 aspect-[1.75] w-full animate-pulse rounded-xl bg-brand-600/20" />
        )}

        {/* Pinned low on the screen (-mb-4 trims the page's bottom padding), with a
            slightly shorter button (h-13, 52px) than the standard large one. */}
        <div className="mt-auto -mb-4 flex flex-col items-center gap-2.5 pt-8">
          {canInvest(option) && (
            <ButtonLink href={investAmountHref(pkg.id)} size="lg" fullWidth className="h-13!">
              {isInvested ? "Add money" : "Continue"}
            </ButtonLink>
          )}
          {!isInvested && (
            <ButtonLink href={ROUTES.investPackages} variant="soft" size="lg" fullWidth className="h-13!">
              Change package
            </ButtonLink>
          )}
          <Link
            href={packageDetailsHref(pkg.id)}
            className="px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-400"
          >
            See package details
          </Link>
        </div>
      </div>
    </StepScreenLayout>
  );
}
