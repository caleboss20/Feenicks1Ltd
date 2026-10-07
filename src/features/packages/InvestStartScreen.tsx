"use client";

/**
 * Invest (the dashboard's Invest button): the wallet of the investor's
 * package, after the user's bank-card reference.
 *
 *   ←          InvestWise Capital                 ← the package is the title
 *   ╭──────────────────────────────────────╮
 *   │ IC                              [▦]  │      ← WalletCard (features/wallets): the
 *   │ GH₵ 0.00                         👁  │         balance, the eye (hides amounts, same
 *   │ Holder   Wallet ID     🔒 Your choice │         setting as the dashboard), holder,
 *   ╰──────────────────────────────────────╯         wallet ID, status ("Invested" once paid)
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

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { investAmountHref, packageDetailsHref } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useTransactions } from "@/features/transactions/useTransactions";
import { WalletCard } from "@/features/wallets/WalletCard";
import { walletBalance, type PackageWallet } from "@/features/wallets/walletModel";
import { getWallet } from "@/features/wallets/walletService";
import { INVESTMENT_PACKAGES, type PackageId } from "./investmentPackages";
import { canInvest, heldPackageIds, investOptionFor } from "./packagePolicy";

/**
 * "Hide amounts", shared with the dashboard (DashboardScreen uses the same
 * key): hidden there, hidden here. A convenience on this device, not security.
 */
const HIDE_AMOUNTS_KEY = "feenicks1-hide-amounts";

function readHideAmounts(): boolean {
  try {
    return window.localStorage.getItem(HIDE_AMOUNTS_KEY) === "1";
  } catch {
    return false;
  }
}

function saveHideAmounts(hidden: boolean) {
  try {
    window.localStorage.setItem(HIDE_AMOUNTS_KEY, hidden ? "1" : "0");
  } catch {
    // Storage blocked: it just won't be remembered.
  }
}

/** The wallet for a package (created on first look if it predates wallets). Null while loading. */
function useWallet(packageId: PackageId | null): PackageWallet | null {
  const [wallet, setWallet] = useState<PackageWallet | null>(null);
  useEffect(() => {
    if (!packageId) return;
    let cancelled = false;
    void getWallet(packageId).then((found) => {
      if (!cancelled) setWallet(found);
    });
    return () => {
      cancelled = true;
    };
  }, [packageId]);
  return wallet && wallet.packageId === packageId ? wallet : null;
}

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
  const [hideAmounts, setHideAmounts] = useState(readHideAmounts);
  const toggleHideAmounts = () =>
    setHideAmounts((hidden) => {
      saveHideAmounts(!hidden);
      return !hidden;
    });

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
        {wallet ? (
          <WalletCard
            wallet={wallet}
            pkg={pkg}
            holderName={holderName}
            balance={balance}
            hideAmounts={hideAmounts}
            onToggleHideAmounts={toggleHideAmounts}
            status={isInvested ? "Invested" : "Your choice"}
            className="mt-2"
          />
        ) : (
          // Same size while the wallet loads, so nothing jumps.
          <div aria-hidden className="mt-2 aspect-[1.75] w-full animate-pulse rounded-xl bg-brand-600/20" />
        )}

        <div className="mt-auto flex flex-col items-center gap-3 pt-8">
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
