"use client";

/**
 * CodeRefreshRing: the small ring in the "Confirmation code" header (as in
 * the mockup). It empties over 30 seconds, in step with the authenticator
 * app, so the user knows when their code is about to change. Turns red
 * for the last few seconds: better to wait for the next code.
 */

import { useEffect, useState } from "react";
import { secondsUntilNextCode, TOTP_PERIOD_SECONDS } from "@/lib/totp";
import { cn } from "@/lib/utils";

/** Seconds left at which the ring turns red ("about to change"). */
const WARNING_SECONDS = 5;

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CodeRefreshRing() {
  const [secondsLeft, setSecondsLeft] = useState(secondsUntilNextCode);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntilNextCode()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isEnding = secondsLeft <= WARNING_SECONDS;

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={`New code in ${secondsLeft} seconds`}
      className="size-6 -rotate-90"
    >
      {/* Track */}
      <circle cx="12" cy="12" r={RADIUS} fill="none" strokeWidth="2.5" className="stroke-neutral-200 dark:stroke-white/10" />
      {/* Remaining time */}
      <circle
        cx="12"
        cy="12"
        r={RADIUS}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - secondsLeft / TOTP_PERIOD_SECONDS)}
        className={cn(
          "transition-[stroke-dashoffset,stroke] duration-1000 ease-linear motion-reduce:transition-none",
          isEnding ? "stroke-red-500" : "stroke-brand-600",
        )}
      />
    </svg>
  );
}
