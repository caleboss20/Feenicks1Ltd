"use client";

/**
 * About Feenicks1 (Account › About Feenicks1): the trust screen. Who the
 * company is, how the app protects the investor's money and account, where
 * the money is invested, the risks in plain words, and how to reach a
 * person.
 *
 *            Feenicks1
 *   An investment company in Accra, Ghana
 *   COMPANY        Legal name · Registration no. · Licence · Office
 *   HOW WE PROTECT YOU   five facts about how the app works
 *   WHERE YOUR MONEY GOES   the four portfolios
 *   THE RISKS      in plain words
 *   TALK TO US     WhatsApp · Call · Email · Help & support
 *
 * Only facts: every protection listed is how the app actually works.
 * Company details come from config/company.ts (TODO(ceo): registration
 * and licence details are placeholders until confirmed).
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { COMPANY } from "@/config/company";
import { ROUTES } from "@/config/routes";
import { PORTFOLIO_SUMMARIES } from "@/features/investor-profile/investorSegments";
import { ALL_PACKAGES, roiRangeLabel } from "@/features/packages/investmentPackages";
import { WITHDRAWAL_RULES } from "@/features/withdraw/withdrawalModel";
import { SECTION_LABEL } from "@/components/ui/styles";

const LABEL = SECTION_LABEL;

const PROTECTIONS: { title: string; text: string }[] = [
  {
    title: "Money moves only in your name",
    text: "You pay in from your own Mobile Money number, and withdrawals are paid only to the number on your profile.",
  },
  {
    title: "Every movement has a record",
    text: "Each payment, return and withdrawal gets a reference and a receipt you can download or share.",
  },
  {
    title: "Withdrawals are checked by a person",
    text: `Our team reviews each withdrawal before it's paid, within ${WITHDRAWAL_RULES.processingDays} working days, and you're notified at every step.`,
  },
  {
    title: "Your account is locked when you're away",
    text: "Your PIN (and fingerprint or Face ID, if you turned it on) is needed to open the app, and it locks itself after 5 minutes without use.",
  },
  {
    title: "Documents anyone can check",
    text: "Statements and proof of funds letters carry a reference and a QR code that opens a verification page.",
  },
];

const RISKS = [
  "Returns are expected ranges, not promises. A cycle can return less than expected.",
  "The value of an investment can go down as well as up.",
  `Withdrawing during a cycle costs ${WITHDRAWAL_RULES.expressFeePercent}% of the amount; the first ${WITHDRAWAL_RULES.standardWindowDays} days after a cycle ends are free.`,
  "Past returns don't tell you what future returns will be.",
  "Only invest money you won't need in a hurry.",
];

export function AboutScreen() {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.account));
  const whatsApp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

  const details: [string, string][] = [
    ["Legal name", COMPANY.legalName],
    ["Registration no.", COMPANY.registrationNumber],
    ["Regulator", COMPANY.regulator ?? "To be confirmed"],
    ["Licence no.", COMPANY.licenceNumber ?? "To be confirmed"],
    ["Office", COMPANY.address],
  ];

  return (
    <StepScreenLayout title="About Feenicks1" centeredTitle stickyHeader onBack={back}>
      <div className="flex flex-1 flex-col pb-8 sm:flex-none">
        <div className="mt-2 text-center">
          <Image src="/brand/logo-wordmark-green.png" alt="Feenicks1" width={680} height={121} className="mx-auto h-auto w-36" />
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {COMPANY.legalName} is an investment company in Accra, Ghana. This page sets out who we are, how your money
            is handled and how to reach us.
          </p>
        </div>

        <Section title="Company">
          <dl className="flex flex-col gap-3 rounded-3xl border border-neutral-200 p-5 text-sm dark:border-white/10">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="How we protect you">
          <ul className="flex flex-col gap-4">
            {PROTECTIONS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Where your money goes">
          <ul className="divide-y divide-neutral-200 rounded-3xl border border-neutral-200 dark:divide-white/10 dark:border-white/10">
            {ALL_PACKAGES.map((pkg) => (
              <li key={pkg.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold">{pkg.name}</p>
                <p className="mt-0.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{PORTFOLIO_SUMMARIES[pkg.id]}</p>
                <p className="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Expected {roiRangeLabel(pkg.monthlyRoiPercent)} a month, before fees
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="The risks, in plain words">
          <ul className="flex flex-col gap-2.5 rounded-3xl bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
            {RISKS.map((risk) => (
              <li key={risk} className="flex gap-2.5">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-amber-600" />
                {risk}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Legal">
          <ul className="divide-y divide-neutral-100 rounded-3xl border border-neutral-200 dark:divide-white/10 dark:border-white/10">
            {[
              ["terms", "Terms of Use"],
              ["privacy", "Privacy Policy"],
              ["risk", "Risk Disclosure"],
              ["fees", "Fees & charges"],
              ["complaints", "Complaints procedure"],
            ].map(([slug, title]) => (
              <li key={slug}>
                <Link href={`${ROUTES.legal}/${slug}`} className="flex items-center justify-between px-5 py-3.5 text-sm font-semibold">
                  {title}
                  <svg viewBox="0 0 24 24" className="size-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Talk to us">
          <div className="grid grid-cols-2 gap-3">
            <ContactButton href={whatsApp(COMPANY.phones[0])} label="WhatsApp" detail={COMPANY.phones[0]} external />
            <ContactButton href={`tel:${COMPANY.phones[1].replace(/\s/g, "")}`} label="Call" detail={COMPANY.phones[1]} />
            <ContactButton href={`mailto:${COMPANY.email}`} label="Email" detail={COMPANY.email} />
            <ContactButton href={ROUTES.support} label="Help & support" detail="Answers and messages" />
          </div>
        </Section>
      </div>
    </StepScreenLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className={`${LABEL} mb-3`}>{title}</h2>
      {children}
    </section>
  );
}

function ContactButton({ href, label, detail, external = false }: { href: string; label: string; detail: string; external?: boolean }) {
  const className =
    "block min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 transition-colors hover:border-brand-600 dark:border-white/10";
  const content = (
    <>
      <span className="block text-sm font-semibold text-brand-700 dark:text-brand-400">{label}</span>
      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">{detail}</span>
    </>
  );
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {content}
    </a>
  );
}
