"use client";

/**
 * How withdrawals work: the CEO's withdrawal rules, explained one idea at a
 * time in plain, professional language (the CEO asked for a tone between
 * conversational and formal, October 2026). Opened from the Withdraw screen
 * ("How it works") and the dashboard's "How withdrawals work" card.
 *
 * Every figure comes from the same rules the Withdraw screen uses
 * (withdrawalModel.ts and the packages), so this page can never say
 * something different from what actually happens.
 *
 *   Overview                         ← free or 1%, depending on the date
 *   Your withdrawal schedule         ← only if they've invested: their own dates
 *   Investment cycles                ← what a cycle is, with each package's length
 *   How the timeline works           ← from the first deposit: 72 h, cycle, free days, repeat
 *   Fees: an example                 ← standard vs express, side by side
 *   Minimum balance and packages     ← moving down a package
 *   Processing your withdrawal       ← requested → approved → paid
 *   Frequently asked questions
 */

import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { cycleEnd, INVESTMENT_PACKAGES, withdrawalLabel } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import { useTransactions } from "@/features/transactions/useTransactions";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { firstDeposit, WITHDRAWAL_RULES, withdrawalFee, withdrawalTerms } from "./withdrawalModel";

const DAY = 86_400_000;
const FREE_DAYS = WITHDRAWAL_RULES.standardWindowDays;
const FEE = WITHDRAWAL_RULES.expressFeePercent;
const WAIT_HOURS = WITHDRAWAL_RULES.activationHours;

/** "28 Oct" / "28 Oct, 3:02 pm". */
function day(date: Date, withTime = false): string {
  const text = date.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
  return withTime ? `${text}, ${date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" })}` : text;
}

