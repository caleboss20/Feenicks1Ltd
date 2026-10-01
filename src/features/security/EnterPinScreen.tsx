"use client";

/**
 * "Enter Your PIN": returning, fully registered users unlock the app here
 * after logging in, before the dashboard.
 *
 *   Enter Your PIN
 *   Welcome back, Kwame! Enter your PIN to continue.
 *        [●][●][ ][ ]
 *        keypad              ← checks automatically after the 4th digit
 *     Not you? Log out
 *
 * After the 4th digit: the screen blurs slightly and a small green spinner
 * with "Authenticating…" shows at the bottom. A correct PIN keeps that up
 * for at least AUTHENTICATING_MIN_MS, so the user sees it happen, then
 * goes to the dashboard. A wrong PIN clears the blur and shakes the boxes.
 *
 * Security (frontend):
 *   - digits never shown, no <input> (nothing for the browser to save)
 *   - wrong PIN: boxes shake, attempts left shown; after MAX_ATTEMPTS the
 *     user is logged out and must log in again (the server enforces the
 *     real limit; this counter is only a courtesy)
 *
 * Who gets here: logged in + registration complete. Anyone else is sent to
 * Log in or to the registration step they reached.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { PinDots } from "@/components/ui/PinDots";
import { ROUTES } from "@/config/routes";
import { wait } from "@/config/demoMode";
import { getRouteForStep } from "@/features/auth/accountProgress";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { cn } from "@/lib/utils";
import { PIN_LENGTH } from "./pinValidation";
import { verifyPin } from "./securityService";

/** Where a correct PIN leads. */
const NEXT_SCREEN = ROUTES.dashboard;

/** Wrong PINs allowed before the user is logged out. */
const MAX_ATTEMPTS = 5;

/** A correct PIN shows "Authenticating…" for at least this long before moving on. */
const AUTHENTICATING_MIN_MS = 3000;

/** How long the "too many attempts" message shows before going to Log in. */
const LOCKOUT_REDIRECT_MS = 2500;

export function EnterPinScreen() {
  const router = useRouter();
  const current = useCurrentAccount();

  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Send away anyone who shouldn't be here (see the header comment).
  // While authenticating, this screen does its own redirect after the delay.
  const redirect =
    current.status === "signed-out"
      ? ROUTES.login
      : current.status === "signed-in" && current.account.step !== "complete"
        ? getRouteForStep(current.account.step)
        : current.status === "signed-in" &&
            current.account.isUnlocked &&
            !isAuthenticating &&
            !isLockedOut
          ? NEXT_SCREEN
          : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  const isBusy = isAuthenticating || isLockedOut;

  const checkPin = async (pin: string) => {
    setIsAuthenticating(true);
    const startedAt = Date.now();
    const result = await verifyPin(pin);

    if (result.ok) {
      // Hold the "Authenticating…" state for a moment, then continue.
      await wait(Math.max(0, AUTHENTICATING_MIN_MS - (Date.now() - startedAt)));
      router.replace(NEXT_SCREEN);
      return; // stay blurred until the dashboard has loaded
    }

    setIsAuthenticating(false);
    setEntry("");
    setShakeCount((n) => n + 1);
    const left = attemptsLeft - 1;
    setAttemptsLeft(left);

    if (left <= 0) {
      setIsLockedOut(true);
      setError("Too many wrong attempts. For your security, please log in again.");
      setTimeout(async () => {
        await logOut();
        router.replace(ROUTES.login);
      }, LOCKOUT_REDIRECT_MS);
      return;
    }
    setError(`Wrong PIN. ${left} ${left === 1 ? "attempt" : "attempts"} left.`);
  };

  const addDigit = (digit: string) => {
    if (isBusy || entry.length >= PIN_LENGTH) return;
    setError(null);
    const next = entry + digit;
    setEntry(next);
    // Check as soon as the last digit is in, like banking apps.
    if (next.length === PIN_LENGTH) void checkPin(next);
  };

  const removeDigit = useCallback(() => {
    setError(null);
    setEntry((current) => current.slice(0, -1));
  }, []);

  // Physical keyboard support (desktop): digits and Backspace.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) addDigit(event.key);
      else if (event.key === "Backspace" && !isBusy) removeDigit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleLogOut = async () => {
    await logOut();
    router.replace(ROUTES.login);
  };

  // Nothing to show while checking who's logged in, or while redirecting.
  if (current.status !== "signed-in" || redirect) return null;

  const firstName = current.account.firstName;

  return (
    <>
      {/* The whole screen blurs slightly (2px) while authenticating. */}
      <div
        aria-hidden={isAuthenticating || undefined}
        className={cn(
          "flex flex-1 flex-col transition-[filter] duration-300",
          isAuthenticating && "pointer-events-none blur-[2px] select-none",
        )}
      >
        <StepScreenLayout
          title="Enter Your PIN"
          subtitle={`Welcome back${firstName ? `, ${firstName}` : ""}! Enter your PIN to continue.`}
        >
          <div className="flex flex-1 flex-col sm:flex-none">
            <div className="my-auto flex flex-col gap-5 py-6 sm:my-0 lg:py-4">
              <PinDots
                length={PIN_LENGTH}
                filled={entry.length}
                hasError={Boolean(error)}
                shakeKey={shakeCount}
              />

              <p
                role={error ? "alert" : undefined}
                className={
                  error
                    ? "text-center text-sm font-medium text-red-600"
                    : "text-center text-[0.8125rem] text-neutral-500"
                }
              >
                {error ?? "Your PIN keeps your account safe."}
              </p>
            </div>

            <NumericKeypad onDigit={addDigit} onBackspace={removeDigit} disabled={isBusy} />

            {/* Hidden (space kept) while authenticating: the spinner takes its place. */}
            <p
              className={cn(
                "mt-auto pt-6 text-center text-sm text-neutral-500 sm:mt-8 sm:pt-0 lg:mt-6",
                isAuthenticating && "invisible",
              )}
            >
              Not you?{" "}
              <button
                type="button"
                onClick={handleLogOut}
                className="cursor-pointer font-semibold text-brand-600 hover:underline"
              >
                Log out
              </button>
            </p>
          </div>
        </StepScreenLayout>
      </div>

      {/* Screen readers hear progress only, never the digits. */}
      <p aria-live="polite" className="sr-only">
        {isAuthenticating
          ? "Authenticating"
          : (error ?? `${entry.length} of ${PIN_LENGTH} digits entered`)}
      </p>

      {/* Small green spinner at the bottom, sharp above the blurred screen. */}
      {isAuthenticating && (
        <div
          aria-hidden
          className="fixed inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] z-10 flex animate-fade-up items-center justify-center gap-2.5 motion-reduce:animate-none"
        >
          <span className="size-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent motion-reduce:animate-none" />
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
            Authenticating…
          </span>
        </div>
      )}
    </>
  );
}
