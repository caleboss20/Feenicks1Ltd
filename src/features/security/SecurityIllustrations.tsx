"use client";

/**
 * Line illustrations for the security screens, in one consistent style:
 * a phone rising out of a dotted circle, drawn in SVG (no image files), so
 * they're sharp at any size, use the brand green and follow dark mode.
 *
 *   PhoneShieldIllustration  → 2FA setup ("your phone keeps you safe")
 *   PhoneCodeIllustration    → Forgot PIN ("we'll text you a code")
 */

import { useId } from "react";

/** Shared frame: dotted circle + phone outline, cut off flat at the bottom. */
function PhoneFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  // Unique SVG ids, so two illustrations on one page never clash.
  const id = useId();
  const dotsId = `${id}-dots`;
  const cutId = `${id}-cut`;

  return (
    <svg viewBox="0 0 160 140" aria-hidden className={className}>
      <defs>
        {/* Halftone dots for the circle. */}
        <pattern id={dotsId} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" className="fill-neutral-300 dark:fill-white/20" />
        </pattern>
        {/* Everything is cut off flat at the bottom, so the phone "rises" out of the circle. */}
        <clipPath id={cutId}>
          <rect width="160" height="128" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${cutId})`}>
        <circle cx="80" cy="70" r="64" fill={`url(#${dotsId})`} />
        <circle cx="80" cy="70" r="64" strokeWidth="1" className="fill-none stroke-neutral-200 dark:stroke-white/10" />

        {/* Phone body + speaker slot. */}
        <rect x="47" y="20" width="66" height="124" rx="11" strokeWidth="2.5" className="fill-background stroke-neutral-800 dark:stroke-neutral-200" />
        <rect x="71" y="27" width="18" height="3.5" rx="1.75" className="fill-neutral-800 dark:fill-neutral-200" />

        {children}
      </g>

      {/* Flat base line where the phone is cut off. */}
      <line x1="38" y1="128" x2="122" y2="128" strokeWidth="2.5" strokeLinecap="round" className="stroke-neutral-800 dark:stroke-neutral-200" />
    </svg>
  );
}

/** A card with a green shield on the phone's screen. */
export function PhoneShieldIllustration({ className }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <rect x="55" y="54" width="50" height="38" rx="6" strokeWidth="2" className="fill-brand-50 stroke-neutral-800 dark:fill-brand-500/10 dark:stroke-neutral-200" />
      <path d="M80 60.5 71.5 63.7v6.4c0 5.3 3.6 9.7 8.5 11.3 4.9-1.6 8.5-6 8.5-11.3v-6.4Z" className="fill-brand-600" />
      <path d="m76.3 70.6 2.6 2.6 4.9-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </PhoneFrame>
  );
}

/** A text-message bubble with a code on the phone's screen, plus a lock badge. */
export function PhoneCodeIllustration({ className }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      {/* Message bubble with a tail. */}
      <path
        d="M58 50h44a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H70l-7 6v-6h-5a5 5 0 0 1-5-5V55a5 5 0 0 1 5-5Z"
        strokeWidth="2"
        strokeLinejoin="round"
        className="fill-brand-50 stroke-neutral-800 dark:fill-brand-500/10 dark:stroke-neutral-200"
      />
      {/* Six code digits as dots, in two groups of three. */}
      {[64, 71, 78, 86, 93, 100].map((x) => (
        <circle key={x} cx={x - 2} cy="66" r="2.6" className="fill-brand-600" />
      ))}

      {/* Small green lock badge at the bottom of the screen. */}
      <circle cx="80" cy="104" r="10" className="fill-brand-600" />
      <rect x="75.5" y="102" width="9" height="7" rx="1.5" fill="white" />
      <path d="M77.3 102v-2.2a2.7 2.7 0 0 1 5.4 0v2.2" fill="none" stroke="white" strokeWidth="1.6" />
    </PhoneFrame>
  );
}
