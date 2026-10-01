"use client";

/**
 * NumericKeypad: an on-screen number pad, as in banking apps.
 *
 *     1   2   3
 *     4   5   6
 *     7   8   9
 *         0   ⌫
 *
 * Used for PINs instead of a text field, so the browser can't save,
 * autofill or suggest the PIN. Large tap targets for thumbs.
 * (Physical keyboards are handled by the screen using it.)
 */

import { BackspaceIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"] as const;

type NumericKeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  className?: string;
};

export function NumericKeypad({ onDigit, onBackspace, disabled, className }: NumericKeypadProps) {
  return (
    <div
      role="group"
      aria-label="Number pad"
      className={cn("mx-auto grid w-full max-w-xs grid-cols-3 gap-x-4 gap-y-2", className)}
    >
      {KEYS.map((key) => {
        // Empty bottom-left slot. Its own key name: using its position (9)
        // would clash with the "9" button's key.
        if (key === "") return <span key="empty" aria-hidden />;

        const isBackspace = key === "backspace";
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => (isBackspace ? onBackspace() : onDigit(key))}
            aria-label={isBackspace ? "Delete last digit" : key}
            className={cn(
              "grid h-14 cursor-pointer place-items-center rounded-2xl text-2xl font-semibold transition-[background-color,transform] select-none hover:bg-neutral-100 active:scale-95 active:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40 lg:h-12 lg:text-xl dark:hover:bg-white/5 dark:active:bg-white/10",
              // Don't let a double-tap zoom the page on phones.
              "touch-manipulation",
            )}
          >
            {isBackspace ? <BackspaceIcon className="size-6" /> : key}
          </button>
        );
      })}
    </div>
  );
}
