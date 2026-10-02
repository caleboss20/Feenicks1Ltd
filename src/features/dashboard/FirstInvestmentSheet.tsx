"use client";

/**
 * FirstInvestmentSheet: a sheet that rises from the bottom of the dashboard
 * for a user who hasn't invested yet. It celebrates the milestone (account
 * ready) and nudges them to make their first investment. After the user's
 * reference (a "payment made successfully" sheet).
 *
 *   ┌──────────────── dashboard, dimmed ──────────────┐
 *   ╭──────────────────────────────────────────────(×)╮
 *   │       ✦ ·  (🎉)  · ✦     ← green seal, confetti │
 *   │        You're ready to invest!                 │
 *   │   Make your first investment from just GH₵ 140 │
 *   │   and start growing your money.                │
 *   │   (          Maybe later          )   ← grey   │
 *   │   (        Start investing        )   ← green  │
 *   ╰────────────────────────────────────────────────╯
 *
 * About 40–50% of the screen. On short phones (≤ 700px tall) the badge is
 * smaller and the buttons sit side by side, to stay that size.
 *
 * When: on the dashboard, a moment after it appears (so the user sees where
 * they are first), once per visit (browser tab session), until the user has
 * invested.
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
import { cn } from "@/lib/utils";
import { DASHBOARD_TOP_COLOR } from "./dashboardTheme";

/** Set once the sheet has been shown in this browser tab session. */
const SHOWN_THIS_VISIT_KEY = "feenicks1-first-investment-prompt-shown";
/** Pause after the dashboard appears before the sheet rises. */
const OPEN_DELAY_MS = 800;
/** Longer than the slide-down (`animate-sheet-down`, 0.25s): see `dismiss`. */
const CLOSE_FALLBACK_MS = 400;

/** How dark the backdrop is (black at 40%): keep in sync with `backdrop:bg-black/40`. */
const BACKDROP_OPACITY = 0.4;

/** The dashboard's top green as seen through the backdrop, for the status bar. */
const DIMMED_TOP_COLOR = `#${(DASHBOARD_TOP_COLOR.match(/[0-9a-f]{2}/gi) ?? [])
  .map((channel) =>
    Math.round(parseInt(channel, 16) * (1 - BACKDROP_OPACITY))
      .toString(16)
      .padStart(2, "0"),
  )
  .join("")}`;

/** The smallest amount any package accepts: "from just GH₵ 140". */
const SMALLEST_MINIMUM = Math.min(...Object.values(INVESTMENT_PACKAGES).map((pkg) => pkg.minimum));

/** A 12-bump seal (like a "verified" badge): polygon points in a 100×100 box. */
const SEAL_POINTS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
  const radius = i % 2 === 0 ? 46 : 41;
  return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

