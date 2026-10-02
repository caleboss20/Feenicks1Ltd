/**
 * Switch: an on/off toggle, brand green when on (a `role="switch"` button,
 * so screen readers announce "on" / "off").
 *
 *   (   ●)  on      (●   )  off
 *
 * @example <Switch checked={isOn} onChange={setIsOn} label="Unlock with fingerprint" />
 */

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read by screen readers, e.g. "Unlock with fingerprint". */
  label: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-neutral-300 dark:bg-white/20",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 size-6 rounded-full bg-white transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
