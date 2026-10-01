import { cn } from "@/lib/utils";

/**
 * Confetti: a short, soft burst of brand-green confetti that falls once.
 *
 * Pure CSS, no JavaScript. Place it inside a `relative` container; it
 * covers the container and never blocks taps. Hidden entirely for users
 * with "reduce motion" on.
 *
 * Positions and timings follow a fixed pattern (not Math.random), so the
 * server and the browser render exactly the same thing.
 */

const PIECE_COUNT = 28;
const COLOURS = ["bg-brand-300", "bg-brand-400", "bg-brand-500", "bg-brand-600", "bg-brand-200", "bg-amber-300"];

/** Deterministic "random-looking" number in [0, 1) for piece i. */
const pseudoRandom = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function Confetti({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden", className)}
    >
      {Array.from({ length: PIECE_COUNT }, (_, i) => {
        const left = 4 + pseudoRandom(i, 1) * 92; // % across
        const delay = 0.5 + pseudoRandom(i, 2) * 0.9; // s, after the sheet arrives
        const drift = (pseudoRandom(i, 3) - 0.5) * 120; // px sideways
        const spin = 360 + pseudoRandom(i, 4) * 540; // degrees
        const isRound = i % 3 === 0;
        return (
          <span
            key={i}
            className={cn(
              "absolute top-0 animate-confetti-fall",
              COLOURS[i % COLOURS.length],
              isRound ? "size-2 rounded-full" : "h-3 w-1.5 rounded-sm",
            )}
            style={
              {
                left: `${left}%`,
                animationDelay: `${delay}s`,
                "--drift": `${drift}px`,
                "--spin": `${spin}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
