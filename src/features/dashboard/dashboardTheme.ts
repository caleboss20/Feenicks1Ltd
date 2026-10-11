/**
 * Colours of the dashboard's top area (behind the greeting, balance and
 * buttons), which the user can choose on Account › Dashboard colour.
 *
 * Kept in its own file (not the "use client" screen) so the server page can
 * import DASHBOARD_TOP_COLOR for its `viewport` export.
 *
 * Every colour has two shades:
 *   - top:  the deepest, at the very top. It is also the phone's status bar
 *           (theme-color), so the status bar and the screen read as one surface.
 *   - main: the colour behind the balance, a richer neighbour of `top` (a
 *           slight shift in depth or hue, e.g. navy → blue), so the gradient
 *           has depth rather than being one flat colour.
 * Both carry WHITE text (the greeting, the balance, the chart's title) at a
 * contrast of about 4.5:1 or more. That's why "yellow" is a deep gold:
 * bright yellow can't hold white text.
 *
 * Besides the presets, any colour can be picked on a colour wheel (hue +
 * brightness): customColor() turns it into the two shades, deepening it just
 * enough to keep white text readable.
 */

import { hexToHsl, hslToHex, lightestForWhiteText } from "@/lib/color";

export type DashboardColorId =
  | "green"
  | "emerald"
  | "teal"
  | "ocean"
  | "blue"
  | "navy"
  | "indigo"
  | "violet"
  | "purple"
  | "pink"
  | "red"
  | "wine"
  | "orange"
  | "gold"
  | "cocoa"
  | "graphite"
  | "black";

/** A colour ready to use: a preset, or "custom" (picked on the colour wheel). */
export type DashboardColor = { id: DashboardColorId | "custom"; name: string; top: string; main: string };

/**
 * A colour picked on the wheel: its hue (0–360), saturation (0–100) and
 * brightness (0–100: 0 the deepest, 100 the lightest that still carries
 * white text). Turned into shades by customColor().
 */
export type CustomColor = { hue: number; saturation: number; brightness: number };

/** The ready-made choices, in the order shown on the picker (greens, blues, purples, reds, warm, neutrals). */
export const DASHBOARD_COLORS: (DashboardColor & { id: DashboardColorId })[] = [
  // Forest green (CEO, October 2026): the default, as on the splash. The id stays
  // "green" so everyone who kept the default gets the new colour.
  { id: "green", name: "Forest", top: "#0a2e22", main: "#0e3b2c" },
  { id: "emerald", name: "Emerald", top: "#064e3b", main: "#047857" },
  { id: "teal", name: "Teal", top: "#134e4a", main: "#0f766e" },
  { id: "ocean", name: "Ocean", top: "#164e63", main: "#0e7490" },
  { id: "blue", name: "Blue", top: "#1e3a8a", main: "#1d4ed8" },
  { id: "navy", name: "Navy", top: "#0f172a", main: "#1e3a8a" },
  { id: "indigo", name: "Indigo", top: "#312e81", main: "#4338ca" },
  { id: "violet", name: "Violet", top: "#4c1d95", main: "#6d28d9" },
  { id: "purple", name: "Purple", top: "#581c87", main: "#9333ea" },
  { id: "pink", name: "Pink", top: "#831843", main: "#db2777" },
  { id: "red", name: "Red", top: "#7f1d1d", main: "#dc2626" },
  { id: "wine", name: "Wine", top: "#4c0519", main: "#9f1239" },
  { id: "orange", name: "Orange", top: "#7c2d12", main: "#c2410c" },
  { id: "gold", name: "Gold", top: "#713f12", main: "#a16207" },
  { id: "cocoa", name: "Cocoa", top: "#451a03", main: "#92400e" },
  { id: "graphite", name: "Graphite", top: "#0f172a", main: "#334155" },
  { id: "black", name: "Black", top: "#000000", main: "#171717" },
];

export const DEFAULT_DASHBOARD_COLOR: DashboardColorId = "green";

