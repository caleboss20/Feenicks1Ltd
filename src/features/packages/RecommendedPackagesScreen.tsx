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
 * Two flows, same screen (config/investingFlow.ts):
 *   - onboarding (/packages): the last step of start investing; Back → the
 *     profile result; "Go to dashboard" finishes the journey
 *   - app (/invest, the dashboard's Invest button): Back → dashboard; the
 *     profile is a link (view it, or take it if they haven't yet)
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
import { useLeaveFinishedOnboarding } from "@/features/investor-profile/useLeaveFinishedOnboarding";
import {
  ALL_PACKAGES,
  INVESTMENT_PACKAGES,
  isPackageId,
  PACKAGES_FOR_RISK_LEVEL,
  type PackageId,
} from "./investmentPackages";
import { PackageCard, packageCardId } from "./PackageCard";

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
  const isLeaving = useLeaveFinishedOnboarding(ROUTES.invest, flow === "onboarding");
  const isApp = flow === "app";

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

  const matchedIds = riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel] : [];
  const matched = matchedIds.map((id) => INVESTMENT_PACKAGES[id]);
  const others = ALL_PACKAGES.filter((pkg) => !matchedIds.includes(pkg.id));

  const title = isApp ? "Investment packages" : riskLevel ? "Packages for you" : "Our packages";
  const backHref = isApp
    ? ROUTES.dashboard
    : riskLevel
      ? INVESTING_ROUTES.onboarding.profileResult
      : ROUTES.dashboard;

  return (
    <StepScreenLayout title={title} centeredTitle stickyHeader backHref={backHref}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {riskLevel ? (
            <>
              Based on your{" "}
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
              profile, {matched.length === 1 ? "this package suits" : "these packages suit"} you
              best.
            </>
          ) : (
            "Choose the package that fits your goals. Tap one to see its details."
          )}
        </p>

        {/* In the app, without a profile yet: invite them to find their best match. */}
        {isApp && !riskLevel && (
          <Link
            href={ROUTES.investorProfileQuestions}
            className="group mt-5 flex items-center gap-3.5 rounded-3xl bg-brand-50 p-4 transition-colors hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/15"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand-600 dark:bg-white/10 dark:text-brand-400">
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

        {matched.length > 0 && (
          <div className="mt-6 flex flex-col gap-5">
            {matched.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                flow={flow}
                isBestMatch={index === 0}
                isSelected={pkg.id === selectedId}
                onSelect={() => select(pkg.id)}
              />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <section className={matched.length > 0 ? "mt-12" : "mt-6"}>
            {matched.length > 0 && (
              <h2 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                Other packages
              </h2>
            )}
            <div className={matched.length > 0 ? "mt-4 flex flex-col gap-5" : "flex flex-col gap-5"}>
              {others.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  flow={flow}
                  isSelected={pkg.id === selectedId}
                  onSelect={() => select(pkg.id)}
                />
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs leading-relaxed text-neutral-400">
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
