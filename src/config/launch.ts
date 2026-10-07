/**
 * PUBLIC LAUNCH SWITCH: is this the real, public Feenicks1, or a test version?
 *
 * OFF (now): a test version. Investor features (onboarding, dashboard,
 * payments, withdrawals) must not be offered to the public until Feenicks1
 * is licensed by SEC Ghana (Core Business & Product Architecture v1.1, §21;
 * SEC Directive Dir/001/06/2026). So while it's off:
 *   - search engines are told not to list any page (root layout `robots`,
 *     robots.txt without a sitemap, an empty sitemap)
 * No "test version" label on screens (by request): the screens look as at launch.
 *
 * ON: only at launch (the brief's "Gate E": licence on file, approved by the
 * owner and compliance). Set on the hosting provider:
 *      NEXT_PUBLIC_PUBLIC_LAUNCH=true
 * Separate from demo mode (config/demoMode.ts), which is about the pretend
 * backend, not about who may see the site.
 */
export const IS_PUBLIC_LAUNCH = process.env.NEXT_PUBLIC_PUBLIC_LAUNCH === "true";
