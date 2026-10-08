import { formatCedis } from "@/lib/money";
import { roiRangeLabel, withdrawalLabel, type InvestmentPackage } from "./investmentPackages";

/**
 * Investment Terms & Conditions shown before a user invests in a package.
 *
 * ⚠️ PLACEHOLDER TEXT. Written to reflect what investment platforms
 * typically include, filled in with each package's real figures. It must be
 * replaced (or approved) by Feenicks1's legal / compliance team before launch.
 * When the wording changes, bump TERMS_VERSION: acceptances are saved with
 * the version the user agreed to.
 */

export const TERMS_VERSION = "2026-10-01";

/** Shown under the title: when these terms took effect. */
export const TERMS_EFFECTIVE_DATE = "1 October 2026";

export type TermsSection = { title: string; paragraphs: string[] };

/** The few points every investor must see, in plain words, before the full text. */
export function keyPointsFor(pkg: InvestmentPackage): string[] {
  return [
    `You can invest between ${formatCedis(pkg.minimum)} and ${formatCedis(pkg.maximum)}.`,
    `Expected return: ${roiRangeLabel(pkg.monthlyRoiPercent)} a month. This is not guaranteed.`,
    `A ${pkg.managementFeePercent}% management fee comes off the monthly return (e.g. 7% − ${pkg.managementFeePercent}% = ${7 - pkg.managementFeePercent}%). It is never more than that month's profit.`,
    `Profit can be withdrawn ${withdrawalLabel(pkg).toLowerCase()}.`,
    "Like all investments, the value can go down as well as up, and you could lose money.",
  ];
}

/** Risks specific to what the package invests in. */
const PACKAGE_RISKS: Record<InvestmentPackage["id"], string> = {
  mfc: "Mutual Fund Capital is a diversified portfolio. Its value depends on the performance of the underlying assets and on market conditions.",
  investwise:
    "InvestWise Capital takes on more capital exposure in pursuit of higher returns. Returns may vary more from month to month.",
  abc: "Agribusiness Capital depends on agricultural activity, which can be affected by weather, pests and disease, harvest timing and commodity prices.",
  repf: "Real Estate Pool Fund invests in property. Property values and rental income can fall, and property can take time to sell, which may delay withdrawals.",
};

/** The full terms, with the package's own figures filled in. */
export function termsFor(pkg: InvestmentPackage): TermsSection[] {
  const withdrawals = withdrawalLabel(pkg).toLowerCase();

  return [
    {
      title: "1. About these terms",
      paragraphs: [
        `These terms form an agreement between you and Feenicks1 Solutions Ltd ("Feenicks1", "we", "us") for your investment in ${pkg.name} (${pkg.ticker}). Please read them carefully.`,
        "By ticking the box and continuing, you confirm that you have read, understood and agree to these terms. If you do not agree, do not invest.",
      ],
    },
    {
      title: "2. Who can invest",
      paragraphs: [
        "You must be at least 18 years old, have completed identity verification (KYC) with us, and provide true and complete information.",
        "You must invest with your own money, from an account or mobile money wallet registered in your own name.",
      ],
    },
    {
      title: "3. Your investment",
      paragraphs: [
        `${pkg.name}: ${pkg.description}`,
        `The minimum investment is ${formatCedis(pkg.minimum)} and the maximum is ${formatCedis(pkg.maximum)}. Your investment starts once your payment has been received and confirmed.`,
      ],
    },
    {
      title: "4. Returns",
      paragraphs: [
        `The expected return is ${roiRangeLabel(pkg.monthlyRoiPercent)} a month. This range is an estimate based on the expected performance of the portfolio. It is not a promise or a guarantee.`,
        "Actual returns may be higher or lower than expected, and in some periods there may be no return at all. Past performance does not guarantee future results.",
      ],
    },
    {
      title: "5. Management fee",
      paragraphs: [
        `A management fee of ${pkg.managementFeePercent} percentage points is taken off the monthly gross return: the return you receive is the gross return minus the fee (for example, a 7% month with a ${pkg.managementFeePercent}% fee pays ${7 - pkg.managementFeePercent}%). The fee is never more than the profit for that month, and no fee is charged in a period with no profit.`,
        "The fee is deducted before profit is paid to you. Your statements will show the profit earned, the fee and the amount paid out.",
      ],
    },
    {
      title: "6. Withdrawals",
      paragraphs: [
        `Profit from this portfolio can be withdrawn ${withdrawals}. Withdrawals are paid to the mobile money wallet or bank account registered in your name, normally within a few business days of your request.`,
        "Requests to withdraw your invested amount before the end of a withdrawal period may be subject to approval and may reduce or cancel the profit for that period.",
        "For your security, we may ask you to confirm withdrawals with your PIN, fingerprint or a verification code.",
      ],
    },
    {
      title: "7. Risks",
      paragraphs: [
        "All investments carry risk. The value of your investment can go down as well as up, and you may get back less than you invested. Only invest money you can afford to set aside.",
        PACKAGE_RISKS[pkg.id],
        "Changes in the economy, interest rates, inflation, exchange rates, laws or taxes can affect returns.",
      ],
    },
    {
      title: "8. Your responsibilities",
      paragraphs: [
        "Keep your password, PIN and devices secure, and never share verification codes with anyone. Feenicks1 will never ask you for them.",
        "Tell us promptly if your contact details change, or if you notice any activity on your account that you did not make.",
      ],
    },
    {
      title: "9. Anti-money laundering",
      paragraphs: [
        "We are required by Ghanaian law to verify your identity and to understand the source of the money you invest. We may ask for additional information or documents at any time.",
        "We may delay, decline or reverse a transaction, or suspend an account, where we suspect fraud, money laundering or any other unlawful activity, and we may report it to the relevant authorities.",
      ],
    },
    {
      title: "10. Your information",
      paragraphs: [
        "We collect and use your personal information to provide our services, verify your identity, meet our legal obligations and keep your account secure. We protect it in line with Ghana's data protection laws and do not sell it.",
      ],
    },
    {
      title: "11. Taxes",
      paragraphs: [
        "You are responsible for any taxes due on your returns, unless the law requires us to deduct them. Where we deduct tax, it will be shown on your statement.",
      ],
    },
    {
      title: "12. Changes to these terms",
      paragraphs: [
        "We may update these terms from time to time. We will tell you about important changes before they take effect. Your existing investment remains governed by the terms you agreed to, unless the law requires otherwise.",
      ],
    },
    {
      title: "13. Complaints",
      paragraphs: [
        "If you are unhappy with our service, contact our support team through the app or at www.feenicks1solutions.com. We aim to respond within 5 business days. If a complaint cannot be resolved, it may be referred to the appropriate regulator or dispute resolution body.",
      ],
    },
    {
      title: "14. Governing law",
      paragraphs: [
        "These terms are governed by the laws of the Republic of Ghana, and the courts of Ghana have jurisdiction over any dispute.",
      ],
    },
  ];
}
