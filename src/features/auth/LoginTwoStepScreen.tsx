"use client";

/**
 * Log-in, STEP 2 (only when 2FA is on and this device isn't remembered):
 * "Two-step verification". Same design as the 2FA "Confirmation code" screen.
 *
 *   ←       Two-step verification        ◌   ← ring: authenticator only
 *   Open your authenticator app and enter the
 *   6-digit code shown for Feenicks1.        (SMS: "We've sent a code to +233…")
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]
 *   ☐ Remember this device for 30 days
 *
 *   Can't use your app? Get a code by SMS     ← "use another way" (this log-in only)
 *   🛡 Never share this code…                 ← anti-scam reminder
 *
 * Correct code → signed in → Enter PIN (or fingerprint) → dashboard.
 *
 * Security:
 *   - the user is NOT signed in until the code is right (the password step
 *     only created a pending challenge, kept in memory)
 *   - the challenge expires after 10 minutes; 5 wrong codes → log in again
 *   - "use another way" never changes the 2FA method (Security settings
 *     only, after logging in and confirming with the PIN)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon } from "@/components/icons";
import { OneTimeCodeForm } from "@/components/forms/OneTimeCodeForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { Checkbox } from "@/components/ui/Checkbox";
import { ROUTES } from "@/config/routes";
import { CodeRefreshRing } from "@/features/security/CodeRefreshRing";
import { getRouteForStep } from "./accountProgress";
import { REMEMBER_DEVICE_DAYS, sendLoginSmsCode, verifyLoginCode } from "./authService";
import { useLoginChallengeStore } from "./useLoginChallengeStore";

/** Wrong codes allowed before the user has to log in again. */
const MAX_ATTEMPTS = 5;

/** How long a "please log in again" message shows before going back. */
const RESTART_REDIRECT_MS = 2500;

export function LoginTwoStepScreen() {
  const router = useRouter();
  const challenge = useLoginChallengeStore((s) => s.challenge);
  const saveChallenge = useLoginChallengeStore((s) => s.saveChallenge);
  const clearChallenge = useLoginChallengeStore((s) => s.clear);

  const [rememberDevice, setRememberDevice] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isRestarting, setIsRestarting] = useState(false);
  /** Code accepted: on the way to the next screen (the challenge is already cleared). */
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // No pending log-in (e.g. after a refresh, or opened directly) → Log in.
  const isMissing = !challenge && !isRestarting && !isSignedIn;
  useEffect(() => {
    if (isMissing) router.replace(ROUTES.login);
  }, [isMissing, router]);

  if (!challenge) return null;

  const isAuthenticator = challenge.method === "authenticator-app";

  /** Throws away the pending log-in and goes back to Log in after a moment. */
  const restartLogin = () => {
    setIsRestarting(true);
    clearChallenge();
    setTimeout(() => router.replace(ROUTES.login), RESTART_REDIRECT_MS);
  };

  const confirmCode = async (code: string): Promise<string | null> => {
    if (isRestarting) return "Please log in again.";
    const result = await verifyLoginCode(challenge, code, rememberDevice);

    if (result.ok) {
      setIsSignedIn(true); // so clearing the challenge doesn't send them back to Log in
      clearChallenge();
      // Signed in: continue where they left off (registered users → Enter PIN).
      router.replace(getRouteForStep(result.nextStep));
      return null;
    }

    if (result.message.includes("expired")) {
      restartLogin();
      return result.message;
    }

    const left = attemptsLeft - 1;
    setAttemptsLeft(left);
    if (left <= 0) {
      restartLogin();
      return "Too many wrong codes. For your security, please log in again.";
    }
    return `${result.message} ${left} ${left === 1 ? "attempt" : "attempts"} left.`;
  };

  /** "Use another way": an SMS code for this log-in only. */
  const switchToSms = async () => {
    setSwitchError(null);
    setIsSwitching(true);
    const result = await sendLoginSmsCode(challenge);
    setIsSwitching(false);
    if (!result.ok) {
      setSwitchError(result.message);
      return;
    }
    saveChallenge(result.challenge);
  };

  const resendSms = async () => {
    const result = await sendLoginSmsCode(challenge);
    return result.ok ? null : result.message;
  };

  return (
    <StepScreenLayout
      title="Two-step verification"
      centeredTitle
      backHref={ROUTES.login}
      headerAction={isAuthenticator ? <CodeRefreshRing /> : undefined}
    >
      <p className="text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
        {isAuthenticator ? (
          "Open your authenticator app and enter the 6-digit code shown for Feenicks1."
        ) : (
          <>
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-semibold whitespace-nowrap text-neutral-800 dark:text-neutral-200">
              {challenge.maskedPhone}
            </span>
            . Enter it below to log in.
          </>
        )}
      </p>

      {/* Re-mounted when switching to SMS, so the field and its countdown start fresh. */}
      <OneTimeCodeForm
        key={challenge.method}
        className="mt-10 lg:mt-8"
        onConfirm={confirmCode}
        onResend={isAuthenticator ? undefined : resendSms}
      />

      <Checkbox
        label={`Remember this device for ${REMEMBER_DEVICE_DAYS} days`}
        checked={rememberDevice}
        onChange={(event) => setRememberDevice(event.target.checked)}
        className="mt-6 text-sm font-medium lg:text-sm"
      />

      <div className="mt-auto flex flex-col gap-4 pt-8 sm:mt-10 sm:pt-0">
        {/* Use another way: only offered while on the authenticator app. */}
        {isAuthenticator && (
          <p className="text-center text-sm text-neutral-500">
            Can&apos;t use your app?{" "}
            <button
              type="button"
              onClick={switchToSms}
              disabled={isSwitching || isRestarting}
              className="cursor-pointer font-semibold text-brand-600 hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              {isSwitching ? "Sending code…" : "Get a code by SMS"}
            </button>
          </p>
        )}
        {switchError && (
          <p role="alert" className="text-center text-sm text-red-600">
            {switchError}
          </p>
        )}

        {/* Anti-scam reminder: the #1 way codes get stolen is people being asked for them. */}
        <p className="flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-neutral-400">
          <ShieldCheckIcon className="mt-px size-4 text-brand-600" />
          <span>Never share this code. Feenicks1 will never ask you for it.</span>
        </p>
      </div>
    </StepScreenLayout>
  );
}
