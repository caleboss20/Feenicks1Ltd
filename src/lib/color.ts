/**
 * Small colour helpers (HSL ↔ hex, contrast), for the dashboard colour
 * picker: any hue from the wheel is turned into shades that still carry
 * white text.
 */

/** HSL (hue 0–360, saturation and lightness 0–100) to "#rrggbb". */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** "#rrggbb" to HSL (hue 0–360, saturation and lightness 0–100). */
export function hexToHsl(hex: string): { hue: number; saturation: number; lightness: number } {
  const value = parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { hue: 0, saturation: 0, lightness: lightness * 100 };
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    max === r ? ((g - b) / delta + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / delta + 2) * 60 : ((r - g) / delta + 4) * 60;
  return { hue, saturation: saturation * 100, lightness: lightness * 100 };
}

/** WCAG relative luminance of "#rrggbb". */
function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear((value >> 16) & 255) + 0.7152 * linear((value >> 8) & 255) + 0.0722 * linear(value & 255);
}

/** Contrast ratio of white text on "#rrggbb" (1–21). */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/**
 * The lightest HSL lightness (%) at which a hue still carries white text at
 * `minContrast` (4.5:1 by default: WCAG AA for normal text). Yellows and
 * greens are naturally bright, so they come out deeper than blues.
 */
export function lightestForWhiteText(hue: number, saturation: number, minContrast = 4.5): number {
  let low = 0;
  let high = 100;
  for (let step = 0; step < 20; step++) {
    const middle = (low + high) / 2;
    if (contrastWithWhite(hslToHex(hue, saturation, middle)) >= minContrast) low = middle;
    else high = middle;
  }
  return low;
}
