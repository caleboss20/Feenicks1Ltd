"use client";

/**
 * "Congratulations!" popup shown after the new password is saved.
 *
 *   ┌───────────────────────┐
 *   │        (🛡✓)          │
 *   │   Congratulations!    │
 *   │  Your password has    │
 *   │  been reset. Taking   │
 *   │  you to login…        │
 *   │          ⟳            │
 *   └───────────────────────┘
 *
 * Uses the browser's native <dialog> in modal mode, which gives us for
 * free: the dimmed backdrop, keeping keyboard focus inside the popup, and
 * hiding the page behind it from screen readers.
 * It can't be dismissed (Esc is blocked); it closes itself by calling
 * `onFinished` after REDIRECT_AFTER_MS.
 */

import { useEffect, useRef } from "react";
import { ShieldCheckIcon } from "@/components/icons";
import { IconIllustration } from "@/components/ui/IconIllustration";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/** How long the popup stays before moving on. */
const REDIRECT_AFTER_MS = 3000;

export function PasswordResetSuccessDialog({
  open,
  onFinished,
}: {
  open: boolean;
  /** Called after REDIRECT_AFTER_MS, e.g. to go to the login page. Should be stable (useCallback). */
  onFinished: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open as a modal when `open` becomes true.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  // Move on automatically after a short pause.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onFinished, REDIRECT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [open, onFinished]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="password-reset-success-title"
      // Block Esc: the flow is finished, so there's nothing to go back to.
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-3rem)] max-w-sm rounded-[2rem] bg-background p-8 text-center text-foreground backdrop:bg-black/60 lg:p-7"
    >
      <IconIllustration icon={<ShieldCheckIcon />} className="mx-auto size-36 lg:size-28" />

      <h2
        id="password-reset-success-title"
        className="mt-6 text-2xl font-bold text-brand-600 lg:text-xl"
      >
        Congratulations!
      </h2>
      <p className="mt-3 text-base text-neutral-600 lg:text-sm dark:text-neutral-400">
        Your password has been reset. You&apos;ll be taken to the login page in a few seconds.
      </p>

      <LoadingSpinner label="Redirecting to login" className="mx-auto mt-6" />
    </dialog>
  );
}
