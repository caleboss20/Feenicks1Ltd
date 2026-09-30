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
 */
export function Checkbox({
  label,
  className,
  ...inputProps
}: Omit<React.ComponentProps<"input">, "type"> & { label: string }) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 text-base font-semibold select-none lg:text-sm",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...inputProps} />
      <span
        aria-hidden
        className="grid size-6 place-items-center rounded-lg border-[2.5px] border-brand-600 text-transparent transition-colors peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400"
      >
        <CheckIcon className="size-4 stroke-3" />
      </span>
      {label}
    </label>
  );
}
