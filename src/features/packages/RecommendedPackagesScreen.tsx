"use client";

/**
 * "Packages for you": shown after the investor profile result. The packages
 * that match the user's risk level come first (the first is the "Best
 * match"); the rest follow under "Other packages". Tap any card for details.
 *
 *   ←          Packages for you
 *   Based on your Moderate profile, these suit you best.
 *   [ Agribusiness Capital      Best match ]
 *   [ Mutual Fund Capital                  ]
 *   OTHER PACKAGES
 *   [ InvestWise Capital                   ]
 *   [ Real Estate Pool Fund                ]
 *   (          Go to dashboard          )
 *
 * Without a risk profile (skipped), all packages are listed as equals.
 */

import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import { ALL_PACKAGES, INVESTMENT_PACKAGES, PACKAGES_FOR_RISK_LEVEL } from "./investmentPackages";
import { PackageCard } from "./PackageCard";

export function RecommendedPackagesScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const riskLevel = current.status === "signed-in" ? current.account.riskLevel : null;

  const matchedIds = riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel] : [];
  const matched = matchedIds.map((id) => INVESTMENT_PACKAGES[id]);
  const others = ALL_PACKAGES.filter((pkg) => !matchedIds.includes(pkg.id));

  return (
    <StepScreenLayout
      title={riskLevel ? "Packages for you" : "Our packages"}
      centeredTitle
      stickyHeader
      backHref={riskLevel ? ROUTES.riskProfileResult : ROUTES.dashboard}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {riskLevel ? (
            <>
              Based on your{" "}
              <span className="font-semibold text-brand-700 dark:text-brand-400">
                {RISK_LEVELS[riskLevel].name}
              </span>{" "}
              profile, {matched.length === 1 ? "this package suits" : "these packages suit"} you
              best.
            </>
          ) : (
            "Choose the package that fits your goals. Tap one to see its details."
          )}
        </p>

        {matched.length > 0 && (
          <div className="mt-6 flex flex-col gap-5">
            {matched.map((pkg, index) => (
              <PackageCard key={pkg.id} pkg={pkg} isBestMatch={index === 0} />
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
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs leading-relaxed text-neutral-400">
          Returns are expected ranges, not guaranteed. Past performance doesn&apos;t guarantee
          future results.
        </p>

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
      </div>
    </StepScreenLayout>
  );
}
