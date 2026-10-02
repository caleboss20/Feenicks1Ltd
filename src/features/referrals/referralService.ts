import { siteConfig } from "@/config/site";
import { formatCedis } from "@/lib/money";

/**
 * Referrals: "Invite a friend, earn GH₵ 20 for every friend who signs up".
 *
 * The friend opens the user's link (shared, or scanned from the QR code on
 * the Invite screen): /sign-up?ref=F1ABC123. The sign-up screen reads the
 * code (parseReferralCode) and sends it with the new account.
 *
 * TODO(api): the server creates each user's referral code, tracks sign-ups
 * made with it and pays the reward (rules to confirm with the business:
 * when it's paid, any limits, anti-fraud checks such as one reward per
 * verified person).
 */

/** Reward per friend who signs up with the user's link, in GH₵. */
export const REFERRAL_REWARD = 20;
export const REFERRAL_REWARD_LABEL = formatCedis(REFERRAL_REWARD);

/** "F1" followed by up to 6 letters or digits (see referralCodeFor). */
const REFERRAL_CODE_PATTERN = /^F1[A-Z0-9]{1,6}$/;

/**
 * A short, stable code for a user (demo: derived from the email). In
 * production the server issues it; it must not reveal the email.
 */
export function referralCodeFor(email: string): string {
  let hash = 0;
  for (const char of email.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `F1${hash.toString(36).toUpperCase().slice(0, 6)}`;
}

/**
 * The app's public address for links people open on another phone.
 * NEXT_PUBLIC_SITE_URL when set; otherwise the address this page was loaded
 * from, so a link or QR code never points at "localhost" in production.
 */
function publicOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return siteConfig.url;
}

export function referralLinkFor(email: string): string {
  // TODO(api): use the code issued by the server.
  return `${publicOrigin()}/sign-up?ref=${referralCodeFor(email)}`;
}

/**
 * The referral code from a sign-up link's `?ref=`, or null if there's none
 * or it doesn't look like one (never trust what's in a URL).
 */
export function parseReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}

/**
 * Opens the phone's share sheet (WhatsApp, SMS…) with the invite, or copies
 * the link where sharing isn't supported (most desktops).
 * Returns what happened, so the screen can say "Link copied".
 */
export async function shareReferralLink(email: string): Promise<"shared" | "copied" | "failed"> {
  const url = referralLinkFor(email);
  const text = `Join me on Feenicks1 and start investing. Sign up with my link:`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Feenicks1", text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch (error) {
    // Closing the share sheet isn't a failure.
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
    return "failed";
  }
}
