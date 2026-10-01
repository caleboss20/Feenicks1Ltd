import { cn } from "@/lib/utils";

/**
 * AnimatedCheck: a success badge that draws itself:
 *   1. a green ring traces around (0.9 s)
 *   2. the tick draws inside it
 *   3. the badge fills with soft green
 *
 * Pure CSS/SVG. For users with "reduce motion" on, it simply appears.
 * Use for big success moments (account set up, deposit received…).
 * 80px by default; pass a size class to change it, e.g. className="size-16".
 *
 * @example <AnimatedCheck className="size-16" />
 */
export function AnimatedCheck({ className }: { className?: string }) {
  // Default size only when none is passed (two size classes would conflict).
  const hasCustomSize = /(^|\s|:)size-/.test(className ?? "");

  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      className={cn("shrink-0", !hasCustomSize && "size-20", className)}
    >
      {/* Soft green fill, popping in once the ring is drawn. fill-box +
          center make it grow from the circle's own centre. */}
      <circle
        cx="40"
        cy="40"
        r="36"
        className="animate-pop-in fill-brand-50 [animation-delay:0.6s] [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none dark:fill-brand-500/15"
      />
      {/* The ring, drawn from the top, clockwise. pathLength=1 lets the CSS
          animate "how much of it is drawn" from 0 to 100%. */}
      <circle
        cx="40"
        cy="40"
        r="36"
        pathLength={1}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1"
        transform="rotate(-90 40 40)"
        className="animate-ring-draw stroke-brand-600 motion-reduce:animate-none"
      />
      {/* The tick, drawn after the ring. */}
      <path
        d="M26 41.5 35.5 51 54 31"
        pathLength={1}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        className="animate-check-draw stroke-brand-600 [animation-delay:0.75s] motion-reduce:animate-none"
      />
    </svg>
  );
}
