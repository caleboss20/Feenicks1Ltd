import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * PasswordRequirements: a live checklist under a "new password" field.
 * Each rule turns green with a tick as soon as the typed password meets it.
 *
 *   ✓ At least 8 characters
 *   ✓ Includes a letter
 *   ○ Includes a number
 *   ○ Passwords match
 *
 * Telling users the rules up front (instead of only erroring afterwards)
 * is standard in banking/fintech apps and cuts failed attempts.
 * The rules themselves come from the caller (see PASSWORD_RULES in
 * features/auth/authValidation.ts), so this component never goes out of
 * date with the real policy.
 */

export type RequirementItem = { label: string; isMet: boolean };

export function PasswordRequirements({
  items,
  className,
}: {
  items: RequirementItem[];
  className?: string;
}) {
  return (
    <ul aria-label="Password requirements" className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className={cn(
            "flex items-center gap-3 text-base transition-colors lg:text-sm",
            item.isMet ? "text-foreground" : "text-neutral-500",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-full transition-colors",
              item.isMet
                ? "bg-brand-600 text-white"
                : "border-[1.5px] border-neutral-300 text-transparent dark:border-white/20",
            )}
          >
            <CheckIcon className="size-3.5 stroke-3" />
          </span>
          {item.label}
          {/* Screen readers hear the status, not just the colour change. */}
          <span className="sr-only">{item.isMet ? "(done)" : "(not yet)"}</span>
        </li>
      ))}
    </ul>
  );
}
