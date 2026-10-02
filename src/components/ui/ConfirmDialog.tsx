"use client";

/**
 * ConfirmDialog: "Are you sure?" before an action, e.g. logging out. A small
 * card in the middle of the screen over the dimmed page.
 *
 *   ┌───────────────────────────┐
 *   │           (⇥)             │  ← icon (red for "danger")
 *   │         Log out?          │
 *   │  You'll need your email … │
 *   │ (  Cancel  ) ( Log out )  │
 *   └───────────────────────────┘
 *
 * Native <dialog> in modal mode: focus kept inside, Esc cancels, the page
 * behind hidden from screen readers. "Cancel" comes first, so it gets the
 * focus and a stray Enter never confirms. Tapping the dimmed area cancels.
 *
 * @example
 *   <ConfirmDialog
 *     open={isAsking}
 *     tone="danger"
 *     icon={<LogoutIcon />}
 *     title="Log out?"
 *     message="You'll need your email and password to log back in."
 *     confirmLabel="Log out"
 *     isConfirming={isLoggingOut}
 *     onConfirm={logOut}
 *     onCancel={() => setIsAsking(false)}
 *   />
 */

import { useEffect, useId, useRef } from "react";
import { useModalBackdropEffects } from "@/hooks/useModalBackdropEffects";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  /** "danger": red icon and confirm button, for actions like logging out or deleting. */
  tone?: "default" | "danger";
  /** While the action runs: a spinner on the confirm button, and it can't be cancelled. */
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  icon,
  tone = "default",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const isDanger = tone === "danger";

  useModalBackdropEffects(open);

  // Open as a modal / close, following `open`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const cancel = () => {
    if (!isConfirming) onCancel();
  };

  const button =
    "flex h-12 cursor-pointer items-center justify-center rounded-full px-4 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Esc: same as Cancel.
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      // A tap on the dimmed area lands on the <dialog> itself (its content is in the inner <div>).
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
      className="m-auto w-[calc(100%-3rem)] max-w-sm rounded-[2rem] bg-background p-0 text-center text-foreground backdrop:bg-black/40 open:animate-dialog-in open:backdrop:animate-fade-in motion-reduce:animate-none motion-reduce:backdrop:animate-none"
    >
      <div className="px-6 pt-7 pb-6">
        {icon && (
          <span
            aria-hidden
            className={cn(
              "mx-auto grid size-14 place-items-center rounded-full [&_svg]:size-6",
              isDanger
                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
            )}
          >
            {icon}
          </span>
        )}
        <h2 id={titleId} className="mt-4 text-lg font-bold">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {message}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={cancel}
            disabled={isConfirming}
            className={cn(
              button,
              "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            aria-busy={isConfirming || undefined}
            className={cn(
              button,
              "text-white",
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700",
            )}
          >
            {isConfirming ? (
              <>
                <span
                  aria-hidden
                  className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                />
                <span className="sr-only">{confirmLabel}…</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
