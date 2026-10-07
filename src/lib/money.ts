/**
 * Money formatting for Ghana cedis, used everywhere amounts are shown.
 *
 *   formatCedis(140)        → "GH₵ 140"
 *   formatCedis(4999.99)    → "GH₵ 4,999.99"
 *   formatCedis(100000)     → "GH₵ 100,000"
 *
 * Whole amounts drop the ".00" to stay compact (prices, limits), unless
 * `exact` is set: balances and earnings always show pennies ("GH₵ 0.00").
 */

/** The cedi symbol shown before amounts. */
export const CEDI_SYMBOL = "GH₵";

type FormatOptions = { exact?: boolean };

/**
 * The number alone, without the symbol, for screens that style the symbol
 * separately (e.g. the dashboard balance):
 *
 *   formatCedisNumber(1250.5, { exact: true })   → "1,250.50"
 */
export function formatCedisNumber(amount: number, { exact = false }: FormatOptions = {}): string {
  const isWhole = !exact && Number.isInteger(Math.round(amount * 100) / 100);
  return amount.toLocaleString("en-GH", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatCedis(amount: number, options: FormatOptions = {}): string {
  return `${CEDI_SYMBOL} ${formatCedisNumber(amount, options)}`;
}
