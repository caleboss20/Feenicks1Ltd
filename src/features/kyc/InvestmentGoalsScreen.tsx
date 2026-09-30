"use client";

/**
 * KYC step 1: "Why are you investing?" (the first screen after email
 * verification, before the user can reach the dashboard).
 *
 *   Why are you investing?
 *   Choose all that apply, so we can recommend the right plans for you.
 *
 *   ┌──────────────────────────────────┐
 *   │ Grow my wealth over time       ◉ │   ← selected: green border + filled circle
 *   └──────────────────────────────────┘
 *   │ Save for retirement            ◯ │
 *   │ …                                │
 *
 *   (   Skip   )  (    Continue    )     ← Continue needs at least one choice
 *
 * Multi-select (people usually have more than one goal). The question is
 * optional, so "Skip" is allowed; the identity checks that follow are not.
 * No back arrow: sign-up is complete, so there's nothing to go back to.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass, stepFormClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { INVESTMENT_GOALS, type InvestmentGoalId } from "./investmentGoals";
import { saveInvestmentGoals } from "./kycService";
import { useKycStore } from "./useKycStore";

/** Where the user goes next: the identity verification intro. */
const NEXT_SCREEN = ROUTES.kycVerifyIdentity;

export function InvestmentGoalsScreen() {
  const router = useRouter();
  const savedGoals = useKycStore((s) => s.investmentGoals);
  const saveGoalsInStore = useKycStore((s) => s.saveInvestmentGoals);

  // Pre-select anything chosen earlier (e.g. after going back to this screen).
  const [selected, setSelected] = useState<InvestmentGoalId[]>(savedGoals);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (id: InvestmentGoalId) => {
    setError(null);
    setSelected((current) =>
      current.includes(id) ? current.filter((goal) => goal !== id) : [...current, id],
    );
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected.length === 0) return;

    setIsSaving(true);
    const result = await saveInvestmentGoals(selected);
    if (!result.ok) {
      setError(result.message);
      setIsSaving(false);
      return;
    }
    saveGoalsInStore(selected);
    router.push(NEXT_SCREEN);
  };

  const handleSkip = () => {
    saveGoalsInStore([]);
    router.push(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Why are you investing?"
      // Back arrow on desktop only; on phones the flow moves forward, like the design.
      backHref={ROUTES.login}
      backOnDesktopOnly
      // Wider column on desktop so the options fit in 2 columns.
      wide
    >
      <form onSubmit={handleContinue} noValidate className={stepFormClass}>
        {/* Phones: a little extra breathing room (16px) under the title, so
            the text and options don't crowd it. Fixed, not centred, so it
            looks the same on short and tall phones. */}
        <div className="mt-4 flex flex-col gap-6 sm:mt-0 lg:mt-2">
          <p className="text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
            Choose all that apply, so we can recommend the right plans for you.
          </p>

          {/* One column on phones and tablets, two columns on desktop. */}
          <fieldset className="grid gap-3 lg:grid-cols-2">
            <legend className="sr-only">Your investment goals</legend>

            {INVESTMENT_GOALS.map((goal) => {
              const isSelected = selected.includes(goal.id);
              return (
                <label
                  key={goal.id}
                  // Flat card: hairline border, green when selected. No shadows.
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-neutral-200 px-5 py-4 transition-colors hover:border-neutral-300 has-checked:border-brand-600 has-focus-visible:border-brand-400 lg:py-3.5 dark:border-white/10"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggleGoal(goal.id)}
                  />
                  <span className="text-[0.9375rem] font-semibold lg:text-sm">{goal.label}</span>

                  {/* Round tick on the right, like the design's radio circle. */}
                  <span
                    aria-hidden
                    className={
                      isSelected
                        ? "grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-colors"
                        : "grid size-6 shrink-0 place-items-center rounded-full border-2 border-neutral-300 text-transparent transition-colors dark:border-white/20"
                    }
                  >
                    <CheckIcon className="size-3.5 stroke-3" />
                  </span>
                </label>
              );
            })}
          </fieldset>

          <FormErrorMessage message={error} />
        </div>

        {/* Two buttons side by side, as in the design. */}
        <div className={`${stepActionsClass} grid grid-cols-2 gap-3`}>
          <Button type="button" variant="soft" size="lg" onClick={handleSkip} disabled={isSaving}>
            Skip
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={selected.length === 0}
            isLoading={isSaving}
            loadingLabel="Saving your goals"
          >
            Continue
          </Button>
        </div>
      </form>
    </StepScreenLayout>
  );
}
