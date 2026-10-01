import { cn } from "@/lib/utils";

/**
 * StepProgress: a slim progress line with a dot per step, for multi-step
 * forms (e.g. the investor profile questions).
 *
 *   ●━━━━━━━━━━━◉──────────○      ← done · current · to do
 *
 * Done steps and the line behind them are brand green; the current dot is
 * a green ring; later steps are grey. Screen readers hear "Step 2 of 3".
 */
export function StepProgress({
  current,
  total,
  className,
}: {
  /** The current step, counting from 1. */
  current: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Step ${current} of ${total}`}
      className={cn("flex items-center", className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <div key={step} className={cn("flex items-center", step < total && "flex-1")}>
            <span
              className={cn(
                "size-3 shrink-0 rounded-full transition-colors duration-300",
                isDone && "bg-brand-600",
                isCurrent && "bg-background ring-[2.5px] ring-brand-600",
                !isDone && !isCurrent && "bg-neutral-200 dark:bg-white/15",
              )}
            />
            {step < total && (
              <span className="mx-1.5 h-0.5 flex-1 rounded-full bg-neutral-200 dark:bg-white/15">
                <span
                  className={cn(
                    "block h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out",
                    isDone ? "w-full" : "w-0",
                  )}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
