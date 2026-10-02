/**
 * Investor risk profile: the questions, how answers are scored, and the
 * three resulting profiles. Everything the business may want to tune lives
 * here (wording, points, thresholds), not in the screens.
 *
 * Scoring: every answer is worth 1 (cautious), 2 (balanced) or 3 (bold).
 * Six questions → a total between 6 and 18, mapped to the four levels of
 * Feenicks1's "Investor Risk Tolerance & Portfolio Match" document:
 *     6–10  Conservative  (low risk)
 *    11–14  Moderate      (balanced risk)
 *    15–18  Aggressive    (high risk)
 * (The document's 4th level, "Speculative", is left out: its products,
 * crypto/DeFi and forex trading, aren't offered in the app.)
 * Which packages suit each level: features/packages/investmentPackages.ts.
 *
 * ⚠️ Have compliance review the questions and thresholds before launch.
 * Investment firms are expected to check that products suit each client
 * (suitability / "know your client"); this questionnaire is that check.
 */

export type RiskLevel = "conservative" | "moderate" | "aggressive";

export type QuestionId =
  | "horizon"
  | "income"
  | "priority"
  | "share-of-savings"
  | "market-drop"
  | "experience";

export type RiskQuestion = {
  id: QuestionId;
  text: string;
  options: { label: string; points: 1 | 2 | 3 }[];
};

/** Six questions in three short steps of two, so each step fits one phone screen. */
export const RISK_PROFILE_STEPS: { title: string; questions: RiskQuestion[] }[] = [
  {
    title: "About you",
    questions: [
      {
        id: "horizon",
        text: "How long do you plan to keep your money invested?",
        options: [
          { label: "Less than 1 year", points: 1 },
          { label: "1 to 3 years", points: 2 },
          { label: "More than 3 years", points: 3 },
        ],
      },
      {
        id: "income",
        text: "How steady is your income?",
        options: [
          { label: "It changes a lot", points: 1 },
          { label: "Fairly steady", points: 2 },
          { label: "Very steady", points: 3 },
        ],
      },
    ],
  },
  {
    title: "Your goals",
    questions: [
      {
        id: "priority",
        text: "What matters most to you?",
        options: [
          { label: "Protecting the money I have", points: 1 },
          { label: "A balance of safety and growth", points: 2 },
          { label: "Growing my money as much as possible", points: 3 },
        ],
      },
      {
        id: "share-of-savings",
        // A bigger share of savings at stake = less room for losses.
        text: "How much of your savings do you plan to invest?",
        options: [
          { label: "More than 30%", points: 1 },
          { label: "10% to 30%", points: 2 },
          { label: "Less than 10%", points: 3 },
        ],
      },
    ],
  },
  {
    title: "Risk comfort",
    questions: [
      {
        id: "market-drop",
        text: "If your investment fell by 10% in a month, what would you do?",
        options: [
          { label: "Move it to something safer", points: 1 },
          { label: "Wait for it to recover", points: 2 },
          { label: "Invest more while prices are low", points: 3 },
        ],
      },
      {
        id: "experience",
        text: "How much investing experience do you have?",
        options: [
          { label: "None, this is my first time", points: 1 },
          { label: "Some (savings, T-bills, mutual funds)", points: 2 },
          { label: "A lot (stocks, bonds, other platforms)", points: 3 },
        ],
      },
    ],
  },
];

/** Every question, in order. */
export const RISK_QUESTIONS = RISK_PROFILE_STEPS.flatMap((step) => step.questions);

/** The answer chosen for each question: the index of the option. */
export type RiskAnswers = Partial<Record<QuestionId, number>>;

/** Total score (6–18) for a complete set of answers. */
export function scoreAnswers(answers: RiskAnswers): number {
  return RISK_QUESTIONS.reduce((total, question) => {
    const chosen = answers[question.id];
    return total + (chosen === undefined ? 0 : question.options[chosen].points);
  }, 0);
}

/** Score → profile (see the thresholds at the top of this file). */
export function riskLevelForScore(score: number): RiskLevel {
  if (score <= 10) return "conservative";
  if (score <= 14) return "moderate";
  return "aggressive";
}

/**
 * How each level is described on the result screen. Wording follows the
 * company's "Investor Risk Tolerance & Portfolio Match" document.
 */
export const RISK_LEVELS: Record<
  RiskLevel,
  {
    name: string;
    /** Short label under the risk meter. */
    meterLabel: string;
    summary: string;
    /** Short facts shown as a list: label → value. */
    facts: { label: string; value: string }[];
  }
> = {
  conservative: {
    name: "Conservative",
    meterLabel: "Low",
    summary:
      "You value protecting your money and predictable outcomes. Low-risk packages with steady returns suit you best.",
    facts: [
      { label: "Volatility", value: "Low" },
      { label: "Returns", value: "Lower, steadier" },
      { label: "Safety of your capital", value: "High" },
    ],
  },
  moderate: {
    name: "Moderate",
    meterLabel: "Balanced",
    summary:
      "You want a balance of stability and growth, and accept some ups and downs. Packages backed by real, tangible assets suit you best.",
    facts: [
      { label: "Volatility", value: "Moderate" },
      { label: "Returns", value: "Medium to high" },
      { label: "Growth from", value: "Tangible assets" },
    ],
  },
  aggressive: {
    name: "Aggressive",
    meterLabel: "High",
    summary:
      "You're comfortable with market ups and downs and focus on building long-term wealth. Higher-return packages suit you best.",
    facts: [
      { label: "Volatility", value: "High" },
      { label: "Returns", value: "Higher" },
      { label: "Focus", value: "Long-term wealth" },
    ],
  },
};

/** Order of the levels on the risk meter (left → right). */
export const RISK_LEVEL_ORDER: RiskLevel[] = ["conservative", "moderate", "aggressive"];
