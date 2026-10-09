"use client";

/**
 * "2FA Enabled": full-screen success shown when a 2FA method is turned on
 * (SMS now; fingerprint and authenticator app later). Covers the setup
 * screen it's rendered from.
 *
 *              ( ✓ )                 ← solid green circle, white tick draws in
 *           2FA Enabled
 *   We'll ask for a code anytime you
 *   want to withdraw funds…
 *
 *      Tap anywhere to continue      ← the whole screen is one big button
 *
 * @example
 *   {isDone && <TwoFactorEnabledScreen message="…" onContinue={() => router.replace(…)} />}
 */

import { useEffect, useRef } from "react";

type TwoFactorEnabledScreenProps = {
  /** Defaults to "2FA Enabled". */
  title?: string;
  /** What changes for the user now, e.g. when they'll be asked for a code. */
  message: string;
  onContinue: () => void;
};

export function TwoFactorEnabledScreen({
  title = "2FA Enabled",
  message,
  onContinue,
}: TwoFactorEnabledScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Move focus here, so keyboard and screen-reader users land on the result.
  useEffect(() => buttonRef.current?.focus(), []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onContinue}
      aria-label={`${title}. ${message} Continue`}
      className="fixed inset-0 z-30 flex cursor-pointer flex-col items-center bg-background px-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center outline-none"
    >
      <span className="my-auto flex flex-col items-center">
        {/* Solid green badge pops in, then the tick draws itself. */}
        <span className="grid size-24 animate-pop-in place-items-center rounded-full bg-brand-600 motion-reduce:animate-none lg:size-20">
          <svg viewBox="0 0 48 48" aria-hidden className="size-12 lg:size-10">
            <path
              d="M13 25.5 20.5 33 35.5 17"
              pathLength={1}
              fill="none"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1"
              className="animate-check-draw [animation-delay:0.35s] motion-reduce:animate-none"
            />
          </svg>
        </span>

        <span className="mt-7 animate-fade-up text-2xl font-bold [animation-delay:0.3s] motion-reduce:animate-none">
          {title}
        </span>
        <span className="mt-3 max-w-xs animate-fade-up text-[0.9375rem] leading-relaxed text-neutral-500 [animation-delay:0.4s] motion-reduce:animate-none lg:text-sm dark:text-neutral-400">
          {message}
        </span>
      </span>

      <span className="animate-fade-up text-[0.9375rem] font-semibold text-brand-700 [animation-delay:0.8s] motion-reduce:animate-none lg:text-sm">
        Tap anywhere to continue
      </span>
    </button>
  );
}
