import {
  ALL_PACKAGES,
  roiRangeLabel,
  withdrawalLabel,
} from "@/features/packages/investmentPackages";
import { PACKAGE_LIMIT_SENTENCE } from "@/features/packages/packagePolicy";
import { REFERRAL_POINTS_LABEL, REFERRAL_REWARD_LABEL } from "@/features/referrals/referralService";
import { AUTO_LOCK_AFTER_MS } from "@/features/security/appLock";
import { formatCedis } from "@/lib/money";

/**
 * Help & support's frequently asked questions.
 *
 * Answers that quote figures (package amounts, returns, fees, withdrawal
 * frequency, the referral reward, the auto-lock time, the one-package rule)
 * are built from the app's own settings, so they can never disagree with the
 * rest of the app: change a package in investmentPackages.ts and its answer
 * changes too. Everything else is plain wording, kept in line with the
 * package terms (termsAndConditions.ts).
 */

/** What each answer is about (keeps the list in a sensible order; useful for grouping later). */
export type FaqCategory = "start" | "investing" | "withdrawals" | "security" | "referrals";

/** One answer: paragraphs, and lists (an array of strings) between them. */
export type Faq = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: (string | string[])[];
};

const autoLockMinutes = AUTO_LOCK_AFTER_MS / 60_000;

export const FAQS: Faq[] = [
  /* ── Getting started ─────────────────────────────────────────────── */
  {
    id: "what-is-feenicks1",
    category: "start",
    question: "What is Feenicks1?",
    answer: [
      "Feenicks1 Solutions Ltd is a Ghanaian investment company. In this app you choose an investment package, invest in cedis, and follow your portfolio, returns and withdrawals in one place.",
    ],
  },
  {
    id: "start-investing",
    category: "start",
    question: "How do I make my first investment?",
    answer: [
      "Tap Invest on Home and choose a package (your best match is marked if you've answered the investor profile). Read its terms, agree, and pay in from your Mobile Money wallet or bank account.",
      "Each package has its own minimum and maximum amount: see “Which packages can I invest in?”.",
    ],
  },
  {
    id: "investor-profile",
    category: "start",
    question: "What is the investor profile?",
    answer: [
      "A few quick questions about your goals and how comfortable you are with risk. Your answers suggest the packages that suit you best. You can see or retake it any time in Account › Investor profile.",
    ],
  },

  /* ── Investing ───────────────────────────────────────────────────── */
  {
    id: "packages",
    category: "investing",
    question: "Which packages can I invest in?",
    answer: [
      "There are four, each with its own amounts and expected return:",
      ALL_PACKAGES.map(
        (pkg) =>
          `${pkg.name} (${pkg.ticker}): ${formatCedis(pkg.minimum)} to ${formatCedis(pkg.maximum)}, ${roiRangeLabel(pkg.monthlyRoiPercent)} a month expected`,
      ),
      "Returns are expected ranges, not guaranteed.",
    ],
  },
  {
    id: "one-package",
    category: "investing",
    question: "Can I invest in more than one package?",
    answer: [
      `${PACKAGE_LIMIT_SENTENCE} You can add money to the package you're in, as long as your total stays within its maximum.`,
    ],
  },
  {
    id: "returns",
    category: "investing",
    question: "How are my returns worked out?",
    answer: [
      "Each package has an expected monthly return. Your profit for a period is the amount invested × the monthly rate × the number of months.",
      "The management fee is then taken from that profit (never from the amount you invest), and the rest is paid to you. Every return in Transactions shows its own calculation.",
    ],
  },
  {
    id: "fees",
    category: "investing",
    question: "What is the management fee?",
    answer: [
      "A percentage of the profit your investment earns:",
      ALL_PACKAGES.map((pkg) => `${pkg.name}: ${pkg.managementFeePercent}% of profit`),
      "Nothing is charged on the amount you invest, and nothing in a period with no profit.",
    ],
  },

  /* ── Withdrawals ─────────────────────────────────────────────────── */
  {
    id: "withdraw-when",
    category: "withdrawals",
    question: "When can I withdraw my profit?",
    answer: [
      "It depends on your package:",
      ALL_PACKAGES.map((pkg) => `${pkg.name}: ${withdrawalLabel(pkg.withdrawalEveryMonths).toLowerCase()}`),
    ],
  },
  {
    id: "withdraw-how-long",
    category: "withdrawals",
    question: "How long does a withdrawal take?",
    answer: [
      "Withdrawals are paid to the Mobile Money wallet or bank account registered in your name, normally within a few business days of your request.",
    ],
  },
  {
    id: "withdrawal-pending",
    category: "withdrawals",
    question: "My withdrawal says Pending. What does that mean?",
    answer: [
      "We've received your request and it's being processed. Nothing more is needed from you.",
      "Your portfolio value changes once it's completed, and it then shows as completed in Transactions.",
    ],
  },
  {
    id: "withdrawal-failed",
    category: "withdrawals",
    question: "My withdrawal failed. What now?",
    answer: [
      "No money leaves your portfolio when a withdrawal fails.",
      "Check that your Mobile Money or bank details are correct, then try again. If it fails again, send us a message and choose the transaction, so we can look into it straight away.",
    ],
  },

  /* ── Security ────────────────────────────────────────────────────── */
  {
    id: "never-share",
    category: "security",
    question: "Will Feenicks1 ever ask for my PIN or password?",
    answer: [
      "Never. Don't share your PIN, password or verification codes with anyone, even someone who says they're from Feenicks1. If someone asks, it's a scam: tell us.",
    ],
  },
  {
    id: "forgot-pin",
    category: "security",
    question: "I forgot my PIN",
    answer: [
      "On the PIN screen tap Forgot PIN, or go to Account › Reset PIN. You'll confirm it's you before choosing a new one.",
    ],
  },
  {
    id: "auto-lock",
    category: "security",
    question: "Why does the app lock itself?",
    answer: [
      `To protect your money: after ${autoLockMinutes} minutes without use it locks, and your PIN or fingerprint opens it again.`,
      "Your amounts are also hidden whenever you leave the app. Tap the eye on Home to show them.",
    ],
  },

  /* ── Referrals ───────────────────────────────────────────────────── */
  {
    id: "referrals",
    category: "referrals",
    question: "How do referral rewards work?",
    answer: [
      `Share your link or your QR code (the scan button on Home). You earn ${REFERRAL_POINTS_LABEL} (${REFERRAL_REWARD_LABEL}) for every friend who signs up with it.`,
      "Rewards show in Transactions and add to your portfolio.",
    ],
  },
];

/** The whole answer as plain text (for searching). */
export function faqText(faq: Faq): string {
  return [faq.question, ...faq.answer.flat()].join(" ");
}

/**
 * Does the answer match a search? Every word typed must appear (in any
 * order). The company's name is left out, since it's in many answers and
 * "fee" would otherwise match "Feenicks1".
 */
export function matchesSearch(faq: Faq, search: string): boolean {
  const text = faqText(faq).toLowerCase().replace(/feenicks1/g, " ");
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}
