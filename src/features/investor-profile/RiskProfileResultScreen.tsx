"use client";

/**
 * Investor risk profile result: "Your investor profile: Moderate".
 *
 *               Investor profile
 *   YOUR INVESTOR PROFILE
 *   Moderate                                ← big, brand green
 *   You want your money to grow, with limited ups and downs…
 *
 *   ▬▬▬▬▬▬  ██████  ▬▬▬▬▬▬                  ← risk meter (3 levels)
 *   Conservative  Moderate  Aggressive
 *
 *   Volatility          Moderate
 *   Returns             Medium to high
 *   Growth from         Tangible assets
 *
 *   We'll use this to recommend packages… not financial advice…
 *   (            Continue            )      ← in the app: "See matching packages"
 *          Retake questions
 *
 * Reads the saved profile from the account, so it survives a refresh.
 * Two flows, same screen (config/investingFlow.ts):
 *   - onboarding: Back → the questions; Continue → "Packages for you" (/packages)
 *   - app (Account › Investor profile): Back → Account; the button opens the
 *     Invest section (/invest); "Retake questions" comes back here
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button, ButtonLink } from "@/components/ui/Button";
import { INVESTING_ROUTES, type InvestingFlow } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { cn } from "@/lib/utils";
import { RISK_LEVEL_ORDER, RISK_LEVELS, type RiskLevel } from "./riskProfileQuestions";
import { useLeaveFinishedOnboarding } from "./useLeaveFinishedOnboarding";

export function RiskProfileResultScreen({ flow }: { flow: InvestingFlow }) {
  const router = useRouter();
  const current = useCurrentAccount();
  const level = current.status === "signed-in" ? current.account.riskLevel : null;
  const routes = INVESTING_ROUTES[flow];
  const isLeaving = useLeaveFinishedOnboarding(ROUTES.investorProfile, flow === "onboarding");

  // No profile yet (e.g. opened directly) → the questions.
  const isMissing = current.status === "signed-in" && !level && !isLeaving;
  useEffect(() => {
    if (isMissing) router.replace(routes.profileQuestions);
  }, [isMissing, router, routes.profileQuestions]);

  if (!level || isLeaving) return null;
  const profile = RISK_LEVELS[level];
  const isApp = flow === "app";

  return (
    <StepScreenLayout
      title="Investor profile"
      centeredTitle
      stickyHeader
      // Onboarding: back to the questions (e.g. to change an answer). App: back to Account.
      backHref={isApp ? ROUTES.account : routes.profileQuestions}
    >
      <div className="flex flex-1 animate-fade-up flex-col [animation-duration:0.5s] motion-reduce:animate-none sm:flex-none">
        <p className="mt-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
          Your investor profile
        </p>
        <h2 className="mt-1.5 text-[2rem] leading-tight font-bold tracking-tight text-brand-700 lg:text-[1.75rem] dark:text-brand-400 [@media(max-height:700px)]:text-[1.625rem]">
          {profile.name}
        </h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400 [@media(max-height:700px)]:text-sm">
          {profile.summary}
        </p>

        <RiskMeter level={level} className="mt-8 lg:mt-6 [@media(max-height:700px)]:mt-5" />

        {/* Key facts, as a simple label → value list. (Short phones: tighter spacing.) */}
        <dl className="mt-8 [@media(max-height:700px)]:mt-5 divide-y divide-neutral-200 border-y border-neutral-200 lg:mt-6 dark:divide-white/10 dark:border-white/10">
          {profile.facts.map((fact) => (
            <div key={fact.label} className="flex items-center justify-between gap-4 py-3.5 [@media(max-height:700px)]:py-2.5">
              <dt className="text-sm text-neutral-500">{fact.label}</dt>
              <dd className="text-right text-sm font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-neutral-400 [@media(max-height:700px)]:mt-4">
          We&apos;ll use this profile to recommend portfolios that suit you. It&apos;s a guide based
          on your answers, not financial advice, and you can retake it anytime.
        </p>

        <div className={stickyActionsClass}>
          {isApp ? (
            <ButtonLink href={routes.packages} size="lg" fullWidth>
              See matching portfolios
            </ButtonLink>
          ) : (
            // The next step of the journey (replace: Back shouldn't return here).
            <Button size="lg" fullWidth onClick={() => router.replace(routes.packages)}>
              Continue
            </Button>
          )}
          <ButtonLink
            href={routes.profileQuestions}
            variant="ghost"
            size="lg"
            fullWidth
            className="mt-2 text-[0.9375rem] text-neutral-600 lg:text-sm dark:text-neutral-400"
          >
            Retake questions
          </ButtonLink>
        </div>
      </div>
    </StepScreenLayout>
  );
}

/** Three segments (Conservative · Moderate · Aggressive) with the user's level highlighted. */
function RiskMeter({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <div className={className} role="img" aria-label={`Risk level: ${RISK_LEVELS[level].name}`}>
      <div className="flex gap-1.5">
        {RISK_LEVEL_ORDER.map((item) => (
          <span
            key={item}
            className={cn(
              "h-2 flex-1 rounded-full",
              item === level ? "bg-brand-600" : "bg-neutral-200 dark:bg-white/15",
            )}
          />
        ))}
      </div>
      <div aria-hidden className="mt-2 flex">
        {RISK_LEVEL_ORDER.map((item, index) => (
          <span
            key={item}
            className={cn(
              "flex-1 text-xs",
              index === 1 && "text-center",
              index === 2 && "text-right",
              item === level ? "font-semibold text-brand-700 dark:text-brand-400" : "text-neutral-400",
            )}
          >
            {RISK_LEVELS[item].name}
          </span>
        ))}
      </div>
    </div>
  );
}
