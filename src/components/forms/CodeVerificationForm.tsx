"use client";

/**
 * CodeVerificationForm: the complete "enter the code we sent you" form,
 * shared by every screen that verifies a one-time code (email verification
 * after sign-up, password reset, …). Each screen only supplies what to do
 * with the code; the look and behaviour stay identical everywhere.
 *
 *      Code has been sent to and***ley@gmail.com   ← masked contact
 *
 *      [ 4 ] [ 7 ] [   ] [   ]                     ← VerificationCodeInput
 *
 *         Resend code in 55 s                       ← countdown, then a link
 *
 *   (          Verify          )                    ← enabled once all boxes are filled
 *
 * Place it inside <StepScreenLayout>.
 */

import { useEffect, useState } from "react";
import { stepActionsClass, stepFormClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { VerificationCodeInput, isCodeComplete } from "@/components/ui/VerificationCodeInput";
import { RESEND_CODE_AFTER_SECONDS, VERIFICATION_CODE_LENGTH } from "@/config/verification";

type CodeVerificationFormProps = {
  /** Already-masked contact the code went to, e.g. "and***ley@gmail.com". */
  sentTo: string;
  /**
   * Checks the code. Return an error message to show, or null on success.
   * On success the caller moves on (navigate, show a popup, …).
   */
  onVerify: (code: string) => Promise<string | null>;
  /** Sends a new code. Return an error message to show, or null on success. */
  onResend: () => Promise<string | null>;
};

export function CodeVerificationForm({ sentTo, onVerify, onResend }: CodeVerificationFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_CODE_AFTER_SECONDS);

  const codeIsComplete = isCodeComplete(code, VERIFICATION_CODE_LENGTH);

  // Resend countdown: ticks once per second until it reaches 0.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!codeIsComplete) return;

    setError(null);
    setIsVerifying(true);
    const errorMessage = await onVerify(code);
    // Stay in the "Verifying…" state on success, since the screen is about to move on.
    if (errorMessage) {
      setError(errorMessage);
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setCode("");
    setSecondsLeft(RESEND_CODE_AFTER_SECONDS);
    const errorMessage = await onResend();
    if (errorMessage) setError(errorMessage);
  };

  return (
    <form onSubmit={handleVerify} noValidate className={stepFormClass}>
      {/* Vertically centred in the free space on phones, as in the design. */}
      <div className="my-auto flex flex-col gap-10 py-6 sm:my-0 lg:gap-8">
        <p className="text-center text-[0.9375rem] lg:text-sm">
          Code has been sent to <span className="font-semibold break-all">{sentTo}</span>
        </p>

        <VerificationCodeInput
          length={VERIFICATION_CODE_LENGTH}
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          hasError={Boolean(error)}
          autoFocus
        />

        {/* aria-live: screen readers hear when "Resend code" becomes available. */}
        <p aria-live="polite" className="text-center text-[0.9375rem] lg:text-sm">
          {secondsLeft > 0 ? (
            <>
              Resend code in{" "}
              <span className="font-semibold text-brand-600 tabular-nums">{secondsLeft}</span> s
            </>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="cursor-pointer font-semibold text-brand-600 hover:underline"
            >
              Resend code
            </button>
          )}
        </p>

        <FormErrorMessage message={error} />
      </div>

      <div className={stepActionsClass}>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!codeIsComplete}
          isLoading={isVerifying}
          loadingLabel="Verifying your code"
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
