import { COMPANY } from "@/config/company";
import { PAYMENT_FEE } from "@/features/payments/paymentModel";
import { ALL_PACKAGES, roiRangeLabel } from "@/features/packages/investmentPackages";
import { REFERRAL_POINTS_LABEL, REFERRAL_REWARD_LABEL } from "@/features/referrals/referralService";
import { WITHDRAWAL_RULES } from "@/features/withdraw/withdrawalModel";
import { formatCedis } from "@/lib/money";

/**
 * The legal centre's documents: Terms of Use, Privacy Policy, Risk
 * Disclosure, Fees & charges and the Complaints procedure.
 *
 * DRAFTS for legal review (shown as such on every page). Every fee, rule
 * and figure is read from the app's own settings (portfolios, withdrawal
 * rules, payment fee, referral reward), so the documents always describe
 * what the app actually does. TODO(legal): review and approve each
 * document; TODO(ceo): the regulator, retention periods and complaint
 * escalation contacts.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDocument = {
  slug: string;
  title: string;
  /** One line for the legal centre list. */
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const UPDATED = "9 October 2026";
const C = COMPANY.legalName;
const FREE_DAYS = WITHDRAWAL_RULES.standardWindowDays;
const FEE = WITHDRAWAL_RULES.expressFeePercent;
const WAIT = WITHDRAWAL_RULES.activationHours;
const DAYS = WITHDRAWAL_RULES.processingDays;
const CONTACT = `WhatsApp ${COMPANY.phones[0]}, phone ${COMPANY.phones[1]} or email ${COMPANY.email}`;

const p = (text: string): LegalBlock => ({ kind: "p", text });
const list = (...items: string[]): LegalBlock => ({ kind: "list", items });
const cycle = (pkg: (typeof ALL_PACKAGES)[number]) => ("days" in pkg.cycle ? `${pkg.cycle.days} days` : `${pkg.cycle.months} months`);
const net = (pkg: (typeof ALL_PACKAGES)[number]) =>
  roiRangeLabel([Math.max(0, pkg.monthlyRoiPercent[0] - pkg.managementFeePercent), Math.max(0, pkg.monthlyRoiPercent[1] - pkg.managementFeePercent)]);

