import { ROUTES } from "@/config/routes";

/**
 * How far a user has got through registration, in order. The server
 * stores this for each account and returns it on log-in, so the user
 * carries on exactly where they left off (on any device).
 *
 *   verify-email          signed up, email not verified yet
 *   kyc-investment-goals  email verified → "Why are you investing?"
 *   kyc-verify-identity   goals done → ID document + selfie
 *   kyc-profile           ID and selfie accepted → "Fill Your Profile"
 *   create-pin            profile saved → create the security PIN
 *   two-factor            PIN set → choose 2FA (or skip)
 *   complete              all done → enter PIN on each log-in, then the dashboard
 *
 * Steps only move forward. Going back to an earlier screen never moves
 * the account backwards.
 */
export const ACCOUNT_STEPS = [
  "verify-email",
  "kyc-investment-goals",
  "kyc-verify-identity",
  "kyc-profile",
  "create-pin",
  "two-factor",
  "complete",
] as const;

export type AccountStep = (typeof ACCOUNT_STEPS)[number];

/** True if `step` comes after `than` in the registration order. */
export function isStepAfter(step: AccountStep, than: AccountStep): boolean {
  return ACCOUNT_STEPS.indexOf(step) > ACCOUNT_STEPS.indexOf(than);
}

/**
 * The screen where each step resumes.
 * Note: the ID-document part resumes at its intro ("Let's Verify Your
 * Identity"), because photos taken before leaving are not kept.
 */
const STEP_ROUTES: Record<AccountStep, string> = {
  "verify-email": ROUTES.verifyEmail,
  "kyc-investment-goals": ROUTES.kycInvestmentGoals,
  "kyc-verify-identity": ROUTES.kycVerifyIdentity,
  "kyc-profile": ROUTES.kycProfile,
  "create-pin": ROUTES.createPin,
  "two-factor": ROUTES.twoFactor,
  // Fully registered: confirm it's them with the PIN, then the dashboard.
  complete: ROUTES.enterPin,
};

/** Where to send a user right after logging in. */
export function getRouteForStep(step: AccountStep): string {
  return STEP_ROUTES[step];
}
