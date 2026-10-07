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
      "Tap Invest on Home and choose a package (your best match is marked if you've answered the investor profile). Read its terms, agree, and pay in from your Mobile Money (MoMo) wallet or bank account.",
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
      `${PACKAGE_LIMIT_SENTENCE} You can add money to the package you're in as often as you like: each payment just needs to be within the package's minimum and maximum.`,
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
      ALL_PACKAGES.map((pkg) => `${pkg.name}: ${withdrawalLabel(pkg).toLowerCase()}`),
    ],
  },
  {
    id: "withdraw-how-long",
    category: "withdrawals",
    question: "How long does a withdrawal take?",
    answer: [
      "Withdrawals are paid to the Mobile Money (MoMo) wallet or bank account registered in your name, normally within a few business days of your request.",
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
      "Check that your Mobile Money (MoMo) or bank details are correct, then try again. If it fails again, send us a message and choose the transaction, so we can look into it straight away.",
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

/* ── Search: forgiving, so typos on a phone still find the answer ─────── */

/** The lowercase words of a text: "Feenicks1's fee: 4%" → feenicks1, s, fee, 4. */
export function wordsOf(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** How many letters must be added, removed or changed to turn `a` into `b` (Levenshtein). */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

/**
 * How well a typed word matches a word in the text:
 *   3  the same word                         "fee" → fee
 *   2  the start of it (still typing)        "fee" → fees, feenicks1
 *   1  a typo: one letter off (two in long   "feeen" → feenicks1 (start)
 *      words), whole or while still typing   "feeenicks1" → feenicks1
 *   0  no match
 * Words under 4 letters must match exactly or by their start: one letter off
 * a short word would match far too much.
 */
export function wordMatch(typed: string, word: string): number {
  if (word === typed) return 3;
  if (word.startsWith(typed)) return 2;
  if (typed.length < 4) return 0;
  const allowed = typed.length >= 8 ? 2 : 1;
  // Compare with the whole word, and with its start at about the typed length.
  const lengths = [word.length, typed.length - 1, typed.length, typed.length + 1];
  return lengths.some((length) => length <= word.length && editDistance(typed, word.slice(0, length)) <= allowed)
    ? 1
    : 0;
}

/**
 * How well an answer matches a search; 0 = leave it out. Every typed word must
 * match somewhere; matches in the question count double, so the most relevant
 * answers come first ("fee" lists the fee answers before "What is Feenicks1?").
 */
export function searchScore(faq: Faq, search: string): number {
  const typed = wordsOf(search);
  if (typed.length === 0) return 0;
  const questionWords = wordsOf(faq.question);
  const answerWords = wordsOf(faq.answer.flat().join(" "));
  let total = 0;
  for (const word of typed) {
    const best = Math.max(
      ...questionWords.map((candidate) => wordMatch(word, candidate) * 2),
      ...answerWords.map((candidate) => wordMatch(word, candidate)),
    );
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/** The answers for a search, best first (all of them, in order, when there's no search). */
export function searchFaqs(search: string): Faq[] {
  if (wordsOf(search).length === 0) return FAQS;
  return FAQS.map((faq) => ({ faq, score: searchScore(faq, search) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score) // stable: ties keep the list's order
    .map((result) => result.faq);
}
