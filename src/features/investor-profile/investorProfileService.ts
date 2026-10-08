import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notifySessionAccount } from "@/demo/demoNotifications";
import {
  RISK_LEVELS,
  RISK_QUESTIONS,
  riskLevelForScore,
  scoreAnswers,
  type RiskAnswers,
  type RiskLevel,
} from "./riskProfileQuestions";

/**
 * Investor profile service: the single place these screens talk to the server.
 * In DEMO MODE the result is saved on the demo account (src/demo).
 */

export type SaveRiskProfileResult =
  | { ok: true; level: RiskLevel; score: number }
  | { ok: false; message: string };

/**
 * Saves the questionnaire and returns the resulting profile.
 *
 * Server requirements (for the backend):
 *   - store every answer with a timestamp (an audit trail for suitability checks)
 *   - recalculate the score ON THE SERVER; never trust the browser's result
 *   - ask the user to review their profile periodically (e.g. yearly)
 */
export async function saveRiskProfile(answers: RiskAnswers): Promise<SaveRiskProfileResult> {
  // TODO(api): POST /api/investor-profile  { answers } → { level, score }
  const isComplete = RISK_QUESTIONS.every((question) => answers[question.id] !== undefined);
  if (!isComplete) return { ok: false, message: "Please answer every question." };

  const score = scoreAnswers(answers);
  const level = riskLevelForScore(score);

  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    demo.updateSessionAccount({
      riskProfile: { level, score, answeredAt: new Date().toISOString() },
    });
    notifySessionAccount({
      kind: "investing",
      title: `Your investor profile: ${RISK_LEVELS[level].name}`,
      body: "The portfolios that suit you are marked Best match.",
      href: ROUTES.investorProfile,
    });
    return { ok: true, level, score };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Records that the start-investing journey is over: the user has reached the
 * dashboard (whether they finished it, skipped it, or left part-way). Its
 * screens then hand over to the in-app versions (config/investingFlow.ts).
 * Safe to call more than once.
 */
export async function markOnboardingFinished(): Promise<void> {
  // TODO(api): POST /api/me/onboarding-finished (stored per account, so it holds on every device)
  if (IS_DEMO_MODE) {
    demo.updateSessionAccount({ onboardingFinishedAt: new Date().toISOString() });
  }
}
