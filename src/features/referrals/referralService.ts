import { siteConfig } from "@/config/site";
import { formatCedis } from "@/lib/money";

/**
 * Referrals: "Invite a friend, earn GH₵ 20 for every friend who signs up".
 *
 * TODO(api): the server creates each user's referral code, tracks sign-ups
 * made with it and pays the reward (rules to confirm with the business:
 * when it's paid, any limits, anti-fraud checks such as one reward per
 * verified person).
 */

/** Reward per friend who signs up with the user's link, in GH₵. */
export const REFERRAL_REWARD = 20;
export const REFERRAL_REWARD_LABEL = formatCedis(REFERRAL_REWARD);

/**
 * A short, stable code for a user (demo: derived from the email). In
 * production the server issues it; it must not reveal the email.
 */
function referralCodeFor(email: string): string {
  let hash = 0;
  for (const char of email.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `F1${hash.toString(36).toUpperCase().slice(0, 6)}`;
}

export function referralLinkFor(email: string): string {
  // TODO(api): use the code issued by the server.
  return `${siteConfig.url}/sign-up?ref=${referralCodeFor(email)}`;
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
