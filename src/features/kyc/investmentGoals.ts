/**
 * The answers offered on "Why are you investing?".
 *
 * Content lives here, separate from the screen, so options can be added,
 * reworded or reordered without touching the UI. `id` is what gets saved
 * (keep it stable); `label` is what the user sees (safe to change).
 */

export const INVESTMENT_GOALS = [
  { id: "grow-wealth", label: "Grow my wealth over time" },
  { id: "retirement", label: "Save for retirement" },
  { id: "regular-income", label: "Earn a regular income" },
  { id: "children-education", label: "Fund my children's education" },
  { id: "home-property", label: "Buy a home or property" },
  { id: "other", label: "Something else" },
] as const;

export type InvestmentGoalId = (typeof INVESTMENT_GOALS)[number]["id"];
