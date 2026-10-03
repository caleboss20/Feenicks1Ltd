import { LockIcon } from "@/components/icons";

/**
 * A calm note explaining why the investor can't put money into a package
 * right now (the package rules in packagePolicy.ts), with a small lock.
 * Neutral, not an error: nothing went wrong, it's how investing works for now.
 */
export function PackageRuleNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="flex items-start gap-2.5 rounded-2xl bg-neutral-100 p-3.5 text-[0.8125rem] leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-neutral-300"
    >
      <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
      <span>{children}</span>
    </p>
  );
}
