"use client";

/**
 * FirstInvestmentSheet: a sheet that rises from the bottom of the dashboard
 * for a user who hasn't invested yet. It celebrates the milestone (account
 * ready) and nudges them to make their first investment. After the user's
 * reference (a "payment made successfully" sheet).
 *
 *   ┌──────────────── dashboard, dimmed ──────────────┐
 *   ╭──────────────────────────────────────────────(×)╮
 *   │       ✦ ·  (🎉)  · ✦     ← green seal; confetti │
 *   │                            keeps popping out    │
 *   │        You're ready to invest!                 │
 *   │   Make your first investment from just GH₵ 140 │
 *   │   and start growing your money.                │
 *   │   (          Maybe later          )   ← grey   │
 *   │   (        Start investing        )   ← green  │
 *   ╰────────────────────────────────────────────────╯
 *
 * Reaches about the middle of the screen (at least 54% of its height). On
 * very short screens (≤ 620px tall) the badge is smaller and the buttons sit
 * side by side.
 *
 * When: on the dashboard, a moment after it appears (so the user sees where
 * they are first), once per visit, until the user has invested. A visit
 * starts each time the user logs in or unlocks the app with their PIN.
 *
 * Native <dialog> in modal mode: dimmed backdrop, focus kept inside, Esc to
 * close, the page behind hidden from screen readers. Tapping the dimmed area
 * closes it too.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CloseIcon, PartyPopperIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { formatCedis } from "@/lib/money";
import { useModalBackdropEffects } from "@/hooks/useModalBackdropEffects";
import { cn } from "@/lib/utils";

/** The visit (see `visitId`) the sheet was last shown in. */
const SHOWN_IN_VISIT_KEY = "feenicks1-first-investment-prompt-visit";
/** Pause after the dashboard appears before the sheet rises. */
const OPEN_DELAY_MS = 800;
/** Longer than the slide-down (`animate-sheet-down`, 0.25s): see `dismiss`. */
const CLOSE_FALLBACK_MS = 400;

/** The smallest amount any package accepts: "from just GH₵ 140". */
const SMALLEST_MINIMUM = Math.min(...Object.values(INVESTMENT_PACKAGES).map((pkg) => pkg.minimum));

/** A 12-bump seal (like a "verified" badge): polygon points in a 100×100 box. */
const SEAL_POINTS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
  const radius = i % 2 === 0 ? 46 : 41;
  return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

/** Opens once per visit, after OPEN_DELAY_MS, while `enabled`. */
function useOncePerVisit(enabled: boolean, visitId: string) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (window.sessionStorage.getItem(SHOWN_IN_VISIT_KEY) === visitId) return;
    } catch {
      // Storage blocked: show it (it just can't be remembered).
    }
    const timer = setTimeout(() => {
      setIsOpen(true);
      try {
        window.sessionStorage.setItem(SHOWN_IN_VISIT_KEY, visitId);
      } catch {
        // Ignored, see above.
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, visitId]);

  const close = useCallback(() => setIsOpen(false), []);
  return [isOpen, close] as const;
}

type FirstInvestmentSheetProps = {
  hasInvested: boolean;
  /**
   * Identifies the current visit: when the app was last unlocked (log-in or
   * PIN). A new value means a new visit, so the sheet shows again.
   */
  visitId: number | null;
};

export function FirstInvestmentSheet({ hasInvested, visitId }: FirstInvestmentSheetProps) {
  const [isOpen, close] = useOncePerVisit(!hasInvested, String(visitId ?? "this-tab"));
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeFallbackTimer = useRef<number | undefined>(undefined);
  const titleId = useId();
  const textId = useId();

  // Open as a modal once it's on the page.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  // While open: no scrolling behind, and the status bar dimmed like the page.
  useModalBackdropEffects(isOpen);

  /** Closes the dialog and removes the sheet (safe to call more than once). */
  const finishClose = useCallback(() => {
    window.clearTimeout(closeFallbackTimer.current);
    dialogRef.current?.close();
    setIsClosing(false);
    close();
  }, [close]);

  // Don't leave the fallback timer running if the dashboard goes away.
  useEffect(() => () => window.clearTimeout(closeFallbackTimer.current), []);

  /** Slide back down, then close (straight away with "reduce motion" on). */
  const dismiss = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    setIsClosing(true);
    // Normally the slide-down's animationend closes it. Fallback, in case that
    // never comes (browsers pause animations in a background tab): never leave
    // the sheet stuck open with the page unable to scroll.
    closeFallbackTimer.current = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  };

  if (!isOpen) return null;

  // Full width when stacked; equal halves when side by side on very short screens.
  const pill =
    "flex h-13 w-full cursor-pointer items-center justify-center rounded-full px-5 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 [@media(max-height:620px)]:w-auto [@media(max-height:620px)]:flex-1";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={textId}
      // Esc: close with the same slide-down as the buttons.
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      // A tap on the dimmed area lands on the <dialog> itself (the sheet's
      // content is inside the inner <div>), so it closes the sheet.
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      onAnimationEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) finishClose();
      }}
      className={cn(
        // A sheet along the bottom edge, full width up to the app's column.
        "mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-md rounded-t-[2rem] bg-background p-0 text-foreground backdrop:bg-black/40",
        isClosing
          ? "animate-sheet-down backdrop:animate-fade-out"
          : "animate-sheet-up backdrop:animate-fade-in",
        "motion-reduce:animate-none motion-reduce:backdrop:animate-none",
      )}
    >
      {/* At least 54% of the screen tall, so the sheet reaches about the middle;
          the badge and message are centred in the space above the buttons.
          overflow-hidden: confetti never pokes out or adds scrollbars. */}
      <div className="relative flex min-h-[54dvh] flex-col overflow-hidden px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center [@media(max-height:620px)]:min-h-0 [@media(max-height:620px)]:pt-6">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
        >
          <CloseIcon className="size-[18px]" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center">
          <MilestoneBadge />

          <h2
            id={titleId}
            className="mt-6 text-[1.5rem] leading-tight font-bold tracking-tight [@media(max-height:620px)]:mt-4 [@media(max-height:620px)]:text-xl"
          >
            You&apos;re ready to invest!
          </h2>
          <p
            id={textId}
            className="mx-auto mt-2.5 max-w-[19rem] text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400 [@media(max-height:620px)]:text-sm"
          >
            Make your first investment from just{" "}
            <strong className="font-semibold whitespace-nowrap text-foreground">
              {formatCedis(SMALLEST_MINIMUM)}
            </strong>{" "}
            and start growing your money.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 [@media(max-height:620px)]:mt-5 [@media(max-height:620px)]:flex-row">
          <button
            type="button"
            onClick={dismiss}
            className={cn(
              pill,
              "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
            )}
          >
            Maybe later
          </button>
          <Link href={ROUTES.packages} className={cn(pill, "bg-brand-600 text-white hover:bg-brand-700")}>
            Start investing
          </Link>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Confetti around the badge, mostly small dashes: where each piece flies to
 * from the badge's centre (x, y in px for an 80px badge; scaled with the
 * badge's size, clear of the halo and kept beside/above it so it doesn't
 * cover the text), its shape, colour and tilt. Hand-placed for a balanced look.
 */
