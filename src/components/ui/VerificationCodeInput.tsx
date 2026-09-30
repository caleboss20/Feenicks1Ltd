"use client";

/**
 * VerificationCodeInput: the row of single-digit boxes used to enter a
 * one-time code (OTP) sent by SMS or email.
 *
 *   [ 4 ] [ 7 ] [ | ] [   ]   ← the box being typed in gets a green border
 *
 * Behaviour, as users expect from banking apps:
 *   - typing a digit moves to the next box
 *   - Backspace on an empty box moves back to the previous one
 *   - pasting the whole code fills every box at once
 *   - phones offer to autofill the code from the SMS (autocomplete="one-time-code")
 *   - only digits are accepted, and the numeric keypad opens on mobile
 *
 * Controlled component: the parent owns the value. Empty boxes are stored
 * as spaces so every digit keeps its position (e.g. "4 7" = boxes 1 and 3
 * filled). Use `isCodeComplete(value, length)` to check it's fully entered.
 */

/** True when every box holds a digit. */
export function isCodeComplete(value: string, length: number) {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

import { useRef } from "react";
import { cn } from "@/lib/utils";

type VerificationCodeInputProps = {
  /** Number of digits in the code. */
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once every box is filled, e.g. to enable or trigger "Verify". */
  onComplete?: (code: string) => void;
  /** Shows the boxes in their red error state. */
  hasError?: boolean;
  /** Accessible name for the whole group, e.g. "Verification code". */
  label?: string;
  autoFocus?: boolean;
};

export function VerificationCodeInput({
  length,
  value,
  onChange,
  onComplete,
  hasError,
  label = "Verification code",
  autoFocus,
}: VerificationCodeInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  // One entry per box; "" means empty.
  const digits = Array.from({ length }, (_, i) => (value[i] ?? " ").trim());

  /** Saves the boxes back as one string (spaces for empty boxes). */
  const save = (next: string[]) => {
    const code = next.map((d) => d || " ").join("").trimEnd();
    onChange(code);
    return code;
  };

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputs.current[clamped]?.focus();
    inputs.current[clamped]?.select();
  };

  /** Writes digits starting at `index` (handles single keystrokes AND pastes). */
  const fillFrom = (index: number, typed: string) => {
    const newDigits = typed.replace(/\D/g, "");
    if (!newDigits) return;

    const next = [...digits];
    for (let i = 0; i < newDigits.length && index + i < length; i++) {
      next[index + i] = newDigits[i];
    }
    const code = save(next);
    focusBox(index + newDigits.length);
    if (isCodeComplete(code, length)) onComplete?.(code);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = ""; // clear this box
      } else if (index > 0) {
        next[index - 1] = ""; // empty box: step back and clear the previous one
        focusBox(index - 1);
      }
      save(next);
    }
    if (e.key === "ArrowLeft") focusBox(index - 1);
    if (e.key === "ArrowRight") focusBox(index + 1);
  };

  return (
    <div role="group" aria-label={label} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, "");
            if (!typed) {
              // Box emptied (some Android keyboards delete without a Backspace key event).
              const next = [...digits];
              next[index] = "";
              save(next);
              return;
            }
            // A full code at once = SMS autofill → spread it across the boxes.
            // Otherwise keep only the newest digit typed into this box.
            fillFrom(index, typed.length >= length ? typed : typed.slice(-1));
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => {
            e.preventDefault();
            fillFrom(index, e.clipboardData.getData("text"));
          }}
          onFocus={(e) => e.target.select()}
          // Only the first box offers SMS autofill; it then spreads across all boxes.
          autoComplete={index === 0 ? "one-time-code" : "off"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError || undefined}
          className={cn(
            "h-15 w-full rounded-2xl border bg-neutral-100 text-center text-2xl font-bold caret-brand-600 outline-none transition-colors lg:h-13 lg:rounded-xl lg:text-xl dark:bg-white/5",
            hasError
              ? "border-red-500 bg-red-50 dark:bg-red-500/10"
              : "border-transparent focus:border-brand-600 focus:bg-brand-50 dark:focus:bg-brand-500/10",
          )}
        />
      ))}
    </div>
  );
}
