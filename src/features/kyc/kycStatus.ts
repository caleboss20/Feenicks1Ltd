import { ROUTES } from "@/config/routes";

/**
 * Where a user is in identity verification (KYC).
 * The server sends this back when the user logs in.
 *
 *   not_started     signed up, hasn't begun KYC
 *   in_progress     started KYC but didn't finish
 *   pending_review  submitted; our team / the provider is checking it
 *   approved        verified, full access to the app
 *   rejected        needs to redo part of KYC
 */
export type KycStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";

/**
 * Decides which screen a user sees right after logging in.
 * KYC comes before the dashboard: nobody reaches the app until verified.
 */
export function getRouteAfterLogin(kycStatus: KycStatus): string {
  switch (kycStatus) {
    case "approved":
      // TODO(dashboard): ROUTES.dashboard once it's built.
      return ROUTES.kycInvestmentGoals;
    case "pending_review":
      // TODO(kyc): a "We're reviewing your documents" screen once it's built.
      return ROUTES.kycInvestmentGoals;
    case "not_started":
    case "in_progress":
    case "rejected":
    default:
      // TODO(kyc): resume at the exact step they reached, once all steps exist.
      return ROUTES.kycInvestmentGoals;
  }
}
