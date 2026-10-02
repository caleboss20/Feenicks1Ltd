/**
 * Page colour of the Account and Edit profile screens, for the phone's
 * status bar (theme-color) to match: light grey (`bg-neutral-100`) in light
 * mode, the dark background (`--background` in .dark) in dark mode.
 *
 * Kept in its own file (not the "use client" screens) so the server pages
 * can use it in their `viewport` export.
 */
export const ACCOUNT_PAGE_COLORS = { light: "#f5f5f5", dark: "#0a0a0a" } as const;
