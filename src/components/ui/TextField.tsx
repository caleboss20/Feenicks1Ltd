"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * TextField: the app's standard input.
 *
 * Visual states (all CSS, no JS):
 *   default  → soft grey fill, grey icon
 *   focused  → light green fill, green border, green icon
 *   filled   → dark icon (the field has a value)
 *   error    → light red fill, red border, message underneath
 *
 * Accessibility: the label is visually hidden (the design shows the
 * placeholder only) but still read by screen readers. Errors are linked
 * via `aria-describedby` and flagged with `aria-invalid`.
 *
 * Works directly with react-hook-form: `<TextField {...register("email")} />`
 * (React 19 passes `ref` as a normal prop, so no forwardRef is needed).
 */

type TextFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Accessible name, e.g. "Email". Also used as the placeholder if none is given. */
  label: string;
  /** Icon shown on the left, e.g. <MailIcon />. */
  icon?: React.ReactNode;
  /** Element shown on the right, e.g. a show/hide password button. */
  trailing?: React.ReactNode;
  /** Validation message. When set, the field shows its error state. */
  error?: string;
  /**
   * "md" (default): 60px tall on touch screens, 52px on desktop.
   * "sm": compact 52px everywhere, for long forms on small phones.
   */
  fieldSize?: "md" | "sm";
};

const FIELD_SIZES = {
  md: "h-15 gap-3 rounded-2xl px-5 lg:h-13 lg:rounded-xl lg:px-4",
  sm: "h-13 gap-2.5 rounded-xl px-4",
};

export function TextField({
  label,
  icon,
  trailing,
  error,
  fieldSize = "md",
  id,
  className,
  placeholder,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    // min-w-0: never wider than its container (e.g. Android date inputs have
    // a large built-in minimum width that could push the page sideways).
    <div className={cn("min-w-0", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <div
        className={cn(
          "group flex items-center border transition-colors",
          FIELD_SIZES[fieldSize],
          error
            ? "border-red-500 bg-red-50 dark:bg-red-500/10"
            : "border-transparent bg-neutral-100 focus-within:border-brand-600 focus-within:bg-brand-50 dark:bg-white/5 dark:focus-within:bg-brand-500/10",
        )}
      >
        {icon && (
          <span
            className={cn(
              "transition-colors",
              error
                ? "text-red-500"
                : // Grey by default, dark once filled, green while focused.
                  "text-neutral-400 group-focus-within:text-brand-600! group-has-[input:not(:placeholder-shown)]:text-foreground",
            )}
          >
            {icon}
          </span>
        )}

        <input
          id={inputId}
          placeholder={placeholder ?? label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          // w-0 + flex-1: the input only takes the space left over, so its
          // own minimum width can never stretch the field past the screen.
          // text-base (16px) on purpose: smaller makes iPhones zoom in on tap.
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-neutral-400"
          {...inputProps}
        />

        {trailing}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 px-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * PasswordField: TextField with a show/hide toggle (eye icon) on the right.
 */
export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-full text-neutral-400 transition-colors hover:text-foreground group-focus-within:text-brand-600"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