const terms: LegalDocument = {
  slug: "terms",
  title: "Terms of Use",
  summary: "The agreement between you and Feenicks1 when you use the app.",
  updated: UPDATED,
  sections: [
    {
      id: "about",
      title: "1. About these terms",
      blocks: [
        p(`These terms are an agreement between you and ${C} ("Feenicks1", "we", "us"), a company in ${COMPANY.address}. They apply whenever you use the Feenicks1 app or website. By creating an account, you accept them.`),
        p("Each portfolio also has its own terms and conditions, which you accept before investing in it. If they differ from these terms, the portfolio's terms apply to that portfolio."),
      ],
    },
    {
      id: "eligibility",
      title: "2. Who can use Feenicks1",
      blocks: [list("You must be 18 or older.", "You must have a Ghana mobile number and a Mobile Money wallet in your own name.", "You must be able to verify your identity with a Ghana Card, Driver's Licence or Passport.", "You may hold one account only.")],
    },
    {
      id: "account",
      title: "3. Your account and security",
      blocks: [
        list(
          "Give us true, complete information and keep it up to date.",
          "Keep your password, PIN and verification codes secret. We will never ask you for them.",
          "You are responsible for activity on your account until you tell us it has been compromised.",
          "Tell us straight away if you think someone else has used your account.",
        ),
      ],
    },
    {
      id: "verification",
      title: "4. Identity verification",
      blocks: [
        p("To meet our legal duties, including anti-money-laundering rules, we verify who you are. We may ask for an identity document, a selfie holding it and proof of where you live, and we may ask again later."),
        p("We may refuse to open an account, or limit or suspend one, if we cannot verify you or if we suspect fraud or misuse."),
      ],
    },
    {
      id: "investing",
      title: "5. Portfolios and investing",
      blocks: [
        list(
          "You may invest in one portfolio at a time. Each portfolio has a minimum and maximum amount and its own investment cycle.",
          "Expected returns are shown as ranges. They are estimates, not promises. The return for a cycle is set when the cycle ends, after the management fee.",
          `Your first deposit is invested ${WAIT} hours after it arrives. Cycles then run back to back: each starts the moment the previous one ends.`,
          "If additional deposits take your total above the portfolio's maximum, your money moves to the portfolio whose range fits it at the end of the current cycle.",
        ),
        p("The full list of portfolios, their ranges and their fees is in Fees & charges."),
      ],
    },
    {
      id: "payments",
      title: "6. Payments",
      blocks: [p("You pay in from a Mobile Money wallet registered in your name. A payment counts once your provider confirms it. We do not accept payments from other people's wallets.")],
    },
    {
      id: "withdrawals",
      title: "7. Withdrawals",
      blocks: [
        list(
          `In the first ${WAIT} hours after your first deposit, you can withdraw everything free of charge.`,
          `For the first ${FREE_DAYS} days of each new cycle, you can withdraw any amount free of charge.`,
          `At any other time, an express withdrawal costs ${FEE}% of the amount, added on top.`,
          `Our team reviews each withdrawal, and approved withdrawals are paid to your registered Mobile Money number within ${DAYS} working days.`,
          "If a withdrawal leaves less than the portfolio's minimum, the rest moves to the portfolio whose range fits it.",
        ),
      ],
    },
    {
      id: "referrals",
      title: "8. Referrals",
      blocks: [p(`When a friend signs up with your invite link and makes their first investment, you earn ${REFERRAL_POINTS_LABEL} (${REFERRAL_REWARD_LABEL}). The reward is paid once per friend. Rewards gained through fake accounts, self-referral or other abuse may be withdrawn.`)],
    },
    {
      id: "use",
      title: "9. Acceptable use",
      blocks: [list("Use Feenicks1 only for your own lawful investing.", "Do not use another person's identity, wallet or account.", "Do not try to interfere with, copy or reverse-engineer the app.")],
    },
    {
      id: "closing",
      title: "10. Suspending or closing an account",
      blocks: [p("You can ask us to close your account at any time; we pay out your balance under the withdrawal rules. We may suspend or close an account if these terms are broken, if required by law, or to protect you or other investors. We will tell you why unless the law prevents us.")],
    },
    {
      id: "liability",
      title: "11. Our responsibility to you",
      blocks: [p("We provide the service with reasonable care and skill. We are not responsible for losses caused by events outside our reasonable control, such as Mobile Money network outages, or for the normal ups and downs of investments described in the Risk Disclosure. Nothing in these terms limits rights you have under the laws of Ghana that cannot be limited.")],
    },
    {
      id: "changes",
      title: "12. Changes to these terms",
      blocks: [p("We may update these terms. We will tell you in the app before important changes take effect. If you keep using Feenicks1 after that, the new terms apply.")],
    },
    {
      id: "law",
      title: "13. Law and contact",
      blocks: [p(`These terms are governed by the laws of the Republic of Ghana. Questions? Contact ${C} on ${CONTACT}.`)],
    },
  ],
};

