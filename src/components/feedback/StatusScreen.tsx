/**
 * A full-screen message for when a page can't be shown: an error, a page
 * that doesn't exist. Calm and plain: what happened, that their money is
 * safe, and one clear way forward. Never a raw error message.
 *
 *              (!)
 *     Something went wrong
 *   We couldn't load this screen…
 *   (      Try again      )
 *        Go to Home
 *   Reference: 3f9a2c        ← for support, only for errors
 */
export function StatusScreen({
  icon,
  title,
  message,
  primary,
  secondary,
  reference,
}: {
  icon: "error" | "missing" | "offline";
  title: string;
  message: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  reference?: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <span
        aria-hidden
        className={
          icon === "error"
            ? "grid size-16 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            : "grid size-16 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
        }
      >
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon === "error" && (
            <>
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 10v4.5M12 17.2v.1" />
            </>
          )}
          {icon === "missing" && (
            <>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5M8.5 11h5" />
            </>
          )}
          {icon === "offline" && (
            <>
              <path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M3 3l18 18" />
            </>
          )}
        </svg>
      </span>
      <h1 className="mt-6 text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xs text-[0.9375rem] leading-6 text-neutral-600 dark:text-neutral-400">{message}</p>
      <div className="mt-8 flex w-full flex-col items-center gap-2">
        {primary}
        {secondary}
      </div>
      {reference && <p className="mt-8 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">Reference: {reference}</p>}
    </main>
  );
}

export const STATUS_PRIMARY =
  "flex h-13 w-full cursor-pointer items-center justify-center rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";
export const STATUS_SECONDARY =
  "rounded-full px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/10";