/** A section: a clear heading, then roomy text. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg leading-snug font-bold tracking-tight">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[0.9375rem] leading-7 text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </section>
  );
}

/** Bold, in the page's text colour, for the words that matter. */
function Key({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

export function WithdrawalGuideScreen() {
  const example = 500;
  const exampleFee = withdrawalFee("express", example);

  return (
    <StepScreenLayout title="How withdrawals work" centeredTitle stickyHeader backHref={ROUTES.withdraw}>
      <div className="pb-12">
        {/* The short answer, first. */}
        <div className="mt-2 rounded-3xl bg-neutral-50 p-6 dark:bg-white/5">
          <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            Overview
          </p>
          <p className="mt-3 text-[1.0625rem] leading-7 text-foreground">
            You may withdraw from your wallet <Key>at any time</Key>.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-7 text-neutral-600 dark:text-neutral-400">
            Withdrawals made in the first {WAIT_HOURS} hours, or at the end of an investment cycle, are{" "}
            <Key>free of charge</Key>. Withdrawals made at any
            other time carry a <Key>{FEE}% fee</Key>. This page explains when each applies.
          </p>
        </div>

        <YourDates />

        <Section title="Investment cycles">
          <p>
            Your funds are invested for fixed periods, each known as an <Key>investment cycle</Key>. Returns are
            calculated at the end of every cycle, after which a new cycle begins automatically.
          </p>
          <p>The length of a cycle depends on your package:</p>
          <dl className="overflow-hidden rounded-2xl bg-neutral-50 dark:bg-white/5">
            {Object.values(INVESTMENT_PACKAGES).map((pkg, index) => (
              <div
                key={pkg.id}
                className={cn(
                  "flex items-center justify-between gap-4 px-5 py-4",
                  index > 0 && "border-t border-neutral-200/70 dark:border-white/10",
                )}
              >
                <dt className="text-foreground">{pkg.name}</dt>
                <dd className="font-semibold whitespace-nowrap text-foreground">
                  {withdrawalLabel(pkg).replace("Every ", "")}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="How the timeline works">
          <ol className="flex flex-col">
            <Step
              number={1}
              tone="free"
              title={`First ${WAIT_HOURS} hours: free withdrawal`}
              text={`Your first deposit is invested ${WAIT_HOURS} hours after it is received. Until then, you may withdraw the full amount at no charge.`}
            />
            <Step
              number={2}
              tone="neutral"
              title="Your first cycle begins"
              text={`Once the ${WAIT_HOURS} hours have passed, your funds are invested and your first cycle starts.`}
            />
            <Step
              number={3}
              tone="fee"
              title={`During a cycle: express withdrawal (${FEE}% fee)`}
              text={`Withdrawals remain available during a cycle. These are processed as express withdrawals, with a ${FEE}% fee added to the amount requested.`}
            />
            <Step
              number={4}
              tone="free"
              title={`End of a cycle: standard withdrawal (free)`}
              text={`For ${FREE_DAYS} days after each cycle ends, you may withdraw any amount, up to your full balance, at no charge.`}
            />
            <Step
              number={5}
              tone="neutral"
              title="The next cycle"
              text={`Funds that remain in your wallet are reinvested in the next cycle, and the same terms apply: a ${FEE}% fee during the cycle and ${FREE_DAYS} fee-free days at its end.`}
              isLast
            />
          </ol>
        </Section>

        <Section title={`Fees: an example of ${formatCedis(example)}`}>
          <p>
            You always receive <Key>the full amount you request</Key> on Mobile Money. Any fee is added on top and
            deducted from your wallet balance.
          </p>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <CostCard title="Standard" received={example} taken={example} note="No fee." />
            <CostCard
              title="Express"
              received={example}
              taken={example + exampleFee}
              note={`${FEE}% fee: ${formatCedis(exampleFee, { exact: true })}.`}
              isFee
            />
          </div>
        </Section>

        <Section title="Minimum balance and package changes">
          <p>
            Each package has a <Key>minimum balance</Key>. If a withdrawal leaves your balance below that minimum, the
            remaining funds move to the package whose range fits the new balance, and that package&apos;s rates apply.
          </p>
          <p>
            For example, you hold {formatCedis(1500, { exact: true })} in {INVESTMENT_PACKAGES.investwise.name} and withdraw
            {formatCedis(1100, { exact: true })} during a cycle. Including the {FEE}% fee,{" "}
            {formatCedis(1111, { exact: true })} is deducted, leaving {formatCedis(389, { exact: true })}. As this is
            below the {INVESTMENT_PACKAGES.investwise.name} minimum of{" "}
            {formatCedis(INVESTMENT_PACKAGES.investwise.minimum)}, your balance moves to {INVESTMENT_PACKAGES.mfc.name}.
          </p>
          <p>The app shows any package change before you confirm a withdrawal.</p>
        </Section>

        <Section title="Processing your withdrawal">
          <ol className="flex flex-col gap-4">
            {[
              ["Requested", "Your request is received. It can be cancelled until it is approved."],
              ["Approved", "Our team reviews and approves the request."],
              ["Paid", `The funds are sent to your Mobile Money wallet within ${WITHDRAWAL_RULES.processingDays} working days.`],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5">
                  <Key>{title}.</Key> {text}
                </span>
              </li>
            ))}
          </ol>
          <p>You will receive a notification at each stage, and a receipt once the payment is made.</p>
        </Section>

        <Section title="Frequently asked questions">
          <Answer question="Can I withdraw at any time?">
            Yes. Your funds are always available. The timing only determines whether the {FEE}% fee applies.
          </Answer>
          <Answer question="Why is there a fee during a cycle?">
            During a cycle your funds are actively invested. A withdrawal before the cycle ends is treated as an
            express (early) withdrawal, which carries a {FEE}% fee.
          </Answer>
          <Answer question="How can I avoid the fee?">
            Withdraw during the {FREE_DAYS} fee-free days after a cycle ends. Your withdrawal schedule above, and the
            Withdraw screen, show the exact dates.
          </Answer>
          <Answer question="Can I withdraw my full balance?">
            Yes. During the fee-free days you may withdraw any amount, up to your full balance, at no charge.
          </Answer>
        </Section>
      </div>
    </StepScreenLayout>
  );
}

/** The signed-in investor's own dates, worked out from their first deposit. Nothing if they haven't invested. */
function YourDates() {
  const current = useCurrentAccount();
  const transactions = useTransactions();
  if (current.status !== "signed-in" || !transactions) return null;
  const packageId = heldPackageIds(transactions)[0];
  const started = packageId ? firstDeposit(transactions, packageId) : null;
  if (!packageId || !started) return null;

  const pkg = INVESTMENT_PACKAGES[packageId];
  const now = new Date();
  const terms = withdrawalTerms(pkg, started, now);
  // The next two free windows that haven't started yet.
  const windows: { from: Date; until: Date }[] = [];
  for (let count = 1; windows.length < 2 && count < 2000; count += 1) {
    const from = cycleEnd(pkg, terms.investedFrom, count);
    const until = new Date(from.getTime() + FREE_DAYS * DAY);
    if (from > now) windows.push({ from, until });
  }

  const isFee = terms.kind === "express";
  const nowText =
    terms.kind === "pre-investment"
      ? `Free of charge. Your funds will be invested on ${day(terms.investedFrom, true)}.`
      : terms.kind === "standard"
        ? `Free of charge until ${terms.freeUntil ? day(terms.freeUntil) : "the fee-free days end"}.`
        : `A ${FEE}% fee applies (a cycle is in progress).`;

  return (
    <section className="mt-8 rounded-3xl bg-brand-50 p-6 dark:bg-brand-500/10">
      <h2 className="text-lg font-bold tracking-tight">Your withdrawal schedule</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{pkg.name}</p>

      <p
        className={cn(
          "mt-5 rounded-2xl px-4 py-3 text-[0.9375rem] leading-6 font-semibold",
          isFee
            ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
            : "bg-white text-brand-800 dark:bg-white/10 dark:text-brand-300",
        )}
      >
        Current status: {nowText}
      </p>

      <dl className="mt-5 flex flex-col gap-4 text-[0.9375rem]">
        <DateRow label="First deposit" value={day(started, true)} />
        <DateRow label="Invested from" value={day(terms.investedFrom, true)} />
        {windows.map((window, index) => (
          <DateRow
            key={window.from.toISOString()}
            label={index === 0 ? "Next fee-free window" : "Following fee-free window"}
            value={`${day(window.from)} – ${day(window.until)}`}
          />
        ))}
      </dl>
    </section>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-neutral-600 dark:text-neutral-400">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/** One step on the vertical line: a numbered dot (green free, amber fee, grey neutral), then the words. */
function Step({
  number,
  tone,
  title,
  text,
  isLast = false,
}: {
  number: number;
  tone: "free" | "fee" | "neutral";
  title: string;
  text: string;
  isLast?: boolean;
}) {
  return (
    <li className={cn("relative flex gap-4", !isLast && "pb-8")}>
      {!isLast && (
        <span aria-hidden className="absolute top-10 bottom-1 left-[1.1875rem] w-0.5 rounded-full bg-neutral-200 dark:bg-white/15" />
      )}
      <span
        aria-hidden
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
          tone === "free" && "bg-brand-600 text-white",
          tone === "fee" && "bg-amber-500 text-white",
          tone === "neutral" && "bg-neutral-200 text-neutral-700 dark:bg-white/15 dark:text-neutral-200",
        )}
      >
        {number}
      </span>
      <div className="min-w-0 pt-1.5">
        <p className="leading-6 font-semibold text-foreground">{title}</p>
        <p className="mt-1.5 leading-7">{text}</p>
      </div>
    </li>
  );
}

function CostCard({
  title,
  received,
  taken,
  note,
  isFee = false,
}: {
  title: string;
  received: number;
  taken: number;
  note: string;
  isFee?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl p-5", isFee ? "bg-amber-50 dark:bg-amber-500/10" : "bg-brand-50 dark:bg-brand-500/10")}>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-3 text-sm">You receive</p>
      <p className="text-lg font-bold text-foreground tabular-nums">{formatCedis(received, { exact: true })}</p>
      <p className="mt-2 text-sm">Leaves your wallet</p>
      <p className="text-lg font-bold text-foreground tabular-nums">{formatCedis(taken, { exact: true })}</p>
      <p className="mt-2 text-sm">{note}</p>
    </div>
  );
}

function Answer({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-white/5">
      <p className="font-semibold text-foreground">{question}</p>
      <p className="mt-2">{children}</p>
    </div>
  );
}
