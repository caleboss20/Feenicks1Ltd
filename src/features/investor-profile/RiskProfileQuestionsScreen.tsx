"use client";

/**
 * Investor risk profile: 6 questions in 3 short steps of 2 (each step fits
 * one phone screen, no scrolling). Layout inspired by a clean survey mockup:
 * numbered questions, simple answer lists, a slim progress line.
 *
 *   ←           Investor profile
 *   ●━━━━━━━━━◉──────────○
 *   STEP 2 OF 3 · YOUR GOALS
 *
 *   3. What matters most to you?
 *   ┌ ○  Protecting the money I have        ┐   ← whole row is tappable;
 *   ├ ◉  A balance of safety and growth     ┤      selected row: green border,
 *   └ ○  Growing my money as much as…       ┘      light green fill
 *   4. How much of your savings…
 *   …
 *   (              Continue               )   ← enabled once both are answered
 *
 * Back arrow: previous step (or the intro from step 1). Answers are kept
 * while moving back and forth. The last step's button saves the answers
 * and shows the result. Questions and scoring: riskProfileQuestions.ts.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { StepProgress } from "@/components/ui/StepProgress";
import { ROUTES } from "@/config/routes";
import { saveRiskProfile } from "./investorProfileService";
import { RISK_PROFILE_STEPS, RISK_QUESTIONS, type RiskAnswers, type RiskQuestion } from "./riskProfileQuestions";

/** Where the last step leads. */
const NEXT_SCREEN = ROUTES.riskProfileResult;

export function RiskProfileQuestionsScreen() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = RISK_PROFILE_STEPS[stepIndex];
  const isLastStep = stepIndex === RISK_PROFILE_STEPS.length - 1;
  const isStepComplete = step.questions.every((question) => answers[question.id] !== undefined);

  const goToStep = (index: number) => {
    setStepIndex(index);
    window.scrollTo({ top: 0 });
  };

  const handleContinue = async () => {
    if (!isStepComplete) return;
    if (!isLastStep) return goToStep(stepIndex + 1);

    setError(null);
    setIsSaving(true);
    const result = await saveRiskProfile(answers);
    if (!result.ok) {
      setIsSaving(false);
      setError(result.message);
      return;
    }
    router.replace(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Investor profile"
      centeredTitle
      stickyHeader
      backHref={ROUTES.startInvesting}
      onBack={stepIndex > 0 ? () => goToStep(stepIndex - 1) : undefined}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        <StepProgress current={stepIndex + 1} total={RISK_PROFILE_STEPS.length} className="mt-1" />
        <p className="mt-4 text-xs font-semibold tracking-wider text-neutral-500 uppercase [@media(max-height:700px)]:mt-3">
          Step {stepIndex + 1} of {RISK_PROFILE_STEPS.length} · {step.title}
        </p>

        {/* Re-keyed per step, so each step fades in fresh. */}
        <div
          key={stepIndex}
          className="mt-5 flex animate-fade-up flex-col gap-7 [animation-duration:0.4s] motion-reduce:animate-none [@media(max-height:700px)]:mt-3 [@media(max-height:700px)]:gap-5"
        >
          {step.questions.map((question) => (
            <QuestionField
              key={question.id}
              number={RISK_QUESTIONS.indexOf(question) + 1}
              question={question}
              selected={answers[question.id]}
              onSelect={(optionIndex) =>
                setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
              }
            />
          ))}
        </div>

        {error && (
          <div className="mt-5">
            <FormErrorMessage message={error} />
          </div>
        )}

        {/* Pinned to the bottom of the phone screen: always visible, even
            when the questions don't fit. Back appears from step 2. */}
        <div className={stickyActionsClass}>
          <div className={stepIndex > 0 ? "grid grid-cols-[auto_1fr] gap-3" : undefined}>
            {stepIndex > 0 && (
              <Button
                variant="soft"
                size="lg"
                onClick={() => goToStep(stepIndex - 1)}
                disabled={isSaving}
                className="px-6"
              >
                Back
              </Button>
            )}
            <Button
              size="lg"
              fullWidth
              disabled={!isStepComplete}
              isLoading={isSaving}
              loadingLabel="Working out your profile"
              onClick={handleContinue}
            >
              {isLastStep ? "See my profile" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </StepScreenLayout>
  );
}

/** One numbered question with its answers as full-width, tappable rows. */
function QuestionField({
  number,
  question,
  selected,
  onSelect,
}: {
  number: number;
  question: RiskQuestion;
  selected: number | undefined;
  onSelect: (optionIndex: number) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-[0.9375rem] leading-snug font-semibold lg:text-sm">
        {number}. {question.text}
      </legend>

      <div className="mt-3 flex flex-col gap-2 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:gap-1.5">
        {question.options.map((option, optionIndex) => (
          <label
            key={option.label}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2.5 transition-colors hover:border-neutral-300 has-checked:border-brand-600 has-checked:bg-brand-50/60 has-focus-visible:border-brand-400 dark:border-white/10 dark:has-checked:bg-brand-500/10 [@media(max-height:700px)]:min-h-11 [@media(max-height:700px)]:py-2"
          >
            <input
              type="radio"
              name={question.id}
              value={optionIndex}
              checked={selected === optionIndex}
              onChange={() => onSelect(optionIndex)}
              className="peer sr-only"
            />
            {/* Radio dot: grey ring, filled green when selected. */}
            <span
              aria-hidden
              className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-neutral-300 transition-colors peer-checked:border-brand-600 peer-checked:[&>span]:scale-100 dark:border-white/20"
            >
              <span className="size-2.5 scale-0 rounded-full bg-brand-600 transition-transform" />
            </span>
            <span className="text-[0.9375rem] text-neutral-700 peer-checked:font-medium peer-checked:text-foreground lg:text-sm dark:text-neutral-300 [@media(max-height:700px)]:text-sm">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
