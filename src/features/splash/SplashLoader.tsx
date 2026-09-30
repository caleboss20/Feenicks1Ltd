/**
 * Circular "dot spinner" shown at the bottom of the splash screen.
 *
 * Pure CSS (Server Component, no JavaScript shipped): 8 dots are placed
 * around a circle, each fading in opacity, and the whole ring rotates.
 */

const DOT_COUNT = 8;

export function SplashLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative size-9 animate-spin-slow motion-reduce:animate-none sm:size-10"
    >
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-0 flex justify-center"
          style={{
            // Spread the dots evenly around the circle...
            transform: `rotate(${(360 / DOT_COUNT) * i}deg)`,
            // ...and fade them so the ring reads as a moving "tail".
            opacity: (i + 1) / DOT_COUNT,
          }}
        >
          <span className="size-1.5 rounded-full bg-white sm:size-2" />
        </span>
      ))}
    </div>
  );
}
