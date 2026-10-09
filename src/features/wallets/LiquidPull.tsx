"use client";

/**
 * Liquid pull: pull the wallet card down to go to the next step (Invest →
 * the amount; Withdraw → the amount). A shortcut: the button under the card
 * always does the same thing (and is what screen readers use).
 *
 *            ╭───────────────────╮
 *            │ ↓ Pull to invest  │      ← a bubble of near-black "liquid",
 *            ╰─────────┬─────────╯        joined to the card by a stretching
 *                     ╲│╱                 neck (an SVG "goo" filter melts the
 *        ┌─────────────┴─────────────┐    shapes together)
 *        │  IC              ▦        │
 *        │  GH₵ 2,000.00             │  ← the card follows the finger, slowed
 *        └───────────────────────────┘    down (it feels heavy)
 *
 * Past the threshold the bubble swells, the label reads "Release to …" and
 * Android phones give a short buzz. Releasing there floods the screen in faint
 * ash grey from the bubble and opens the next page as the colour fades away. Released
 * earlier, everything springs back.
 *
 * Details that matter:
 *   - touch-action: none on the card, so the pull never scrolls the page or
 *     sets off the browser's own pull-to-refresh
 *   - taps on buttons inside the card (the eye) are left alone
 *   - prefers-reduced-motion: no liquid or flood; a pull simply opens the page
 *   - first visits: one gentle nudge of the card and a hint under it, until
 *     the investor has used the pull once (localStorage, per device)
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** How far (px, after the drag is slowed down) the card must travel to trigger. */
const THRESHOLD = 96;
/** The furthest the card goes, however far the finger travels. */
const MAX_PULL = 168;
/** Finger movement before it counts as a pull (a tap stays a tap). */
const DEAD_ZONE = 6;
/** Remembers that the investor has used the pull (then the hint stops). */
const HINT_KEY = "feenicks1-liquid-pull-used";
/**
 * The liquid's colour: near-black (ash in dark mode), so the bubble stands
 * apart from the green card. The flood after a release is a faint ash grey
 * (--flood), soft on the eye between pages. Both are set on the wrapper.
 */
const LIQUID_CLASS = "[--liquid:#1c1c1e] [--flood:#e5e5e7] dark:[--liquid:#48484a] dark:[--flood:#2c2c2e]";
const LIQUID = "var(--liquid)";

/** Finger distance → card distance: 1:1 at first, then heavier and heavier (about 140 px of finger to trigger). */
function resist(distance: number): number {
  return MAX_PULL * (1 - Math.exp(-distance / MAX_PULL));
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readHintUsed(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return true;
  }
}

/**
 * The flood: a faint ash-grey circle grows from the bubble to cover the screen, the
 * page changes underneath it, then the colour fades away. Plain DOM on
 * <body>, so it outlives this screen while the next one loads.
 */
function floodThenNavigate(origin: { x: number; y: number }, color: string, go: () => void, target: string) {
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    zIndex: "100",
    background: color,
    pointerEvents: "none",
  });
  document.body.appendChild(layer);
  const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  const flood = layer.animate(
    [
      { clipPath: `circle(28px at ${origin.x}px ${origin.y}px)` },
      { clipPath: `circle(${radius + 40}px at ${origin.x}px ${origin.y}px)` },
    ],
    { duration: 420, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
  );
  flood.onfinish = () => {
    go();
    // Wait for the next page (up to 1.5 s), then let the colour drain away.
    const startedAt = performance.now();
    const waitForPage = () => {
      const arrived = window.location.pathname === target;
      if (!arrived && performance.now() - startedAt < 1500) return requestAnimationFrame(waitForPage);
      const fade = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" });
      fade.onfinish = () => layer.remove();
    };
    requestAnimationFrame(waitForPage);
  };
}