/** Opens once per visit, after OPEN_DELAY_MS, while `enabled`. */
function useOncePerVisit(enabled: boolean) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (window.sessionStorage.getItem(SHOWN_THIS_VISIT_KEY) === "1") return;
    } catch {
      // Storage blocked: show it (it just can't be remembered).
    }
    const timer = setTimeout(() => {
      setIsOpen(true);
      try {
        window.sessionStorage.setItem(SHOWN_THIS_VISIT_KEY, "1");
      } catch {
        // Ignored, see above.
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  const close = useCallback(() => setIsOpen(false), []);
  return [isOpen, close] as const;
}

export function FirstInvestmentSheet({ hasInvested }: { hasInvested: boolean }) {
  const [isOpen, close] = useOncePerVisit(!hasInvested);
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

  // While open: the dashboard behind doesn't scroll, and the phone's status
  // bar (theme-color) is dimmed like the page under the backdrop, so the two
  // still read as one surface. Both are put back on close.
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = meta?.content;
    if (meta) meta.content = DIMMED_TOP_COLOR;

    return () => {
      root.style.overflow = previousOverflow;
      if (meta && previousThemeColor) meta.content = previousThemeColor;
    };
  }, [isOpen]);

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

  // Full width when stacked; equal halves when side by side on short phones.
  const pill =
    "flex h-13 w-full cursor-pointer items-center justify-center rounded-full px-5 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 [@media(max-height:700px)]:w-auto [@media(max-height:700px)]:flex-1";

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
      <div className="relative px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center [@media(max-height:700px)]:pt-6">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
        >
          <CloseIcon className="size-[18px]" />
        </button>

        <MilestoneBadge className="mx-auto" />

        <h2
          id={titleId}
          className="mt-6 text-[1.375rem] leading-tight font-bold tracking-tight [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:text-xl"
        >
          You&apos;re ready to invest!
        </h2>
        <p
          id={textId}
          className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-neutral-500 dark:text-neutral-400"
        >
          Make your first investment from just{" "}
          <strong className="font-semibold text-foreground">{formatCedis(SMALLEST_MINIMUM)}</strong>{" "}
          and start growing your money.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 [@media(max-height:700px)]:mt-5 [@media(max-height:700px)]:flex-row">
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
 * Confetti around the badge: where each piece ends up from the badge's centre
 * (x, y in px for an 80px badge; scaled with the badge's size, so it stays
 * inside the sheet and clear of the halo), its shape, colour and final tilt.
 * Hand-placed for a balanced look.
 */
const BURST_PIECES = [
  { x: -70, y: -30, shape: "bar", color: "bg-amber-400", rotate: -35 },
  { x: -96, y: -4, shape: "dot", color: "bg-sky-400", rotate: 0 },
  { x: -42, y: -52, shape: "dot", color: "bg-brand-500", rotate: 0 },
  { x: -100, y: 26, shape: "bar", color: "bg-rose-400", rotate: 20 },
  { x: -74, y: 44, shape: "dot", color: "bg-amber-400", rotate: 0 },
  { x: -14, y: -60, shape: "dot", color: "bg-sky-400", rotate: 0 },
  { x: 20, y: -60, shape: "bar", color: "bg-rose-400", rotate: 70 },
  { x: 64, y: -40, shape: "bar", color: "bg-brand-500", rotate: 40 },
  { x: 44, y: -54, shape: "dot", color: "bg-amber-400", rotate: 0 },
  { x: 92, y: -12, shape: "dot", color: "bg-rose-400", rotate: 0 },
  { x: 100, y: 20, shape: "bar", color: "bg-sky-400", rotate: -25 },
  { x: 74, y: 44, shape: "dot", color: "bg-brand-500", rotate: 0 },
] as const;

/**
 * Green seal with a party popper on a soft halo, with confetti that bursts
 * out of it as the sheet arrives and stays around it: a milestone.
 */
function MilestoneBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      // --badge: the badge's size (smaller on short phones); the confetti scales with it.
      className={cn(
        "relative grid size-(--badge) place-items-center [--badge:5rem] [@media(max-height:700px)]:[--badge:4rem]",
        className,
      )}
    >
      {BURST_PIECES.map((piece, index) => {
        const [width, height] = piece.shape === "bar" ? [4, 11] : [6, 6];
        // Offsets as a fraction of the badge's size (designed for 80px).
        const fx = piece.x / 80;
        const fy = piece.y / 80;
        return (
          <span
            key={index}
            className={cn(
              "absolute animate-confetti-burst rounded-full motion-reduce:animate-none",
              piece.color,
            )}
            style={
              {
                width,
                height,
                // The piece's centre at (x, y) from the badge's centre.
                left: `calc(50% + ${fx * 100}% - ${width / 2}px)`,
                top: `calc(50% + ${fy * 100}% - ${height / 2}px)`,
                // Fly out from the centre; tilt (also used without animation).
                "--from-x": `calc(${-fx} * var(--badge))`,
                "--from-y": `calc(${-fy} * var(--badge))`,
                "--rotate": `${piece.rotate}deg`,
                transform: `rotate(${piece.rotate}deg)`,
                animationDelay: `${0.35 + index * 0.025}s`,
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
