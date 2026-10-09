"use client";

/**
 * The investment packages: those matching the user's risk level first (the
 * first is the "Best match"), then the rest under "Other packages". Tap any
 * card for details.
 *
 *   ←          Packages for you            ← in the app: "Investment packages"
 *   Based on your Moderate profile, these suit you best.
 *   [ Agribusiness Capital      Best match ]
 *   [ Mutual Fund Capital                  ]
 *   OTHER PACKAGES
 *   [ InvestWise Capital                   ]
 *   [ Real Estate Pool Fund                ]
 *   (          Go to dashboard          )    ← onboarding only
 *
 * Without a risk profile (skipped), all packages are listed as equals.
 * The package the user taps is highlighted (green fill and outline), and stays
 * highlighted, scrolled into view, when they come back from its details.
 *
 * Once they've invested, the package rules apply (packagePolicy.ts: for now,
 * one investor, one package):
 *
 *   You're invested in InvestWise Capital. Add money to it any time…
 *   YOUR PACKAGE
 *   [ InvestWise Capital   Your package    Invested GH₵ 2,500 ]
 *   OTHER PACKAGES
 *   (🔒 For now, you can invest in one package at a time…)
 *   [ Agribusiness Capital  Best match                      🔒 ]  ← can be opened
 *   …                                                                to read, not invested in
 *
 * Two flows, same screen (config/investingFlow.ts):
 *   - onboarding (/packages): the last step of start investing; Back → the
 *     profile result; "Go to dashboard" finishes the journey
 *   - app (/invest/packages: Invest › Change package, or Invest when they
 *     haven't chosen one): Back → their package (Invest), or Home; the
 *     profile is a link (view it, or take it if they haven't yet). Their
 *     chosen package is marked "Your choice" until they invest.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, TargetIcon } from "@/components/icons";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { INVESTING_ROUTES, type InvestingFlow } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import { recommendedPortfolioIds, segmentInfo } from "@/features/investor-profile/investorSegments";
import { useLeaveFinishedOnboarding } from "@/features/investor-profile/useLeaveFinishedOnboarding";
import { useTransactions } from "@/features/transactions/useTransactions";
import {
  ALL_PACKAGES,
  INVESTMENT_PACKAGES,
  isPackageId,
  type PackageId,
} from "./investmentPackages";
import { PackageCard, packageCardId } from "./PackageCard";
import {
  amountInvestedIn,
  heldPackageIds,
  MAX_PACKAGES_PER_INVESTOR,
  PACKAGE_LIMIT_SENTENCE,
} from "./packagePolicy";
import { PackageRuleNotice } from "./PackageRuleNotice";

/** Small uppercase heading above a group of cards. */
const SECTION_TITLE = "text-xs font-semibold tracking-wider text-neutral-500 uppercase";

/** The package last picked from this list (this tab session), highlighted on return. */
const SELECTED_PACKAGE_KEY = "feenicks1-selected-package";

