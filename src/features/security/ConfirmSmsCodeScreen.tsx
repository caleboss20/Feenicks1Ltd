"use client";

/**
 * SMS two-factor setup: "Confirmation code". Reached from the 2FA screen
 * after choosing "SMS code" (the code has already been sent).
 *
 *   ← Confirmation code
 *   We've sent a 6-digit code to +233 *******67. Enter it below to
 *   turn on two-factor authentication.
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]   ← Confirm sits inside the field,
 *   Didn't get it? Resend code in 42 s      grey until 6 digits are typed
 *
 * Correct code → "2FA Enabled" (tap anywhere) → dashboard.
 *
 * Input details: digits only, shown as "244 642" for easy reading;
 * `autocomplete="one-time-code"` lets phones offer the code from the SMS.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { RESEND_CODE_AFTER_SECONDS, TWO_FACTOR_CODE_LENGTH } from "@/config/verification";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { maskPhone } from "@/lib/maskContactDetails";
import { cn } from "@/lib/utils";
import { confirmTwoFactorSmsCode, sendTwoFactorSetupCode } from "./securityService";
import { TwoFactorEnabledScreen } from "./TwoFactorEnabledScreen";

/** Where "Tap anywhere to continue" leads. */
const NEXT_SCREEN = ROUTES.dashboard;

/** Ghana's country calling code; profile numbers are stored without it. */
const GHANA_CALLING_CODE = "+233";

/** "244642" → "244 642" (a space in the middle, like the design). */
function formatCode(digits: string) {
  const half = TWO_FACTOR_CODE_LENGTH / 2;
  return digits.length > half ? `${digits.slice(0, half)} ${digits.slice(half)}` : digits;
}

export function ConfirmSmsCodeScreen() {
  const router = useRouter();
  const current = useCurrentAccount();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_CODE_AFTER_SECONDS);

  // Only for logged-in users still setting up their account.
  useEffect(() => {
    if (current.status === "signed-out") router.replace(ROUTES.login);
  }, [current.status, router]);

  // Resend countdown: ticks once per second until it reaches 0.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const goToNextScreen = useCallback(() => router.replace(NEXT_SCREEN), [router]);

  if (current.status !== "signed-in") return null;

  const { phone } = current.account;
  const maskedPhone = phone ? maskPhone(`${GHANA_CALLING_CODE}${phone}`) : "your phone";
  const isComplete = code.length === TWO_FACTOR_CODE_LENGTH;

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isComplete || isConfirming) return;

    setError(null);
    setIsConfirming(true);
    const result = await confirmTwoFactorSmsCode(code);
    if (!result.ok) {
      setIsConfirming(false);
      setError(result.message);
      return;
    }
    setIsEnabled(true);
  };

  const handleResend = async () => {
    setError(null);
    setCode("");
    setSecondsLeft(RESEND_CODE_AFTER_SECONDS);
    const result = await sendTwoFactorSetupCode();
    if (!result.ok) setError(result.message);
  };

  return (
    <StepScreenLayout title="Confirmation code" backHref={ROUTES.twoFactor}>
      <form onSubmit={handleConfirm} noValidate className="flex flex-col">
        <p className="text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm dark:text-neutral-400">
          We&apos;ve sent a {TWO_FACTOR_CODE_LENGTH}-digit code to{" "}
          <span className="font-semibold whitespace-nowrap text-neutral-700 dark:text-neutral-200">
            {maskedPhone}
          </span>
          . Enter it below to turn on two-factor authentication.
        </p>

        <label htmlFor="sms-code" className="mt-10 text-[0.8125rem] font-medium text-neutral-500 lg:mt-8">
          Enter the confirmation code
        </label>

        {/* Grey field with the Confirm button inside it, as in the design. */}
        <div
          className={cn(
            "mt-2 flex h-14 items-center gap-2 rounded-xl border pr-2 pl-4 transition-colors lg:h-13",
            error
              ? "border-red-500 bg-red-50 dark:bg-red-500/10"
              : "border-transparent bg-neutral-100 focus-within:border-brand-600 focus-within:bg-brand-50 dark:bg-white/5 dark:focus-within:bg-brand-500/10",
          )}
        >
          <input
            id="sms-code"
            value={formatCode(code)}
            onChange={(event) => {
              setError(null);
              setCode(event.target.value.replace(/\D/g, "").slice(0, TWO_FACTOR_CODE_LENGTH));
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            // +1 for the space in the middle.
            maxLength={TWO_FACTOR_CODE_LENGTH + 1}
            placeholder="000 000"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "sms-code-error" : undefined}
            className="h-full w-0 min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-[0.15em] outline-none placeholder:font-normal placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={!isComplete || isConfirming}
            aria-busy={isConfirming || undefined}
            className={cn(
              "grid h-10 min-w-22 shrink-0 cursor-pointer place-items-center rounded-full px-4 text-sm font-semibold transition-colors",
              isComplete
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-neutral-300 text-white dark:bg-white/15",
              "disabled:cursor-not-allowed",
              isConfirming && "disabled:cursor-wait",
            )}
          >
            {isConfirming ? (
              <>
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none"
                />
                <span className="sr-only">Confirming</span>
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>

        {error && (
          <p id="sms-code-error" role="alert" className="mt-2 px-1 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-4 text-sm text-neutral-500">
          Didn&apos;t get it?{" "}
          {secondsLeft > 0 ? (
            <span>
              Resend code in <span className="font-semibold text-brand-600">{secondsLeft} s</span>
            </span>
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
      </form>

      {isEnabled && (
        <TwoFactorEnabledScreen
          message="We'll ask for a code sent to your phone anytime you log in on a new device or withdraw funds."
          onContinue={goToNextScreen}
        />
      )}
    </StepScreenLayout>
  );
}
