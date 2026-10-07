"use client";

/**
 * How withdrawals work: the CEO's withdrawal rules explained for a complete
 * beginner, one idea at a time, with plenty of space. Opened from the
 * Withdraw screen ("How it works") and the dashboard's "How withdrawals
 * work" card.
 *
 * Every figure comes from the same rules the Withdraw screen uses
 * (withdrawalModel.ts and the packages), so this page can never say
 * something different from what actually happens.
 *
 *   The short answer          ← free or 1%, depending on the date
 *   Your dates                ← only if they've invested: their own dates
 *   First, what's a "cycle"?  ← the one word to understand, with each package's
 *   Step by step              ← from the first deposit: 72 h, cycle, free days, repeat
 *   An example: GH₵ 500       ← free vs early, side by side
 *   If very little is left    ← moving down a package
 *   After you press Withdraw  ← requested → approved → paid
 *   Quick answers             ← the questions people ask
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
            The short answer
          </p>
          <p className="mt-3 text-[1.0625rem] leading-7 text-foreground">
            You can take money out of your wallet <Key>whenever you want</Key>.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-7 text-neutral-600 dark:text-neutral-400">
            At the right time it&apos;s <Key>free</Key>. At other times a small <Key>{FEE}% fee</Key> is added. This
            page shows you which is which.
          </p>
        </div>

        <YourDates />

        <Section title={`First, what's a "cycle"?`}>
          <p>
            Your money is invested in <Key>rounds</Key>. Each round is called a <Key>cycle</Key>.
          </p>
          <p>
            Think of it like a harvest: the money is planted, it grows for a set time, and at the end of that time it&apos;s
            ready. That set time is one cycle. Then a new one starts.
          </p>
          <p>How long one cycle lasts depends on your package:</p>
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

        <Section title="Step by step, from your first deposit">
          <ol className="flex flex-col">
            <Step
              number={1}
              tone="free"
              title={`The first ${WAIT_HOURS} hours: waiting, and free`}
              text={`After you put money in, it waits ${WAIT_HOURS} hours (3 days) before it starts working. Changed your mind? Take it all back, free.`}
            />
            <Step
              number={2}
              tone="neutral"
              title="Your money starts working"
              text="After those 3 days, your first cycle begins."
            />
            <Step
              number={3}
              tone="fee"
              title={`During the cycle: ${FEE}% fee`}
              text={`You can still take money out, but it's an early withdrawal (we call it "express"). A ${FEE}% fee is added.`}
            />
            <Step
              number={4}
              tone="free"
              title={`When the cycle ends: ${FREE_DAYS} free days`}
              text={`For ${FREE_DAYS} days you can take out any amount, even everything, with no fee. This is a "standard" withdrawal.`}
            />
            <Step
              number={5}
              tone="neutral"
              title="A new cycle starts"
              text={`If you leave your money in, the next cycle begins and the same pattern repeats: ${FEE}% during the cycle, free for ${FREE_DAYS} days at the end.`}
              isLast
            />
          </ol>
        </Section>

        <Section title={`An example: taking out ${formatCedis(example)}`}>
          <p>
            You always receive <Key>exactly what you ask for</Key> on Mobile Money. The fee is added on top, so the only
            difference is how much leaves your wallet.
          </p>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <CostCard title="At a free time" received={example} taken={example} note="No fee." />
            <CostCard
              title="During a cycle"
              received={example}
              taken={example + exampleFee}
              note={`${FEE}% fee: ${formatCedis(exampleFee, { exact: true })}.`}
              isFee
            />
          </div>
        </Section>

        <Section title="If very little is left in your wallet">
          <p>
            Each package has a <Key>smallest amount</Key> it holds. If you take out so much that what&apos;s left is
            below that, the rest moves to a smaller package that fits it.
          </p>
          <p>
            For example: you have {formatCedis(1500, { exact: true })} in {INVESTMENT_PACKAGES.investwise.name} and take
            out {formatCedis(1100, { exact: true })} during a cycle. With the {FEE}% fee,{" "}
            {formatCedis(1111, { exact: true })} leaves your wallet, so {formatCedis(389, { exact: true })} is left.
            That&apos;s below {INVESTMENT_PACKAGES.investwise.name}&apos;s {formatCedis(INVESTMENT_PACKAGES.investwise.minimum)},
            so it moves to {INVESTMENT_PACKAGES.mfc.name}.
          </p>
          <p>Don&apos;t worry about working this out: the app always tells you before you confirm.</p>
        </Section>

        <Section title="After you press Withdraw">
          <ol className="flex flex-col gap-4">
            {[
              ["Requested", "We receive your request. You can still cancel it at this point."],
              ["Approved", "Our team checks it and approves it."],
              ["Paid", `The money arrives in your Mobile Money, within ${WITHDRAWAL_RULES.processingDays} working days.`],
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
          <p>You get a notification at each step.</p>
        </Section>

        <Section title="Quick answers">
          <Answer question="Is my money locked?">
            No. You can always take it out. Timing only decides whether a {FEE}% fee is added.
          </Answer>
          <Answer question="Why is there a fee during a cycle?">
            During a cycle your money is at work. Taking it out early interrupts that, so it&apos;s treated as an
            emergency withdrawal.
          </Answer>
          <Answer question="How do I avoid the fee?">
            Wait for the free days at the end of your cycle. &quot;Your dates&quot; above (and the Withdraw screen) show
            exactly when they are.
          </Answer>
          <Answer question="Can I take out everything?">
            Yes. At a free time, any amount up to everything, with no fee.
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
      ? `Free. Your money starts working on ${day(terms.investedFrom, true)}.`
      : terms.kind === "standard"
        ? `Free, until ${terms.freeUntil ? day(terms.freeUntil) : "the free days end"}.`
        : `A ${FEE}% fee applies (you're in a cycle).`;

  return (
    <section className="mt-8 rounded-3xl bg-brand-50 p-6 dark:bg-brand-500/10">
      <h2 className="text-lg font-bold tracking-tight">Your dates</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{pkg.name}</p>

      <p
        className={cn(
          "mt-5 rounded-2xl px-4 py-3 text-[0.9375rem] leading-6 font-semibold",
          isFee
            ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
            : "bg-white text-brand-800 dark:bg-white/10 dark:text-brand-300",
        )}
      >
        Right now: {nowText}
      </p>

      <dl className="mt-5 flex flex-col gap-4 text-[0.9375rem]">
        <DateRow label="You first put money in" value={day(started, true)} />
        <DateRow label="Your money started working" value={day(terms.investedFrom, true)} />
        {windows.map((window, index) => (
          <DateRow
            key={window.from.toISOString()}
            label={index === 0 ? "Your next free days" : "The free days after that"}
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
