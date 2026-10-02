import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Checkbox: a green rounded-square checkbox with a label.
 *
 * A real (visually hidden) <input type="checkbox"> sits underneath, so
 * keyboard, screen readers and forms all work natively. The styled box
 * reacts to it through Tailwind's `peer-*` variants.
 *
 * Works with react-hook-form: `<Checkbox label="Remember me" {...register("remember")} />`
 *
 * Sizes: "md" (default, 24px, e.g. "Remember me") and "sm" (18px square,
 * for a sentence-long label such as agreeing to terms; sits on the first
 * line of the text).
 */
export function Checkbox({
  label,
  size = "md",
  className,
  ...inputProps
}: Omit<React.ComponentProps<"input">, "type" | "size"> & { label: string; size?: "md" | "sm" }) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 text-[0.9375rem] font-semibold select-none lg:text-sm",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...inputProps} />
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center border-brand-600 text-transparent transition-colors peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400",
          size === "sm"
            ? "mt-px size-[18px] rounded-[5px] border-2"
            : "size-6 rounded-lg border-[2.5px]",
        )}
      >
        <CheckIcon className={cn("stroke-3", size === "sm" ? "size-3" : "size-4")} />
      </span>
      {label}
    </label>
  );
}