const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  summary: "What personal data we collect, why, and your rights under Ghana's Data Protection Act.",
  updated: UPDATED,
  sections: [
    {
      id: "who",
      title: "1. Who we are",
      blocks: [p(`${C}, ${COMPANY.address}, is responsible for your personal data under the Data Protection Act, 2012 (Act 843) of Ghana.`)],
    },
    {
      id: "collect",
      title: "2. What we collect",
      blocks: [
        list(
          "Account details: your name, email, phone number, username, gender and profile photo.",
          "Identity documents: your Ghana Card, Driver's Licence or Passport, a selfie holding it and proof of where you live.",
          "Investor profile: your answers about your goals, experience and comfort with risk.",
          "Financial records: your payments, investments, returns, withdrawals and the Mobile Money number and network you use.",
          "Device and security information: the type of device and browser, log-ins and security changes.",
          "Messages you send to our support team.",
        ),
      ],
    },
    {
      id: "why",
      title: "3. Why we use it",
      blocks: [
        list(
          "To open and run your account and your investments.",
          "To verify your identity and meet anti-money-laundering and other legal duties.",
          "To process payments and withdrawals.",
          "To keep your account secure and prevent fraud.",
          "To send you receipts, statements and important notices.",
          "To answer your questions and complaints.",
        ),
        p("We do not sell your personal data."),
      ],
    },
    {
      id: "share",
      title: "4. Who we share it with",
      blocks: [
        list(
          "Mobile Money and payment providers, to move your money.",
          "Identity verification providers, to check your documents.",
          "Regulators, courts and law enforcement, when the law requires it.",
          "Professional advisers such as auditors and lawyers, under confidentiality.",
        ),
      ],
    },
    {
      id: "security",
      title: "5. How we protect it",
      blocks: [p("Data travels encrypted between your device and our service. Your password and PIN are stored only in scrambled (hashed) form that cannot be read back, and access to personal data is limited to staff who need it.")],
    },
    {
      id: "keep",
      title: "6. How long we keep it",
      blocks: [p("We keep your data while your account is open and afterwards for as long as the law requires us to keep financial and identity records. Then we delete or anonymise it.")],
    },
    {
      id: "rights",
      title: "7. Your rights",
      blocks: [
        list(
          "Ask for a copy of the personal data we hold about you.",
          "Ask us to correct data that is wrong.",
          "Ask us to delete data we no longer need to keep by law.",
          "Object to how we use your data.",
          "Complain to the Data Protection Commission of Ghana.",
        ),
        p(`To use these rights, contact us on ${CONTACT}.`),
      ],
    },
    {
      id: "device",
      title: "8. Data on your device",
      blocks: [p("The app saves some settings on your device, such as dark mode, your dashboard colour and whether amounts are hidden. You can clear them from your browser or phone settings.")],
    },
    {
      id: "children",
      title: "9. Children",
      blocks: [p("Feenicks1 is not for people under 18, and we do not knowingly collect their data.")],
    },
    {
      id: "changes",
      title: "10. Changes",
      blocks: [p("We will tell you in the app before important changes to this policy take effect.")],
    },
  ],
};

const risk: LegalDocument = {
  slug: "risk",
  title: "Risk Disclosure",
  summary: "The risks of investing with Feenicks1, in plain words.",
  updated: UPDATED,
  sections: [
    {
      id: "general",
      title: "1. Investing carries risk",
      blocks: [p("The value of your investment can go down as well as up. You could get back less than you put in. Only invest money you can leave invested and could afford to lose part of.")],
    },
    {
      id: "returns",
      title: "2. Returns are not guaranteed",
      blocks: [
        p("Each portfolio shows an expected monthly return range before fees. These are estimates based on expected performance, not promises. A cycle can return less than expected, or nothing."),
        { kind: "table", head: ["Portfolio", "Expected monthly return"], rows: ALL_PACKAGES.map((pkg) => [pkg.name, `${roiRangeLabel(pkg.monthlyRoiPercent)} before fees`]) },
      ],
    },
    {
      id: "portfolio",
      title: "3. Risks of each portfolio",
      blocks: [
        list(
          "Mutual Fund Capital: a diversified managed portfolio whose value follows the markets it invests in.",
          "InvestWise Capital: broader market exposure, so it is affected by market and economic conditions.",
          "Agribusiness Capital: tied to farming businesses, so weather, harvests, disease and crop prices can affect returns.",
          "Real Estate Pool Fund: tied to property values and rents, which can fall, and property can take time to sell.",
        ),
      ],
    },
    {
      id: "access",
      title: "4. Access to your money",
      blocks: [p(`Withdrawals during a cycle cost ${FEE}% of the amount. Withdrawals are reviewed and paid within ${DAYS} working days, so your money is not available instantly. Plan for this if you may need cash in a hurry.`)],
    },
    {
      id: "concentration",
      title: "5. One portfolio at a time",
      blocks: [p("You can hold one portfolio at a time, so your money is not spread across different kinds of investment through Feenicks1.")],
    },
    {
      id: "fees",
      title: "6. Fees reduce returns",
      blocks: [p("A management fee is taken from each cycle's return before it is paid. See Fees & charges for every fee.")],
    },
    {
      id: "operational",
      title: "7. Other risks",
      blocks: [list("Technology and network outages, including Mobile Money services, can delay payments or withdrawals.", "Changes in laws, taxes or regulation can affect investments and returns.", "Past returns do not tell you what future returns will be.")],
    },
  ],
};