const CONFETTI_PIECES = [
  { x: -72, y: -30, shape: "dash", color: "bg-amber-400", rotate: -35 },
  { x: -98, y: -2, shape: "dot", color: "bg-sky-400", rotate: 0 },
  { x: -44, y: -52, shape: "dash", color: "bg-brand-500", rotate: 25 },
  { x: -102, y: 28, shape: "dash", color: "bg-rose-400", rotate: 20 },
  { x: -76, y: 44, shape: "dot", color: "bg-amber-400", rotate: 0 },
  { x: -88, y: -38, shape: "dash", color: "bg-violet-400", rotate: 10 },
  { x: -16, y: -60, shape: "dot", color: "bg-sky-400", rotate: 0 },
  { x: 18, y: -60, shape: "dash", color: "bg-rose-400", rotate: 70 },
  { x: 66, y: -38, shape: "dash", color: "bg-brand-500", rotate: 40 },
  { x: 44, y: -54, shape: "dot", color: "bg-amber-400", rotate: 0 },
  { x: 86, y: -44, shape: "dot", color: "bg-violet-400", rotate: 0 },
  { x: 94, y: -10, shape: "dash", color: "bg-rose-400", rotate: -60 },
  { x: 102, y: 22, shape: "dash", color: "bg-sky-400", rotate: -25 },
  { x: 76, y: 46, shape: "dot", color: "bg-brand-500", rotate: 0 },
  { x: -56, y: 50, shape: "dash", color: "bg-violet-400", rotate: -40 },
  { x: 56, y: 52, shape: "dash", color: "bg-amber-400", rotate: 35 },
] as const;

/**
 * Green seal with a party popper on a soft halo, with confetti that keeps
 * popping out of it until the sheet is closed: a milestone. (With "reduce
 * motion" on, the confetti just sits still around the badge.)
 */
function MilestoneBadge() {
  return (
    <span
      aria-hidden
      // --badge: the badge's size (smaller on very short screens); the confetti scales with it.
      className="relative grid size-(--badge) place-items-center [--badge:5rem] [@media(max-height:620px)]:[--badge:4rem]"
    >
      {CONFETTI_PIECES.map((piece, index) => {
        const [width, height] = piece.shape === "dash" ? [4, 11] : [6, 6];
        // Offsets as a fraction of the badge's size (designed for 80px).
        const fx = piece.x / 80;
        const fy = piece.y / 80;
        return (
          <span
            key={index}
            className={cn(
              "absolute animate-confetti-pop rounded-full motion-reduce:animate-none",
              piece.color,
            )}
            style={
              {
                width,
                height,
                // The piece's resting place: its centre at (x, y) from the badge's centre.
                left: `calc(50% + ${fx * 100}% - ${width / 2}px)`,
                top: `calc(50% + ${fy * 100}% - ${height / 2}px)`,
                // Pops out from the centre, then drifts on outwards and a little down.
                "--from-x": `calc(${-fx} * var(--badge))`,
                "--from-y": `calc(${-fy} * var(--badge))`,
                "--drift-x": `calc(${fx * 0.45} * var(--badge))`,
                "--drift-y": `calc(${fy * 0.45} * var(--badge) + 10px)`,
                "--rotate": `${piece.rotate}deg`,
                // Tilt when not animating ("reduce motion").
                transform: `rotate(${piece.rotate}deg)`,
                // Varied lengths and start times, so the popping never syncs up.
                animationDuration: `${1.6 + (index % 4) * 0.2}s`,
                animationDelay: `${0.35 + ((index * 0.37) % 1.6)}s`,
              } as React.CSSProperties
            }
          />
        );
      })}

      <span className="absolute -inset-3 rounded-full bg-brand-50 dark:bg-brand-500/10" />
      <span className="relative grid size-full animate-pop-in place-items-center text-brand-600 [animation-delay:0.3s] motion-reduce:animate-none">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <polygon
            points={SEAL_POINTS}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </svg>
        <PartyPopperIcon className="relative size-[44%] text-white" />
      </span>
    </span>
  );
}
