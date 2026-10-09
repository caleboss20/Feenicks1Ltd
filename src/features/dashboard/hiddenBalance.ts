/**
 * How the dashboard shows the balance while amounts are hidden (the eye),
 * chosen on Account › Hidden balance. Saved on this device with the theme.
 *
 *   dots       GH₵ ••••••      (the default)
 *   asterisks  GH₵ ******
 *   dashes     GH₵ ––––––
 *   word       GH₵ Hidden
 *   blur       GH₵ [the real figure, blurred beyond reading]
 */

export type HiddenBalanceStyle = "dots" | "asterisks" | "dashes" | "word" | "blur";

export const DEFAULT_HIDDEN_BALANCE_STYLE: HiddenBalanceStyle = "dots";

export const HIDDEN_BALANCE_STYLES: {
  id: HiddenBalanceStyle;
  name: string;
  /** What replaces the balance; null = the figure is blurred instead. */
  mask: string | null;
  /** What replaces small figures (e.g. Profit earned). */
  shortMask: string | null;
}[] = [
  { id: "dots", name: "Dots", mask: "••••••", shortMask: "••••" },
  { id: "asterisks", name: "Asterisks", mask: "******", shortMask: "****" },
  { id: "dashes", name: "Dashes", mask: "––––––", shortMask: "––––" },
  { id: "word", name: "The word “Hidden”", mask: "Hidden", shortMask: "Hidden" },
  { id: "blur", name: "Blur", mask: null, shortMask: null },
];

/** The mask for a style, or null for blur; `short` for small figures. */
export function hiddenMask(style: HiddenBalanceStyle, short = false): string | null {
  const item = HIDDEN_BALANCE_STYLES.find((option) => option.id === style) ?? HIDDEN_BALANCE_STYLES[0];
  return short ? item.shortMask : item.mask;
}
