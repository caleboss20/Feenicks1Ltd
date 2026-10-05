/**
 * Mobile Money in Ghana: which network a number is on, and how to write it.
 *
 * The network comes from the number's prefix. A best guess: numbers can be
 * moved between networks (number portability), so the payment step should
 * let people pick the network themselves. TODO(invest): network choice and
 * saved wallets, with the payment step.
 */

export type MomoNetwork = "mtn" | "telecel" | "at";

/**
 * `logo`: the network's own logo, as a small square icon in `public/images/momo/`
 * (shown round by MomoNetworkLogo). The logos belong to MTN, Telecel and AT;
 * they're shown only to say which network a payment goes through.
 * TODO(launch): swap in the official assets from the payment provider or the
 * networks, following their brand guidelines.
 */
export const MOMO_NETWORKS: Record<MomoNetwork, { name: string; logo: string }> = {
  mtn: { name: "MTN MoMo", logo: "/images/momo/mtn.webp" },
  telecel: { name: "Telecel Cash", logo: "/images/momo/telecel.webp" },
  at: { name: "AT Money", logo: "/images/momo/at.webp" },
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
