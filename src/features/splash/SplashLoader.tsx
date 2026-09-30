/**
 * Slim indeterminate loading bar shown at the bottom of the splash screen.
 *
 * Pure CSS (Server Component, no JavaScript shipped): a short white bar
 * glides across a faint track on repeat. With reduced motion enabled it
 * just sits still.
 */
export function SplashLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative h-[3px] w-20 overflow-hidden rounded-full bg-white/20 sm:w-24"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-2/5 animate-loader-slide rounded-full bg-white motion-reduce:animate-none"
      />
    </div>
  );
}
