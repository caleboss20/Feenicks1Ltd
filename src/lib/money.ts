/**
 * Money formatting for Ghana cedis, used everywhere amounts are shown.
 *
 *   formatCedis(140)        → "GH₵ 140"
 *   formatCedis(2999.99)    → "GH₵ 2,999.99"
 *   formatCedis(100000)     → "GH₵ 100,000"
 *
 * Whole amounts drop the ".00" to stay compact (prices, limits), unless
 * `exact` is set: balances and earnings always show pennies ("GH₵ 0.00").
 */
export function formatCedis(amount: number, { exact = false }: { exact?: boolean } = {}): string {
  const isWhole = !exact && Number.isInteger(Math.round(amount * 100) / 100);
  const number = amount.toLocaleString("en-GH", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `GH₵ ${number}`;
}
