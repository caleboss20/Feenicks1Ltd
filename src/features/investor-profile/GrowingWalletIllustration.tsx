/**
 * GrowingWalletIllustration: a brown leather wallet with green Ghana cedi
 * notes sticking out, a little "growth" badge and coins twinkling around it.
 * Says "your money, growing" for the start-investing intro.
 *
 * Original Feenicks1 artwork (flat, hand-drawn style), drawn in SVG: sharp
 * on any screen, tiny to load, and animated with CSS only:
 *   - the notes gently rise and settle (float)
 *   - the coins and sparkles twinkle, each on its own beat
 * With "reduce motion" on, everything stays still.
 */

import { cn } from "@/lib/utils";

/** Wallet leather tones (the same in light and dark mode). */
const LEATHER = "#8A4B2A";
const LEATHER_DARK = "#6B3720";
const OUTLINE = "#3A2416";
const STITCH = "#C98A5E";
const BRASS = "#E2B04A";

/** One coin with an inner ring; twinkles on its own beat. */
function Coin({ x, y, r, delay }: { x: number; y: number; r: number; delay: string }) {
  return (
    <g
      className="animate-twinkle [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none"
      style={{ animationDelay: delay }}
    >
      <circle cx={x} cy={y} r={r} strokeWidth="2" className="fill-background stroke-neutral-800 dark:stroke-neutral-200" />
      <circle cx={x} cy={y} r={r * 0.55} fill="none" strokeWidth="1.6" className="stroke-neutral-800 dark:stroke-neutral-200" />
    </g>
  );
}

/** A cedi note: green, with an inner border and a ₵ in the middle. */
function CediNote({ transform, tone }: { transform: string; tone: "light" | "dark" }) {
  return (
    <g transform={transform}>
      <rect
        x="-56"
        y="-28"
        width="112"
        height="56"
        rx="5"
        strokeWidth="2.5"
        className={cn("stroke-brand-900", tone === "light" ? "fill-brand-300" : "fill-brand-400")}
      />
      <rect x="-48" y="-20" width="96" height="40" rx="3" fill="none" strokeWidth="1.5" className="stroke-brand-800/50" />
      <circle cx="0" cy="0" r="12" strokeWidth="1.5" className="fill-brand-200 stroke-brand-800/60" />
      <text
        x="0"
        y="5.5"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        className="fill-brand-900"
      >
        ₵
      </text>
    </g>
  );
}

export function GrowingWalletIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 210" aria-hidden className={className}>
      {/* Soft ground shadow */}
      <ellipse cx="132" cy="192" rx="80" ry="8" className="fill-neutral-200 dark:fill-white/10" />

      {/* Cedi notes, rising out of the wallet (drawn first, so the wallet covers their bottom). */}
      <g className="animate-float [animation-duration:3.5s] motion-reduce:animate-none">
        <CediNote transform="translate(124 72) rotate(-9)" tone="dark" />
        <CediNote transform="translate(140 64) rotate(5)" tone="light" />
      </g>

      {/* Wallet body + stitching */}
      <rect x="56" y="80" width="152" height="102" rx="14" fill={LEATHER} stroke={OUTLINE} strokeWidth="3" />
      <rect x="64" y="88" width="136" height="86" rx="10" fill="none" stroke={STITCH} strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Clasp flap on the right, with a brass button */}
      <rect x="166" y="110" width="56" height="42" rx="13" fill={LEATHER_DARK} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="196" cy="131" r="7.5" fill={BRASS} stroke={OUTLINE} strokeWidth="2.5" />

      {/* Growth badge: "this money is growing" */}
      <circle cx="94" cy="152" r="18" strokeWidth="2.5" className="fill-background stroke-brand-700" />
      <path d="m84 158 7-7 5 4.5 9-10" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-600" />
      <path d="M99 145.5h6.2v6.2" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-600" />

      {/* Coins around the wallet, each twinkling on its own beat */}
      <Coin x={36} y={74} r={10} delay="0s" />
      <Coin x={228} y={58} r={9} delay="0.6s" />
      <Coin x={30} y={150} r={8} delay="1.2s" />
      <Coin x={236} y={168} r={9} delay="1.8s" />

      {/* Sparkle dashes beside the coins */}
      <g
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-twinkle stroke-neutral-800 [animation-delay:0.9s] motion-reduce:animate-none dark:stroke-neutral-200"
      >
        <path d="M50 52l5-8M58 58l8-4" />
        <path d="M214 40l-4-8M222 36l2-9" />
        <path d="M18 132l8 3M20 168l7-4" />
        <path d="M246 150l6-6M250 184l7 2" />
      </g>
    </svg>
  );
}
