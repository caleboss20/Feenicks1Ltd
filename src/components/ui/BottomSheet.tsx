"use client";

/**
 * BottomSheet: a panel that slides up from the bottom over the dimmed page,
 * e.g. the payment confirmation. Same look and motion as the dashboard's
 * first-investment sheet.
 *
 *   ░░░░░░░░░░░░░░░░░░░░░░░░░░░   ← the page, dimmed
 *   ╭───────────── ▬ ─────────(×)╮
 *   │  children                   │
 *   ╰─────────────────────────────╯
 *
 * Native <dialog> in modal mode: focus kept inside, the page behind hidden
 * from screen readers. Esc, a tap on the dimmed area and × all slide it back
 * down, then call onClose. Taller than the screen (small phones): it scrolls.
 *
 * @example
 *   <BottomSheet open={isOpen} onClose={() => setIsOpen(false)} labelledBy={titleId}>
 *     <h2 id={titleId}>Confirm payment</h2>…
 *   </BottomSheet>
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { useModalBackdropEffects } from "@/hooks/useModalBackdropEffects";
import { cn } from "@/lib/utils";

/** If the slide-down's animationend never comes (background tab), close anyway after this. */
const CLOSE_FALLBACK_MS = 400;

type BottomSheetProps = {
  open: boolean;
  /** Called once it has slid away. */
  onClose: () => void;
  /** The id of the sheet's title. */
  labelledBy: string;
  /** False while something is in progress (e.g. paying): it can't be closed. */
  canClose?: boolean;
  /** Extra classes for the sheet, e.g. a minimum height. The content fills it (a column). */
  className?: string;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, labelledBy, canClose = true, className, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeFallbackTimer = useRef<number | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);

  // While open: no scrolling behind, and the status bar dimmed like the page.
  useModalBackdropEffects(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  /** Closes the dialog and tells the parent (safe to call more than once). */
  const finishClose = useCallback(() => {
    window.clearTimeout(closeFallbackTimer.current);
    dialogRef.current?.close();
    setIsClosing(false);
    onClose();
  }, [onClose]);

  useEffect(() => () => window.clearTimeout(closeFallbackTimer.current), []);

  /** Slide down, then close (straight away with "reduce motion" on). */
  const dismiss = () => {
    if (!canClose || isClosing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    setIsClosing(true);
    closeFallbackTimer.current = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      // A tap on the dimmed area lands on the <dialog> itself (the content is in the inner <div>).
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      onAnimationEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) finishClose();
      }}
      className={cn(
        // open:flex, never plain flex: that would show the dialog while it's closed.
        "mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[2rem] bg-background p-0 text-foreground backdrop:bg-black/40 open:flex open:flex-col",
        isClosing ? "animate-sheet-down backdrop:animate-fade-out" : "animate-sheet-up backdrop:animate-fade-in",
        "motion-reduce:animate-none motion-reduce:backdrop:animate-none",
        className,
      )}
    >
      <div className="relative flex flex-1 flex-col px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Grab handle: shows it's a sheet over the page. */}
        <span aria-hidden className="mx-auto block h-1.5 w-10 rounded-full bg-neutral-200 dark:bg-white/15" />
        <button
          type="button"
          onClick={dismiss}
          disabled={!canClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
        >
          <CloseIcon className="size-[18px]" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
