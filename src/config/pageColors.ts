/**
 * Colours of the light-grey screens (Account, Edit profile, Transactions),
 * for the phone's status bar (theme-color) to match the page: light grey
 * (`bg-neutral-100`) in light mode, the dark background (`--background` in
 * .dark) in dark mode. Used by the pages' `viewport` export (light) and
 * `useStatusBarColor` (both).
 */
export const GREY_PAGE_COLORS = { light: "#f5f5f5", dark: "#0a0a0a" } as const;
