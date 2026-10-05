/**
 * Mobile Money in Ghana: which network a number is on, and how to write it.
 *
 * The network comes from the number's prefix. A best guess: numbers can be
 * moved between networks (number portability), so the payment step should
 * let people pick the network themselves. TODO(invest): network choice and
 * saved wallets, with the payment step.
 */

export type MomoNetwork = "mtn" | "telecel" | "at";

export const MOMO_NETWORKS: Record<MomoNetwork, { name: string; short: string; className: string }> = {
  // Brand-neutral marks (a coloured circle with initials), not the networks' logos.
  mtn: { name: "MTN MoMo", short: "MTN", className: "bg-yellow-400 text-neutral-900" },
  telecel: { name: "Telecel Cash", short: "T", className: "bg-red-600 text-white" },
  at: { name: "AT Money", short: "AT", className: "bg-blue-600 text-white" },
};

/** Prefixes (after the leading 0) for each network. */
const PREFIXES: Record<MomoNetwork, string[]> = {
  mtn: ["24", "25", "53", "54", "55", "59"],
  telecel: ["20", "50"],
  at: ["26", "27", "56", "57"],
};

/** The network for a Ghana number given as 9 digits (no +233 or 0), e.g. "241234567" → "mtn". */
export function networkForNumber(localDigits: string | null | undefined): MomoNetwork | null {
  if (!localDigits || !/^\d{9}$/.test(localDigits)) return null;
  const prefix = localDigits.slice(0, 2);
  return (Object.keys(PREFIXES) as MomoNetwork[]).find((network) => PREFIXES[network].includes(prefix)) ?? null;
}

/** "241234567" → "024 123 4567", as people write their MoMo number. */
export function formatLocalNumber(localDigits: string): string {
  return `0${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5)}`;
}