const fees: LegalDocument = {
  slug: "fees",
  title: "Fees & charges",
  summary: "Every fee, in one place.",
  updated: UPDATED,
  sections: [
    {
      id: "management",
      title: "1. Management fee",
      blocks: [
        p("Each portfolio charges a management fee, taken from the return before it is paid: the fee's percentage points come off the month's gross return (for example, 7% gross with a 4-point fee pays 3%). The fee is never more than the return, so it never reduces the amount you invested."),
        {
          kind: "table",
          head: ["Portfolio", "Range", "Cycle", "Fee", "Expected after fee"],
          rows: ALL_PACKAGES.map((pkg) => [
            pkg.name,
            `${formatCedis(pkg.minimum)} – ${formatCedis(pkg.maximum, { exact: true })}`,
            cycle(pkg),
            `${pkg.managementFeePercent} points`,
            `${net(pkg)} a month`,
          ]),
        },
      ],
    },
    {
      id: "withdrawals",
      title: "2. Withdrawal fees",
      blocks: [
        {
          kind: "table",
          head: ["When you withdraw", "Fee"],
          rows: [
            [`First ${WAIT} hours after your first deposit`, "Free"],
            [`First ${FREE_DAYS} days of each new cycle`, "Free"],
            ["Any other time (express withdrawal)", `${FEE}% of the amount, added on top`],
          ],
        },
        p(`Example: withdrawing ${formatCedis(500, { exact: true })} as an express withdrawal, you receive ${formatCedis(500, { exact: true })} and ${formatCedis(505, { exact: true })} leaves your wallet.`),
      ],
    },
    {
      id: "deposits",
      title: "3. Deposits",
      blocks: [p(`Feenicks1 charges ${PAYMENT_FEE === 0 ? "nothing" : formatCedis(PAYMENT_FEE, { exact: true })} to pay in. Your Mobile Money provider may apply its own charges or levies.`)],
    },
    {
      id: "free",
      title: "4. Always free",
      blocks: [list("Opening an account.", "Receipts, statements and proof of funds letters.", "Inviting friends.")],
    },
  ],
};

const complaints: LegalDocument = {
  slug: "complaints",
  title: "Complaints procedure",
  summary: "How to raise a problem, and what we will do about it.",
  updated: UPDATED,
  sections: [
    {
      id: "how",
      title: "1. How to complain",
      blocks: [
        p(`Tell us in the app (Account › Help & support), or contact ${C} on ${CONTACT}.`),
        p("Include your name, the transaction reference if there is one, what went wrong and what you would like us to do."),
      ],
    },
    {
      id: "next",
      title: "2. What happens next",
      blocks: [
        list(
          "We acknowledge your complaint within 2 working days and give you a reference.",
          "We investigate and aim to resolve it within 10 working days, keeping you updated.",
          "We send you our final response in writing, with our reasons.",
        ),
      ],
    },
    {
      id: "escalate",
      title: "3. If you are not satisfied",
      blocks: [
        p("Ask for your complaint to be reviewed by our management, quoting your reference."),
        p("If you are still not satisfied, you can refer it to the relevant regulator. Complaints about personal data can go to the Data Protection Commission of Ghana."),
      ],
    },
    {
      id: "records",
      title: "4. Records",
      blocks: [p("We keep a record of every complaint and how it was resolved, to improve our service.")],
    },
  ],
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [terms, privacy, risk, fees, complaints];

export function legalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS.find((item) => item.slug === slug) ?? null;
}
