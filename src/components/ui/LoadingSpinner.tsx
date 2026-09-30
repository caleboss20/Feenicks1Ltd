import { cn } from "@/lib/utils";

/**
 * LoadingSpinner: a ring of fading brand-green dots that rotates.
 * Pure CSS; stays still for users who turned on "reduce motion".
 *
 * @example <LoadingSpinner label="Redirecting" />
 */

const DOT_COUNT = 8;

export function LoadingSpinner({
  label = "Loading",
  className,
}: {
  /** Read out by screen readers. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("relative size-12 animate-spin motion-reduce:animate-none", className)}
      style={{ animationDuration: "1.2s" }}
    >
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-0 flex justify-center"
          // Spread the dots evenly around the circle, each a little more
          // opaque than the last, so the ring reads as a moving "tail".
          style={{ transform: `rotate(${(360 / DOT_COUNT) * i}deg)`, opacity: (i + 1) / DOT_COUNT }}
        >
          <span className="size-2.5 rounded-full bg-brand-600" />
        </span>
      ))}
    </div>
  );
}
