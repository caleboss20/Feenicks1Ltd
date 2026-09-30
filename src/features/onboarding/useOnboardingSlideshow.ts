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

export function useOnboardingSlideshow(count: number) {
  const [index, setIndex] = useState(0);
  const [isHeld, setIsHeld] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const gesture = useRef<GestureStart | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const goTo = useCallback((i: number) => setIndex(i), []);

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
    index,
    isPaused: isHeld || isTabHidden,
    next,
    prev,
    goTo,
    gestureHandlers: { onPointerDown, onPointerUp, onPointerCancel },
  };
}
