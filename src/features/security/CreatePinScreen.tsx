"use client";

/**
 * "Create New PIN": the security PIN that approves investments and
 * withdrawals. Two steps on one screen:
 *
 *   STEP 1  Create New PIN        STEP 2  Confirm Your PIN
 *   [●][●][▮][ ]                   [●][●][●][●]
 *   keypad                         keypad
 *   (Continue)                     (Continue) → ✅ "PIN created" → next
 *
 * Security (frontend):
 *   - digits are never displayed, only dots
 *   - no <input>: the browser can't save, autofill or suggest the PIN
 *   - weak PINs are refused (repeats, sequences, common PINs, birth date)
 *   - must be entered twice and match
 *   - the PIN is never stored in the browser; it's sent once to the server
 *     and cleared from the screen's memory afterwards
 *   - screen readers hear progress ("2 of 4 digits"), never the digits
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { PinDots } from "@/components/ui/PinDots";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { ROUTES } from "@/config/routes";
import { useKycStore } from "@/features/kyc/useKycStore";
import { cn } from "@/lib/utils";
import { PIN_LENGTH, getPinWeakness } from "./pinValidation";
import { createPin } from "./securityService";

/**
 * Where the user goes once the PIN is created.
 * TODO(security): change to "Set Your Fingerprint" (or the dashboard) once built.
 */
const NEXT_SCREEN = ROUTES.login;

type Step = "create" | "confirm";

export function CreatePinScreen() {
  const router = useRouter();
  // Birth date (from the profile) lets us refuse PINs like 1992 or 0405.
  const dateOfBirth = useKycStore((s) => s.profile?.dateOfBirth);

  const [step, setStep] = useState<Step>("create");
  const [firstPin, setFirstPin] = useState("");
  const [entry, setEntry] = useState(""); // what's being typed in the current step
  const [error, setError] = useState<string | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const isComplete = entry.length === PIN_LENGTH;
  const isBusy = isSaving || isDone;

  /** Shows an error, shakes the boxes and clears the current entry. */
  const fail = (message: string) => {
    setError(message);
    setShakeCount((n) => n + 1);
    setEntry("");
  };

  const addDigit = useCallback((digit: string) => {
    setError(null);
    setEntry((current) => (current.length < PIN_LENGTH ? current + digit : current));
  }, []);

  const removeDigit = useCallback(() => {
    setError(null);
    setEntry((current) => current.slice(0, -1));
  }, []);

  const handleContinue = async () => {
    if (!isComplete || isBusy) return;

    // Step 1: check the PIN is strong enough, then ask for it again.
    if (step === "create") {
      const weakness = getPinWeakness(entry, dateOfBirth);
      if (weakness) return fail(weakness);
      setFirstPin(entry);
      setEntry("");
      setStep("confirm");
      return;
    }

    // Step 2: both entries must match.
    if (entry !== firstPin) return fail("PINs don't match. Please try again.");

    setIsSaving(true);
    const result = await createPin(entry);
    // Drop the PIN from this screen's memory as soon as it's been sent.
    setFirstPin("");
    setEntry("");
    setIsSaving(false);

    if (!result.ok) {
      setStep("create");
      return fail(result.message);
    }
    setIsDone(true);
  };

  const startOver = () => {
    setStep("create");
    setFirstPin("");
    setEntry("");
    setError(null);
  };

  // Physical keyboard support (desktop): digits, Backspace and Enter.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isBusy) return;
      if (/^\d$/.test(event.key)) addDigit(event.key);
      else if (event.key === "Backspace") removeDigit();
      else if (event.key === "Enter") document.getElementById("pin-continue")?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addDigit, removeDigit, isBusy]);

  // Stable function, so the success popup's timer isn't restarted on re-render.
  const goToNextScreen = useCallback(() => router.replace(NEXT_SCREEN), [router]);

  const isConfirm = step === "confirm";

  return (
    <StepScreenLayout
      title={isConfirm ? "Confirm Your PIN" : "Create New PIN"}
      subtitle={
        isConfirm
          ? "Enter your PIN again to confirm it."
          : "Add a PIN to make your account more secure."
      }
      backHref={ROUTES.kycAllSet}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* Boxes + messages, vertically centred in the free space on phones. */}
        <div className="my-auto flex flex-col gap-5 py-6 sm:my-0 lg:py-4">
          <PinDots length={PIN_LENGTH} filled={entry.length} hasError={Boolean(error)} shakeKey={shakeCount} />

          {/* Screen readers hear progress only, never the digits. */}
          <p aria-live="polite" className="sr-only">
            {error ?? `${entry.length} of ${PIN_LENGTH} digits entered`}
          </p>

          {error ? (
            <p role="alert" className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          ) : (
            <p className="mx-auto max-w-xs text-center text-[0.8125rem] leading-relaxed text-neutral-500">
              You&apos;ll use this PIN to approve investments and withdrawals.
            </p>
          )}

          {isConfirm && (
            <button
              type="button"
              onClick={startOver}
              className="mx-auto cursor-pointer text-sm font-semibold text-brand-600 hover:underline"
            >
              Start over
            </button>
          )}
        </div>

        <NumericKeypad onDigit={addDigit} onBackspace={removeDigit} disabled={isBusy} />

        <div className={cn(stepActionsClass, "lg:mt-5")}>
          <Button
            id="pin-continue"
            size="lg"
            fullWidth
            disabled={!isComplete}
            isLoading={isSaving || isDone}
            loadingLabel="Saving your PIN"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>

      <SuccessDialog
        open={isDone}
        title="PIN created"
        message="Your account is now more secure. You'll use this PIN to approve investments and withdrawals."
        spinnerLabel="Continuing"
        onFinished={goToNextScreen}
      />
    </StepScreenLayout>
  );
}
