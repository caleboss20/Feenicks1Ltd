import { cn } from "@/lib/utils";

/**
 * PinDots: the row of PIN boxes. Digits are NEVER shown, only a dot per
 * entered digit (so nobody can read the PIN over the user's shoulder).
 *
 *   [ ● ] [ ● ] [ ▮ ] [   ]     ← filled = green dot, next box = green outline
 *
 * Pass a different `shakeKey` (e.g. a counter) to replay the "no" shake,
 * for instance when two PINs don't match.
 */

type PinDotsProps = {
  length: number;
  /** How many digits have been entered (the digits themselves never come here). */
  filled: number;
  hasError?: boolean;
  /** Change this value to trigger the shake animation again. */
  shakeKey?: number;
};

export function PinDots({ length, filled, hasError, shakeKey = 0 }: PinDotsProps) {
  return (
    <div
      // Re-keyed to restart the shake animation on every new error.
      key={shakeKey}
      aria-hidden
      className={cn(
        "mx-auto grid w-full max-w-xs gap-3",
        hasError && shakeKey > 0 && "animate-shake motion-reduce:animate-none",
      )}
      style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
    >
      {Array.from({ length }, (_, i) => {
        const isFilled = i < filled;
        const isCurrent = i === filled;
        return (
          <span
            key={i}
            className={cn(
              "grid h-15 place-items-center rounded-2xl border bg-neutral-100 transition-colors lg:h-14 dark:bg-white/5",
              hasError
                ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                : isCurrent
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-500/10"
                  : "border-transparent",
            )}
          >
            {isFilled && (
              <span
                className={cn(
                  "size-3.5 animate-pop-in rounded-full motion-reduce:animate-none",
                  hasError ? "bg-red-500" : "bg-foreground",
                )}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
