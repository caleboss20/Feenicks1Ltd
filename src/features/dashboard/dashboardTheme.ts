/**
 * Colours of the dashboard's green top area.
 *
 * Kept in its own file (not the "use client" screen) so the server page can
 * import DASHBOARD_TOP_COLOR for its `viewport` export.
 */

/**
 * Green at the very top of the dashboard (brand-700). The page sets the
 * phone's status bar (theme-color) to it, so the status bar and the screen
 * read as one surface. Deep enough for white text (contrast ≥ 4.5:1).
 */
export const DASHBOARD_TOP_COLOR = "#0f8249";

/** Brand green (brand-600) that the top area fades through. */
const BRAND_GREEN = "#13934f";

/**
 * Background of the top area: brand green behind the greeting, balance and
 * buttons, then fading into the page background behind the banners.
 * `color-mix` with `--background` makes it fade to white in light mode and
 * to near-black in dark mode, with no separate dark version needed.
 */
export const DASHBOARD_TOP_GRADIENT = `linear-gradient(to bottom,
  ${DASHBOARD_TOP_COLOR} 0%,
  ${BRAND_GREEN} 50%,
  color-mix(in srgb, ${BRAND_GREEN} 80%, var(--background)) 66%,
  color-mix(in srgb, ${BRAND_GREEN} 35%, var(--background)) 82%,
  color-mix(in srgb, ${BRAND_GREEN} 8%, var(--background)) 93%,
  var(--background) 100%)`;

/**
 * For investors, whose dashboard shows the performance chart there instead
 * of the cards: the green carries on (solid) behind the chart's title, so it
 * can be white like the balance, then fades to the page from where the chart
 * begins, so the chart's own green wash melts into it. Used on a taller area
 * (34.5rem, vs 31rem): the solid part ends below the title's period line
 * (~82% ≈ 452px on a phone) and the fade runs behind the top of the chart.
 */
export const DASHBOARD_TOP_GRADIENT_WITH_CHART = `linear-gradient(to bottom,
  ${DASHBOARD_TOP_COLOR} 0%,
  ${BRAND_GREEN} 50%,
  ${BRAND_GREEN} 82%,
  color-mix(in srgb, ${BRAND_GREEN} 55%, var(--background)) 89%,
  color-mix(in srgb, ${BRAND_GREEN} 15%, var(--background)) 95%,
  var(--background) 100%)`;
