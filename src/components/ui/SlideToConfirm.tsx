"use client";

/**
 * Slide to confirm: the final step of a money action (Pay, Request
 * withdrawal). The investor drags the knob to the end of the track; brand
 * green "liquid" fills behind it. A tap alone never confirms, so a stray
 * touch can't send money.
 *
 *   ( ●›››   Slide to pay GH₵ 504.00      )    ← rest
 *   (██████████████●›  Slide to pay…      )    ← dragging: the fill follows
 *   (███████████████████████████████████◌ )    ← confirmed: spinner, loadingLabel
 *
 * Released before the end (90%), the knob springs back. While `isLoading`
 * the knob stays at the end with a spinner; if loading stops without the
 * screen moving on (an error), it slides back so they can try again.
 * Keyboard and screen readers: it's a button; Enter or Space confirms
 * (a deliberate key press, unlike a stray touch). Same height as the
 * app's main buttons (h-13, 52px).
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const KNOB = 44; // px
const PADDING = 4; // px between the knob and the track's edge
const CONFIRM_AT = 0.9;

export function SlideToConfirm({
  label,
  onConfirm,
  disabled = false,
  isLoading = false,
  loadingLabel,
  className,
}: {
  /** e.g. "Slide to pay GH₵ 504.00". */
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  /** Shown (and announced) while it works, e.g. "Sending your request". */
  loadingLabel: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; from: number } | null>(null);
  /** 0 → 1: how far along the track the knob is. */
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const wasLoading = useRef(false);

  // Loading ended but we're still here (an error): slide back to try again.
  useEffect(() => {
    if (wasLoading.current && !isLoading) {
      const reset = window.setTimeout(() => {
        setIsDone(false);
        setProgress(0);
      }, 0);
      wasLoading.current = false;
      return () => window.clearTimeout(reset);
    }
    wasLoading.current = isLoading;
  }, [isLoading]);

  const travel = () => (trackRef.current ? trackRef.current.offsetWidth - KNOB - PADDING * 2 : 1);

  const confirm = () => {
    if (isDone || disabled) return;
    setIsDone(true);
    setProgress(1);
    navigator.vibrate?.(15);
    onConfirm();
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || isDone || event.button !== 0) return;
    // Only the knob (or the filled part behind it) starts a slide.
    const box = trackRef.current?.getBoundingClientRect();
    if (!box) return;
    const knobRight = box.left + PADDING + progress * travel() + KNOB;
    if (event.clientX > knobRight + 8) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, from: progress };
    setIsDragging(true);
    trackRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const next = Math.min(1, Math.max(0, current.from + (event.clientX - current.startX) / travel()));
    setProgress(next);
  };

  const onPointerEnd = (event: React.PointerEvent) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    setIsDragging(false);
    if (event.type === "pointerup" && progress >= CONFIRM_AT) confirm();
    else setProgress(0);
  };

  const busy = isDone || isLoading;
  const knobLeft = `calc(${PADDING}px + (100% - ${KNOB + PADDING * 2}px) * ${progress})`;

  return (
    <button
      ref={trackRef}
      type="button"
      disabled={disabled}
      aria-label={busy ? loadingLabel : label.replace(/^Slide to/, "Confirm:")}
      aria-busy={busy || undefined}
      onClick={(event) => {
        // Keyboard (Enter/Space) only: a pointer must slide.
        if (event.detail === 0) confirm();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      className={cn(
        "relative h-13 w-full touch-none overflow-hidden rounded-full bg-brand-50 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500/15",
        className,
      )}
    >
      {/* The liquid fill, behind and up to the knob. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 rounded-full bg-brand-600",
          !isDragging && "transition-[width] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
        )}
        style={{ width: `calc(${knobLeft} + ${KNOB + PADDING}px)` }}
      />

      {/* The words: fade as the fill covers them; the loading label once confirmed. */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-[0.9375rem] font-semibold",
          busy ? "text-white" : "text-brand-800 dark:text-brand-200",
        )}
        style={{ opacity: busy ? 1 : Math.max(0, 1 - progress * 1.8) }}
      >
        {busy ? loadingLabel : label}
      </span>

      {/* The knob. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1 grid size-11 place-items-center rounded-full bg-white text-brand-700",
          !isDragging && "transition-[left] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
          !disabled && !busy && "cursor-grab active:cursor-grabbing",
        )}
        style={{ left: knobLeft }}
      >
        {busy ? (
          <span className="size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        )}
      </span>
    </button>
  );
}
