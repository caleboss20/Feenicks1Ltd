import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import type { InvestmentGoalId } from "./investmentGoals";

/**
 * KYC service: the single place the identity-verification screens talk to
 * the server. Screens never `fetch` directly.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds.
 */

export type KycResult = { ok: true } | { ok: false; message: string };

const SOMETHING_WENT_WRONG: KycResult = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

/** Saves the user's investment goals (used to recommend suitable plans). */
export async function saveInvestmentGoals(goals: InvestmentGoalId[]): Promise<KycResult> {
  // TODO(api): PUT /api/kyc/investment-goals  { goals }
  void goals;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}
