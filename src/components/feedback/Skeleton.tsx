import { cn } from "@/lib/utils";

/**
 * Skeletons: soft grey shapes in the layout of the content that is loading,
 * so a screen never flashes blank and feels ready sooner than a spinner.
 * They pulse gently (still with "reduce motion") and are announced once to
 * screen readers as "Loading…" via aria-busy on the wrapper.
 *
 *   <SkeletonList rows={3} label="Loading notifications" />
 *   <SkeletonCard className="h-48" />
 *   <ScreenSkeleton label="Loading your wallet" />   ← a whole step screen
 */

const PULSE = "animate-pulse motion-reduce:animate-none";

/** One grey shape. Size it with classes (h-*, w-*, rounded-*). */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block rounded-md bg-neutral-200/80 dark:bg-white/10", className)} />;
}

/** Rows of icon · two lines · amount: the shape of activity and notification lists. */
export function SkeletonList({ rows = 3, label, className }: { rows?: number; label: string; className?: string }) {
  return (
    <ul aria-busy="true" aria-label={label} className={cn("flex flex-col gap-7", PULSE, className)}>
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-start gap-4">
          <Skeleton className="size-11 shrink-0 rounded-full bg-neutral-100" />
          <span className="flex-1 pt-1">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="mt-2.5 h-3 w-2/5 bg-neutral-100 dark:bg-white/5" />
          </span>
          <Skeleton className="mt-1 h-3.5 w-16" />
        </li>
      ))}
    </ul>
  );
}

/** A white card with a title line and two text lines (e.g. Home's card area). */
export function SkeletonCard({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn("flex flex-col rounded-3xl bg-white p-5 dark:bg-white/5", PULSE, className)}
    >
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="mt-4 h-3 w-4/5 bg-neutral-100 dark:bg-white/5" />
      <Skeleton className="mt-2.5 h-3 w-3/5 bg-neutral-100 dark:bg-white/5" />
      <Skeleton className="mt-auto h-11 w-full rounded-full bg-neutral-100 dark:bg-white/5" />
    </div>
  );
}

/**
 * A whole step screen while its data loads (wallet, withdraw, invest):
 * header · card · two buttons · a short list, in the same places as the
 * real screen, so nothing jumps when it arrives.
 */
export function ScreenSkeleton({ label }: { label: string }) {
  return (
    <main
      aria-busy="true"
      aria-label={label}
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] lg:max-w-lg",
        PULSE,
      )}
    >
      <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center py-1.5">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
      <Skeleton className="mt-6 h-48 w-full rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-13 rounded-2xl" />
        <Skeleton className="h-13 rounded-2xl" />
      </div>
      <SkeletonList rows={3} label={label} className="mt-10" />
    </main>
  );
}