/** The colour for an id; the default (green) for anything unknown (e.g. a colour since removed). */
export function dashboardColor(id: string | null | undefined): DashboardColor {
  return (
    DASHBOARD_COLORS.find((color) => color.id === id) ??
    DASHBOARD_COLORS.find((color) => color.id === DEFAULT_DASHBOARD_COLOR)!
  );
}

/** Default top colour, for the dashboard page's `viewport` (the chosen one is applied in the browser). */
export const DASHBOARD_TOP_COLOR = dashboardColor(DEFAULT_DASHBOARD_COLOR).top;

/* ── Custom colours (the colour wheel) ───────────────────────────────── */

/** Saturation for colours picked on the wheel: vivid, not neon. */
export const WHEEL_SATURATION = 72;

/** The deepest main shade the brightness slider goes to (HSL lightness, %). */
const DEEPEST_LIGHTNESS = 14;

/**
 * Shades for a wheel colour. `main` runs from the deepest (brightness 0) to
 * the lightest that still carries white text at 4.5:1 (brightness 100), so
 * whatever is picked, the balance stays readable; `top` is a little deeper,
 * as with the presets.
 */
export function customColor({ hue, saturation, brightness }: CustomColor): DashboardColor {
  const lightest = lightestForWhiteText(hue, saturation);
  const lightness = DEEPEST_LIGHTNESS + (lightest - DEEPEST_LIGHTNESS) * (brightness / 100);
  return {
    id: "custom",
    name: "Custom",
    main: hslToHex(hue, saturation, lightness),
    top: hslToHex(hue, Math.min(saturation + 6, 100), Math.max(lightness - 8, 6)),
  };
}

/** Where a colour sits on the wheel and the brightness slider (so the controls start from it). */
export function asCustomColor(color: DashboardColor): CustomColor {
  const { hue, saturation, lightness } = hexToHsl(color.main);
  const lightest = lightestForWhiteText(hue, saturation);
  const brightness = ((lightness - DEEPEST_LIGHTNESS) / (lightest - DEEPEST_LIGHTNESS)) * 100;
  return { hue: Math.round(hue), saturation: Math.round(saturation), brightness: Math.round(Math.min(Math.max(brightness, 0), 100)) };
}

/** The colour in use: the custom one if they picked one on the wheel, otherwise the preset. */
export function chosenDashboardColor(presetId: string, custom: CustomColor | null): DashboardColor {
  return custom ? customColor(custom) : dashboardColor(presetId);
}

/** `color` mixed with the page background: fades to white in light mode, near-black in dark. */
const towardsPage = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, var(--background))`;

/**
 * Background of the top area, in the chosen colour: `top` at the very top,
 * `main` behind the balance, then fading into the page (white in light mode,
 * near-black in dark mode, with no separate dark version needed).
 *
 *   - With the cards (not invested yet): fades gently behind the cards.
 *   - With the performance chart (investors): stays solid behind the chart's
 *     white title, then fades quickly, from just below the title's period
 *     line (~86% of the 31rem area ≈ 427px on a phone) to the page by the top
 *     of the chart, so the chart's own wash melts into it. (A taller solid
 *     area was tried: too much colour.)
 */
export function dashboardGradient(color: DashboardColor, { withChart }: { withChart: boolean }): string {
  const fade = withChart
    ? `${color.main} 86%, ${towardsPage(color.main, 55)} 90%, ${towardsPage(color.main, 15)} 95%`
    : `${towardsPage(color.main, 80)} 66%, ${towardsPage(color.main, 35)} 82%, ${towardsPage(color.main, 8)} 93%`;
  return `linear-gradient(to bottom, ${color.top} 0%, ${color.main} 50%, ${fade}, var(--background) 100%)`;
}

/** The colour as a small swatch or preview: top to main, on a diagonal. */
export function swatchGradient(color: DashboardColor): string {
  return `linear-gradient(145deg, ${color.top} 0%, ${color.main} 100%)`;
}
