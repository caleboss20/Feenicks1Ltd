"use client";

/**
 * useOnboardingSlideshow: "Instagram Stories"-style carousel behaviour.
 *
 * Owns *which* slide is active and *whether* the timer is paused. The timer
 * itself is a CSS animation on the active progress pill: when it finishes,
 * the component calls `next()`. So the progress bar and the slide change
 * can never drift out of sync, and pausing is just pausing that animation.
 *
 * Gestures (spread `gestureHandlers` onto the tappable media area):
 *   tap left third   → previous slide
 *   tap elsewhere    → next slide
 *   swipe left/right → next / previous
 *   press and hold   → pause (release to resume)
 * Keyboard: ← / → arrow keys.
 * The timer also pauses while the browser tab is hidden.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Horizontal distance (px) a pointer must travel to count as a swipe. */
const SWIPE_THRESHOLD_PX = 50;
/** Presses shorter than this count as taps; longer ones were "hold to pause". */
const TAP_MAX_MS = 250;

type GestureStart = { x: number; time: number };

/** 1 = moving forward (new slide enters from the right), -1 = moving back. */
export type SlideDirection = 1 | -1;

type SlideState = {
  /** The slide on screen now. */
  index: number;
  /** The slide that was on screen before (it animates out); null at start. */
  previousIndex: number | null;
  direction: SlideDirection;
};

export function useOnboardingSlideshow(count: number) {
  const [slide, setSlide] = useState<SlideState>({
    index: 0,
    previousIndex: null,
    direction: 1,
  });
  const [isHeld, setIsHeld] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const gesture = useRef<GestureStart | null>(null);

  /** Moves to `target`, remembering where we came from and which way we went. */
  const moveTo = useCallback((getTarget: (current: number) => number, direction?: SlideDirection) => {
    setSlide((current) => {
      const target = getTarget(current.index);
      if (target === current.index) return current;
      return {
        index: target,
        previousIndex: current.index,
        direction: direction ?? (target > current.index ? 1 : -1),
      };
    });
  }, []);

  // Next/previous always slide in their own direction, even when wrapping
  // around (last → first still feels like "next").
  const next = useCallback(() => moveTo((i) => (i + 1) % count, 1), [count, moveTo]);
  const prev = useCallback(() => moveTo((i) => (i - 1 + count) % count, -1), [count, moveTo]);
  const goTo = useCallback((target: number) => moveTo(() => target), [moveTo]);

  /* ── Keyboard navigation ─────────────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  /* ── Pause while the tab is in the background ────────────────────────── */
  useEffect(() => {
    const onVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  /* ── Pointer gestures (mouse, touch and pen via Pointer Events) ──────── */
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Capture, so we still get pointerup if the finger slides off the element.
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, time: performance.now() };
    setIsHeld(true);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const start = gesture.current;
    gesture.current = null;
    setIsHeld(false);
    if (!start) return;

    const dx = e.clientX - start.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      // Swipe left (finger moves left) → next, like turning a page.
      if (dx < 0) next();
      else prev();
      return;
    }

    if (performance.now() - start.time < TAP_MAX_MS) {
      const { left, width } = e.currentTarget.getBoundingClientRect();
      if (e.clientX - left < width / 3) prev();
      else next();
    }
    // Otherwise it was a long press (hold to pause), so don't navigate.
  };

  const onPointerCancel = () => {
    gesture.current = null;
    setIsHeld(false);
  };

  return {
    index: slide.index,
    previousIndex: slide.previousIndex,
    direction: slide.direction,
    isPaused: isHeld || isTabHidden,
    next,
    prev,
    goTo,
    gestureHandlers: { onPointerDown, onPointerUp, onPointerCancel },
  };
}
