import { ROUTES } from "./routes";

/**
 * The investing screens (investor profile questions and result, packages,
 * package details, terms) appear in two places. They look the same but
 * navigate differently:
 *
 *   "onboarding"  once, right after registration: steps of the start-
 *                 investing journey (intro → questions → result → packages →
 *                 details → terms), each leading on to the next
 *   "app"         inside the app afterwards (dashboard, Account…): the Invest
 *                 section and Account › Investor profile, where Back always
 *                 returns inside the app, never to a sign-up screen
 *
 * Once the user has reached the dashboard, the onboarding screens send them
 * to their in-app versions instead (useLeaveFinishedOnboarding), e.g. when the
 * phone's Back button returns to one.
 */
export type InvestingFlow = "onboarding" | "app";

type FlowRoutes = {
  /** Risk profile questions. */
  profileQuestions: string;
  /** Risk profile result. */
  profileResult: string;
  /** The packages list; details at `${packages}/[id]`. */
  packages: string;
};

export const INVESTING_ROUTES: Record<InvestingFlow, FlowRoutes> = {
  onboarding: {
    profileQuestions: ROUTES.riskProfileQuestions,
    profileResult: ROUTES.riskProfileResult,
    packages: ROUTES.packages,
  },
  app: {
    profileQuestions: ROUTES.investorProfileQuestions,
    profileResult: ROUTES.investorProfile,
    packages: ROUTES.invest,
  },
};

/** A package's details page: "/invest/abc" in the app, "/packages/abc" during onboarding. */
export function packageDetailsHref(packageId: string, flow: InvestingFlow = "app"): string {
  return `${INVESTING_ROUTES[flow].packages}/${packageId}`;
}

/** A package's Terms & Conditions (the first step of investing in it). */
export function packageTermsHref(packageId: string, flow: InvestingFlow = "app"): string {
  return `${packageDetailsHref(packageId, flow)}/terms`;
}