function readSelectedPackage(): PackageId | null {
  try {
    const saved = window.sessionStorage.getItem(SELECTED_PACKAGE_KEY);
    return saved && isPackageId(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function RecommendedPackagesScreen({ flow }: { flow: InvestingFlow }) {
  const router = useRouter();
  const current = useCurrentAccount();
  const riskLevel = current.status === "signed-in" ? current.account.riskLevel : null;
  const segment = current.status === "signed-in" ? current.account.investorSegment : null;
  const isLeaving = useLeaveFinishedOnboarding(ROUTES.investPackages, flow === "onboarding");
  const isApp = flow === "app";
  // The package they chose (at sign-up or since): marked "Your choice" until they invest.
  const chosenId = current.status === "signed-in" ? current.account.chosenPackageId : null;

  // The package rules (packagePolicy.ts): the packages they're in come first;
  // once they're in as many as allowed (for now, one), the rest can be read
  // but not invested in.
  const transactions = useTransactions();
  const heldIds = transactions ? heldPackageIds(transactions) : [];
  const isAtLimit = heldIds.length >= MAX_PACKAGES_PER_INVESTOR;

  // Highlight the package the user picks, and keep it highlighted when they
  // come back from its details. (This screen only renders in the browser.)
  const [selectedId, setSelectedId] = useState<PackageId | null>(readSelectedPackage);
  const select = (id: PackageId) => {
    setSelectedId(id);
    try {
      window.sessionStorage.setItem(SELECTED_PACKAGE_KEY, id);
    } catch {
      // Storage blocked: it's just not remembered.
    }
  };

  // Back on the list: bring the highlighted package into view if it's off screen.
  useEffect(() => {
    if (!selectedId || isLeaving) return;
    const card = document.getElementById(packageCardId(selectedId));
    const box = card?.getBoundingClientRect();
    if (card && box && (box.top < 0 || box.bottom > window.innerHeight)) {
      card.scrollIntoView({ block: "center" });
    }
    // Only on arrival, not on every tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeaving]);

  if (isLeaving) return null;

  // The top recommendation keeps its label even if listed lower down.
  // Student / Investor / Business owner narrows it; the risk level orders it.
  const recommendedIds = riskLevel ? recommendedPortfolioIds(riskLevel, segment) : [];
  const bestMatchId = recommendedIds[0] ?? null;
  const matchedIds = recommendedIds.filter(
    (id) => !heldIds.includes(id),
  );
  const matched = matchedIds.map((id) => INVESTMENT_PACKAGES[id]);
  const others = ALL_PACKAGES.filter(
    (pkg) => !matchedIds.includes(pkg.id) && !heldIds.includes(pkg.id),
  );
  const yours = heldIds.map((id) => INVESTMENT_PACKAGES[id]);
  const yourNames = yours.map((pkg) => pkg.name).join(" and ");
  // Not invested yet, but chose one: it's marked, and they can pick another.
  const isChoosing = isApp && yours.length === 0 && chosenId !== null;

  const card = (pkg: (typeof ALL_PACKAGES)[number], extra?: Partial<React.ComponentProps<typeof PackageCard>>) => (
    <PackageCard
      key={pkg.id}
      pkg={pkg}
      flow={flow}
      isBestMatch={pkg.id === bestMatchId}
      isChosen={isChoosing && pkg.id === chosenId}
      isSelected={pkg.id === selectedId}
      onSelect={() => select(pkg.id)}
      {...extra}
    />
  );

  const title = isApp ? "Investment portfolios" : riskLevel ? "Portfolios for you" : "Our portfolios";
  // In the app: back to their package (Invest) if they have one, else Home.
  const backHref = isApp
    ? yours.length > 0 || chosenId
      ? ROUTES.invest
      : ROUTES.dashboard
    : riskLevel
      ? INVESTING_ROUTES.onboarding.profileResult
      : ROUTES.dashboard;

  return (
    <StepScreenLayout title={title} centeredTitle stickyHeader backHref={backHref}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {yours.length > 0 ? (
            // Already investing: start from what they have.
            <>
              You&apos;re invested in{" "}
              <span className="font-semibold text-foreground">{yourNames}</span>.{" "}
              {isAtLimit
                ? `Add money to ${yours.length === 1 ? "it" : "them"} any time, up to the portfolio maximum.`
                : "You can add money to it, or invest in another portfolio too."}
            </>
          ) : riskLevel ? (
            <>
              {segment ? (
                <>
                  As <span className="font-semibold text-foreground">{segmentInfo(segment).phrase}</span> with a{" "}
                </>
              ) : (
                "Based on your "
              )}
              {isApp ? (
                // In the app the profile is a link: view it (and retake it from there).
                <Link
                  href={ROUTES.investorProfile}
                  className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 dark:text-brand-400"
                >
                  {RISK_LEVELS[riskLevel].name}
                </Link>
              ) : (
                <span className="font-semibold text-brand-700 dark:text-brand-400">
                  {RISK_LEVELS[riskLevel].name}
                </span>
              )}{" "}
              profile, {matched.length === 1 ? "this portfolio suits" : "these portfolios suit"} you
              best.
            </>
          ) : (
            "Choose the portfolio that fits your goals. Tap one to see its details."
          )}
        </p>
        {isChoosing && (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Your choice is marked. To change it, open another portfolio and choose it: you can
            change until you invest.
          </p>
        )}

        {/* In the app, without a profile yet: invite them to find their best match
            (unless they can't take another package anyway). */}
        {isApp && !riskLevel && !isAtLimit && (
          <Link
            href={ROUTES.investorProfileQuestions}
            className="group mt-5 flex items-center gap-3.5 rounded-3xl bg-brand-50 p-4 transition-colors hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/15"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand-700 dark:bg-white/10 dark:text-brand-400">
              <TargetIcon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Find your best match</span>
              <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
                Answer 6 quick questions about your goals.
              </span>
            </span>
            <ArrowRight className="size-4 text-brand-700 dark:text-brand-400" />
          </Link>
        )}

        {yours.length > 0 ? (
          <>
            {/* Investing already: their package first, then everything else
                (best matches first), locked once they're at the limit. */}
            <section aria-labelledby="your-package-title" className="mt-6">
              <h2 id="your-package-title" className={SECTION_TITLE}>
                {yours.length === 1 ? "Your portfolio" : "Your portfolios"}
              </h2>
              <div className="mt-4 flex flex-col gap-5">
                {yours.map((pkg) =>
                  card(pkg, { isYours: true, invested: amountInvestedIn(transactions ?? [], pkg.id) }),
                )}
              </div>
            </section>

            {matched.length + others.length > 0 && (
              <section aria-labelledby="other-packages-title" className="mt-12">
                <h2 id="other-packages-title" className={SECTION_TITLE}>
                  Other portfolios
                </h2>
                {isAtLimit && (
                  <div className="mt-4">
                    <PackageRuleNotice>
                      {PACKAGE_LIMIT_SENTENCE} You can still open these to read about them and
                      try the returns calculator.
                    </PackageRuleNotice>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-5">
                  {[...matched, ...others].map((pkg) => card(pkg, { isLocked: isAtLimit }))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {matched.length > 0 && (
              <div className="mt-6 flex flex-col gap-5">{matched.map((pkg) => card(pkg))}</div>
            )}

            {others.length > 0 && (
              <section className={matched.length > 0 ? "mt-12" : "mt-6"}>
                {matched.length > 0 && <h2 className={SECTION_TITLE}>Other portfolios</h2>}
                <div className={matched.length > 0 ? "mt-4 flex flex-col gap-5" : "flex flex-col gap-5"}>
                  {others.map((pkg) => card(pkg))}
                </div>
              </section>
            )}
          </>
        )}

        <p className="mt-8 text-xs leading-relaxed text-neutral-500">
          Returns are expected ranges, not guaranteed. Past performance doesn&apos;t guarantee
          future results.
        </p>

        {/* Onboarding only: the way out of the start-investing journey. */}
        {!isApp && (
          <div className={stickyActionsClass}>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => router.replace(ROUTES.dashboard)}
              className="text-[0.9375rem] text-neutral-600 lg:text-sm dark:text-neutral-400"
            >
              Go to dashboard
            </Button>
          </div>
        )}
      </div>
    </StepScreenLayout>
  );
}
