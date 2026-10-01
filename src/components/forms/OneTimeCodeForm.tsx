"use client";

/**
 * OneTimeCodeForm: "enter the code we texted you", in the 2FA design.
 * Shared by SMS 2FA, Forgot PIN and authenticator-app setup, so they all
 * look and behave the same.
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]   ← Confirm sits inside the field,
 *   Didn't get it? Resend code in 42 s      grey until every digit is typed
 *
 * Input details: digits only, shown with a space in the middle ("244 642")
 * for easy reading; `autocomplete="one-time-code"` lets phones offer the
 * code straight from the SMS.
 *
 * Put the explanation ("We've sent a code to…") above it, in the screen.
 */

import { useEffect, useId, useState } from "react";
import { RESEND_CODE_AFTER_SECONDS, TWO_FACTOR_CODE_LENGTH } from "@/config/verification";
import { cn } from "@/lib/utils";

type OneTimeCodeFormProps = {
  /** Checks the code. Return an error message to show, or null on success. */
  onConfirm: (code: string) => Promise<string | null>;
  /**
   * Sends a new code. Return an error message to show, or null on success.
   * Leave out when nothing is sent (authenticator apps make their own codes):
   * the "Didn't get it? Resend" line is then hidden.
   */
  onResend?: () => Promise<string | null>;
  /** Digits in the code (default: 6). */
  codeLength?: number;
  className?: string;
};

export function OneTimeCodeForm({
  onConfirm,
  onResend,
  codeLength = TWO_FACTOR_CODE_LENGTH,
  className,
}: OneTimeCodeFormProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_CODE_AFTER_SECONDS);

  const isComplete = code.length === codeLength;

  // Resend countdown: ticks once per second until it reaches 0.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  /** "244642" → "244 642" (a space in the middle, like the design). */
  const half = Math.ceil(codeLength / 2);
  const displayed = code.length > half ? `${code.slice(0, half)} ${code.slice(half)}` : code;

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isComplete || isConfirming) return;

    setError(null);
    setIsConfirming(true);
    const errorMessage = await onConfirm(code);
    // On success, stay in the "Confirming" state: the screen is about to move on.
    if (errorMessage) {
      setIsConfirming(false);
      setError(errorMessage);
    }
  };

  const handleResend = async () => {
    setError(null);
    setCode("");
    setSecondsLeft(RESEND_CODE_AFTER_SECONDS);
    const errorMessage = (await onResend?.()) ?? null;
    if (errorMessage) setError(errorMessage);
  };

  return (
    <form onSubmit={handleConfirm} noValidate className={cn("flex flex-col", className)}>
      <label htmlFor={inputId} className="text-[0.8125rem] font-medium text-neutral-500">
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
          id={inputId}
          value={displayed}
          onChange={(event) => {
            setError(null);
            setCode(event.target.value.replace(/\D/g, "").slice(0, codeLength));
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={codeLength + 1} // +1 for the space in the middle
          placeholder={"0".repeat(half) + " " + "0".repeat(codeLength - half)}
          autoFocus
          disabled={isConfirming}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-[0.15em] outline-none placeholder:font-normal placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!isComplete || isConfirming}
          aria-busy={isConfirming || undefined}
          className={cn(
            "grid h-10 min-w-22 shrink-0 cursor-pointer place-items-center rounded-full px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed",
            isComplete ? "bg-brand-600 hover:bg-brand-700" : "bg-neutral-300 dark:bg-white/15",
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
        <p id={errorId} role="alert" className="mt-2 px-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {onResend && (
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
      )}
    </form>
  );
}
