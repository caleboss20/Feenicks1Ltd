import { IS_PUBLIC_LAUNCH } from "@/config/launch";
import { cn } from "@/lib/utils";

/**
 * "Test version": a small label on the screens outsiders land on (welcome
 * slides, log in, sign up), so nobody mistakes this build for the launched
 * service. Gone automatically at launch (config/launch.ts).
 *
 * `onPhoto`: light text on a translucent dark pill, for the welcome slides'
 * photos; otherwise amber on the page.
 */
export function TestVersionBadge({ onPhoto = false, className }: { onPhoto?: boolean; className?: string }) {
  if (IS_PUBLIC_LAUNCH) return null;
  return (
    <span
      title="This is a test version of Feenicks1. It isn't open to the public yet, and no real money is used."
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] leading-none font-semibold tracking-wide",
        onPhoto
          ? "bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
        className,
      )}
    >
      Test version
      <span className="sr-only">: not open to the public yet, and no real money is used</span>
    </span>
  );
}
