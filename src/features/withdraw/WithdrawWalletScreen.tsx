"use client";

/**
 * Withdraw (the dashboard's Withdraw button): first the wallet, like the
 * Invest wallet screen, then "Withdraw money" opens the amount screen.
 *
 *   ←          Agribusiness Capital               ← the package is the title (high up)
 *   ╭──────────────────────────────────────╮
 *   │ ABC                             [▦]  │      ← the same WalletCard as on Invest:
 *   │ GH₵ 6,000.00                     👁  │         balance, eye (hides amounts),
 *   │ Holder        Wallet ID              │         holder and wallet ID
 *   ╰──────────────────────────────────────╯
 *
 *
 *   (          Withdraw money          )          ← low on the screen → /withdraw/amount
 *
 * No status pill and no package-details link here: this screen is only the
 * way into a withdrawal. Not invested yet (or no phone number): the same
 * "Nothing to withdraw yet" screen as the amount step.
 */

import { LiquidPull } from "@/features/wallets/LiquidPull";
import { StepScreenLayout, walletActionsClass } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useWallet } from "@/features/wallets/useWallet";
import { WalletCard } from "@/features/wallets/WalletCard";
import { walletBalance } from "@/features/wallets/walletModel";
import { useHideAmounts } from "@/hooks/useHideAmounts";
import { firstDeposit } from "./withdrawalModel";
import { NothingToWithdraw } from "./WithdrawScreen";

export function WithdrawWalletScreen() {
  const current = useCurrentAccount();
  const transactions = useTransactions();
  const heldId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const wallet = useWallet(heldId);
  const [hideAmounts, toggleHideAmounts] = useHideAmounts();

  if (current.status !== "signed-in" || transactions === null) return null;

  const startedAt = heldId ? firstDeposit(transactions, heldId) : null;
  const phone = current.account.phone;
  if (!heldId || !startedAt || !phone) {
    return <NothingToWithdraw needsPhone={Boolean(heldId && startedAt && !phone)} />;
  }

  const pkg = INVESTMENT_PACKAGES[heldId];

  return (
    // Same layout as the Invest wallet: the package name high up, the card right under it.
    <StepScreenLayout title={pkg.name} centeredTitle stickyHeader compactTop backHref={ROUTES.dashboard}>
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* Pulling the card down is a shortcut to the same page as the button (LiquidPull). */}
        {wallet ? (
          <LiquidPull action="withdraw" href={ROUTES.withdrawAmount} tapHref={ROUTES.myInvestment}>
            <WalletCard
              wallet={wallet}
              pkg={pkg}
              holderName={current.account.fullName ?? current.account.email}
              balance={walletBalance(transactions, heldId)}
              hideAmounts={hideAmounts}
              onToggleHideAmounts={toggleHideAmounts}
            />
          </LiquidPull>
        ) : (
          // Same size while the wallet loads, so nothing jumps.
          <div aria-hidden className="aspect-[1.75] w-full animate-pulse rounded-xl bg-brand-600/20" />
        )}

        {/* The one action, at the bottom of the screen and always in view on
            first load (stuck there even on short screens: no scrolling to find it). */}
        <div className={walletActionsClass}>
          <ButtonLink href={ROUTES.withdrawAmount} size="lg" fullWidth className="h-13!">
            Withdraw money
          </ButtonLink>
        </div>
      </div>
    </StepScreenLayout>
  );
}
