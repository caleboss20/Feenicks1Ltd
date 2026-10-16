"use client";

/**
 * Pull down to refresh, as in any phone app: at the very top of the page,
 * drag down and let go to reload the screen's data (lib/refresh.ts).
 *
 *        ( ↻ )      ← a white circle that follows the finger, its arc
 *                     filling as you pull; spins while refreshing
 *
 * Touch only (phones); the page itself doesn't move. While this screen is
 * open, the browser's own pull-to-reload is turned off
 * (overscroll-behavior), so the two never both fire. A light tap of
 * vibration (Android) when the pull is far enough to count.
 * Reduced motion: no spinning, just the circle.
 */

import { useEffect, useRef, useState } from "react";
import { requestRefresh } from "@/lib/refresh";
import { cn } from "@/lib/utils";

/** How far (px, after damping) the circle must travel to refresh. */
const THRESHOLD = 64;
/** The furthest it goes. */
const MAX_PULL = 96;
/** Keep the spinner up at least this long, so a refresh is visibly a refresh. */
const MIN_SPIN_MS = 700;

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const armed = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "contain";

    const onStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || event.touches.length !== 1) return;
      startY.current = event.touches[0].clientY;
      armed.current = false;
    };
    const onMove = (event: TouchEvent) => {
      if (startY.current === null) return;
      const dy = event.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      // Damped, so it feels like stretching rather than dragging.
      const next = Math.min(MAX_PULL, dy * 0.5);
      if (next >= THRESHOLD && !armed.current) {
        armed.current = true;
        navigator.vibrate?.(10);
      }
      if (next < THRESHOLD) armed.current = false;
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      const reached = pullRef.current >= THRESHOLD;
      pullRef.current = 0;
      setPull(0);
      if (!reached) return;
      setRefreshing(true);
      requestRefresh();
      window.setTimeout(() => setRefreshing(false), MIN_SPIN_MS);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      root.style.overscrollBehaviorY = previous;
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const visible = refreshing || pull > 4;
  const offset = refreshing ? THRESHOLD : pull;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      aria-hidden={!refreshing}
      role="status"
      aria-label={refreshing ? "Refreshing" : undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center transition-opacity",
        visible ? "opacity-100" : "opacity-0",
        pull === 0 && "transition-[opacity,transform] duration-200",
      )}
      style={{ transform: `translateY(${offset - 40}px)`, paddingTop: "env(safe-area-inset-top)" }}
    >
      <span className="grid size-10 place-items-center rounded-full bg-white text-brand-800 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-white">
        <svg
          viewBox="0 0 24 24"
          className={cn("size-5", refreshing && "animate-spin motion-reduce:animate-none")}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {/* An arc that fills as you pull (a full ring while refreshing). */}
          <circle cx="12" cy="12" r="8" pathLength="100" strokeDasharray={`${refreshing ? 75 : progress * 75} 100`} />
        </svg>
      </span>
    </div>
  );
}
