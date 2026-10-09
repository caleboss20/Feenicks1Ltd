"use client";

/**
 * A number whose digits roll into place like an odometer, e.g. the
 * dashboard's portfolio value: on first show every digit spins one full
 * turn and lands on its value (left to right, a few ms apart), in about
 * 0.9 s, so even "2,000.00" visibly counts up. Later changes roll each digit
 * from its old value to the new one.
 *
 *    ┌─┐┌─┐ ┌─┐┌─┐┌─┐
 *    │2││,│ │0││0││0│ .00     ← each digit is a 0–9 0–9 strip in a one-digit window
 *    └─┘└─┘ └─┘└─┘└─┘
 *
 * Commas and the point stay still. The window is cut with clip-path (not
 * overflow), so the digits keep the text baseline next to "GH₵". Screen
 * readers get the plain value. Reduced motion: no roll.
 */

import { useEffect, useState } from "react";

/** Two turns of 0–9: every digit spins one full turn before landing (zeros too). */
const STRIP = [..."01234567890123456789"];

export function RollingNumber({
  value,
  fractionClassName,
}: {
  /** Already formatted, e.g. "2,000.00". */
  value: string;
  /** Classes for the part after the point (smaller, lighter). */
  fractionClassName?: string;
}) {
  // First paint shows zeros; the next frame sets the real digits, so they roll.
  const [isRolled, setIsRolled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setIsRolled(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  const [whole, fraction] = value.split(".");
  let column = 0;
  const render = (text: string) =>
    [...text].map((char, index) =>
      /\d/.test(char) ? (
        <DigitColumn key={index} position={isRolled ? Number(char) + 10 : 0} order={column++} />
      ) : (
        <span key={index}>{char}</span>
      ),
    );

  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {render(whole)}
        {fraction !== undefined && <span className={fractionClassName}>.{render(fraction)}</span>}
      </span>
    </>
  );
}

/** `position`: index in the 20-digit strip (0 = rest, digit + 10 = landed after a full turn). */
function DigitColumn({ position, order }: { position: number; order: number }) {
  return (
    <span className="relative inline-block [clip-path:inset(0_-0.05em)]">
      {/* Sets the window's size and baseline; the strip rolls inside it. */}
      <span className="invisible">0</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${position * 5}%)`, transitionDelay: `${order * 35}ms` }}
      >
        {STRIP.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </span>
    </span>
  );
}