export function LiquidPull({
  action,
  href,
  disabled = false,
  children,
}: {
  /** The verb on the bubble: "invest" → "Pull to invest" / "Release to invest". */
  action: string;
  /** Where a completed pull goes (the same page as the button under the card). */
  href: string;
  /** No pull (e.g. nothing can be invested right now): the card is just a card. */
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const gooId = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; active: boolean } | null>(null);
  const spring = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  /** The card's width, measured when a pull starts (the liquid is drawn to it). */
  const [width, setWidth] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const pastThreshold = pull >= THRESHOLD;
  const wasPast = useRef(false);

  // First visits: a hint under the card and one gentle nudge of the card.
  useEffect(() => {
    if (disabled || readHintUsed()) return;
    const show = window.setTimeout(() => setShowHint(true), 0);
    if (prefersReducedMotion()) return () => window.clearTimeout(show);
    const nudge = window.setTimeout(() => {
      wrapRef.current?.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(18px)" },
          { transform: "translateY(-3px)" },
          { transform: "translateY(0)" },
        ],
        { duration: 900, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" },
      );
    }, 700);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(nudge);
    };
  }, [disabled]);

  // A short buzz when it becomes "Release to …" (Android; iPhones ignore it).
  useEffect(() => {
    if (pastThreshold && !wasPast.current) navigator.vibrate?.(12);
    wasPast.current = pastThreshold;
  }, [pastThreshold]);

  useEffect(() => () => {
    if (spring.current) cancelAnimationFrame(spring.current);
  }, []);

  /** Back to rest with a little wobble, like liquid settling. */
  const springBack = useCallback((from: number) => {
    let value = from;
    let velocity = 0;
    const step = () => {
      velocity = (velocity - value * 0.11) * 0.74; // stiffness, damping
      value += velocity;
      if (Math.abs(value) < 0.4 && Math.abs(velocity) < 0.4) {
        setPull(0);
        spring.current = null;
        return;
      }
      setPull(Math.max(value, -10));
      spring.current = requestAnimationFrame(step);
    };
    spring.current = requestAnimationFrame(step);
  }, []);

  const complete = () => {
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Storage blocked: the hint just keeps showing.
    }
    setShowHint(false);
    if (prefersReducedMotion()) {
      router.push(href);
      return;
    }
    setIsLeaving(true);
    const box = wrapRef.current?.getBoundingClientRect();
    const origin = box ? { x: box.left + box.width / 2, y: box.top - bubbleY(pull) } : { x: innerWidth / 2, y: 120 };
    const color = (wrapRef.current && getComputedStyle(wrapRef.current).getPropertyValue("--flood").trim()) || "#e5e5e7";
    floodThenNavigate(origin, color, () => router.push(href), href.split("?")[0]);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || isLeaving || event.button !== 0) return;
    // The eye (and any other control on the card) keeps working as a tap.
    if ((event.target as Element).closest("button, a, input")) return;
    if (spring.current) cancelAnimationFrame(spring.current);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    const dx = event.clientX - current.startX;
    if (!current.active) {
      if (Math.abs(dy) < DEAD_ZONE && Math.abs(dx) < DEAD_ZONE) return;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        drag.current = null; // not a downward pull
        return;
      }
      current.active = true;
      setWidth(wrapRef.current?.offsetWidth ?? 0);
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
      router.prefetch(href);
    }
    setPull(resist(Math.max(0, dy - DEAD_ZONE)));
  };

  const onPointerEnd = (event: React.PointerEvent) => {
    const current = drag.current;
    drag.current = null;
    if (!current || current.pointerId !== event.pointerId || !current.active) return;
    if (event.type === "pointerup" && pull >= THRESHOLD) complete();
    else springBack(pull);
  };

  const progress = Math.min(pull / THRESHOLD, 1);
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  return (
    <div className={cn("relative", LIQUID_CLASS)}>
      {/* The liquid: drawn above the card, in the space the pull opens up. */}
      {!disabled && pull > 2 && !reduced && <Liquid pull={pull} width={width} progress={progress} gooId={gooId} isLeaving={isLeaving} />}
      {!disabled && pull > 2 && (
        <PullLabel action={action} pull={pull} pastThreshold={pastThreshold} isLeaving={isLeaving} />
      )}

      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={cn("relative z-10 select-none", !disabled && "cursor-grab touch-none active:cursor-grabbing")}
        style={{
          transform: pull ? `translateY(${pull}px) scale(${1 - progress * 0.02})` : undefined,
          willChange: pull ? "transform" : undefined,
        }}
      >
        {children}
      </div>

      {showHint && !disabled && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <span aria-hidden className="inline-block animate-bounce motion-reduce:animate-none">
            ↓
          </span>
          Tip: pull the card down to {action}
        </p>
      )}
    </div>
  );
}

/** Where the bubble's centre sits above the card's top edge, for a given pull. */
function bubbleY(pull: number): number {
  return Math.max(22, pull * 0.62);
}

/**
 * The bubble, the neck and a ripple along the card's top edge, melted
 * together by the goo filter (blur, then a hard alpha cut) so they move
 * like one blob of liquid.
 */
function Liquid({
  pull,
  width,
  progress,
  gooId,
  isLeaving,
}: {
  pull: number;
  width: number;
  progress: number;
  gooId: string;
  isLeaving: boolean;
}) {
  const height = pull + 24; // the gap the card has opened, plus its top edge
  const cy = pull - bubbleY(pull); // bubble centre (the card's top edge is at y = pull)
  const mid = width / 2;
  const bubbleW = 92 + progress * 70; // swells as it fills
  const bubbleH = 30 + progress * 8;
  const neckW = Math.max(10, 46 - progress * 30); // thins as it stretches
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-visible"
      width="100%"
      height={height}
    >
      <defs>
        <filter id={gooId} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g filter={`url(#${gooId})`} fill={LIQUID} opacity={isLeaving ? 0 : 1}>
        {/* The card's edge the liquid rises from (hidden under the card). */}
        <rect x={width * 0.18} y={height - 18} width={width * 0.64} height="30" rx="14" />
        {/* The neck, from the card up to the bubble. */}
        <rect x={mid - neckW / 2} y={cy} width={neckW} height={Math.max(0, height - cy)} rx={neckW / 2} />
        {/* The bubble. */}
        <rect
          x={mid - bubbleW / 2}
          y={cy - bubbleH / 2}
          width={bubbleW}
          height={bubbleH}
          rx={bubbleH / 2}
        />
      </g>
    </svg>
  );
}

/** "↓ Pull to invest" → "↑ Release to invest", over the bubble (outside the goo, so it stays crisp). */
function PullLabel({
  action,
  pull,
  pastThreshold,
  isLeaving,
}: {
  action: string;
  pull: number;
  pastThreshold: boolean;
  isLeaving: boolean;
}) {
  const progress = Math.min(pull / THRESHOLD, 1);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
      style={{
        transform: `translateY(${pull - bubbleY(pull) - 7}px)`,
        opacity: isLeaving ? 0 : Math.min(1, Math.max(0, (pull - 24) / 40)),
      }}
    >
      <span
        className="flex items-center gap-1 text-[0.8125rem] leading-none font-semibold whitespace-nowrap text-white"
        style={{ transform: `scale(${0.9 + progress * 0.1})` }}
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: pastThreshold ? "rotate(180deg)" : undefined }}
        >
          ↓
        </span>
        {pastThreshold ? `Release to ${action}` : `Pull to ${action}`}
      </span>
    </div>
  );
}
