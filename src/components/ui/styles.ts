/**
 * Shared design tokens as class strings, so every screen uses the same
 * section headings and cards (one style, not a copy per screen).
 *
 *   SECTION_LABEL   "PROTECTIONS", "COMING UP"… above a group
 *   CARD            a bordered rounded panel (no shadows, ever)
 *   CARD_LIST       the same panel as a list with hairlines between rows
 *
 * Main buttons and text fields are 52px tall everywhere (Button size "lg",
 * TextField), matching the wallet screens.
 */
export const SECTION_LABEL = "text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400";

export const CARD = "rounded-3xl border border-neutral-200 dark:border-white/10";

export const CARD_LIST =
  "divide-y divide-neutral-100 rounded-3xl border border-neutral-200 dark:divide-white/10 dark:border-white/10";
