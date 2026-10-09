"use client";

/**
 * My investment: what's happening with the investor's money right now, at
 * a glance, so the cycle and withdrawal rules are something they can SEE.
 * Opened by tapping the wallet card (Invest / Withdraw) or Account › My
 * investment.
 *
 *   ←            InvestWise Capital
 *              GH₵ 1,450.50
 *          IC · F1 IC 4821 7365
 *   ╭──────────────────────────────────────────╮
 *   │   ◜‾‾‾◝    Cycle 2                         │
 *   │  │ 12 │   7 Oct – 4 Nov 2026              │  ← ring: day 12 of 28
 *   │   ◟___◞    Withdrawals: 1% fee until 4 Nov │
 *   ╰──────────────────────────────────────────╯
 *   THIS CYCLE   Earned so far (estimate)  GH₵ 4.90 – 24.40
 *                Expected for the cycle    GH₵ 11.40 – 56.90
 *   COMING UP    Next return · Next free withdrawal · Cycle 3 starts
 *   PAST CYCLES  Cycle 1 · 9 Sep – 7 Oct · GH₵ 52.50 paid
 *
 * Figures: investmentOverview.ts (the same rules as Withdraw and the guide).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useWallet } from "@/features/wallets/useWallet";
import { formatWalletId } from "@/features/wallets/walletModel";
import { WITHDRAWAL_RULES } from "@/features/withdraw/withdrawalModel";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { investmentOverview, type InvestmentOverview } from "./investmentOverview";

const LABEL = "text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400";
const DAY = 86_400_000;

const date = (value: Date) => value.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
const dayMonth = (value: Date) => value.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
const dateTime = (value: Date) =>
  `${dayMonth(value)}, ${value.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" })}`;
const range = (from: Date, to: Date) => `${dayMonth(from)} – ${date(to)}`;
const money = (value: number) => formatCedis(value, { exact: true });
const moneyRange = ([low, high]: [number, number]) =>
  low === high ? money(low) : `${money(low)} – ${formatCedis(high, { exact: true }).replace(/^GH₵\s*/, "")}`;

/** "today", "tomorrow", "in 8 days". */
function inDays(target: Date, now: Date): string {
  const days = Math.ceil((target.getTime() - now.getTime()) / DAY);
  return days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

export function InvestmentOverviewScreen() {
  const router = useRouter();
  const transactions = useTransactions();
  const packageId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const wallet = useWallet(packageId);
  const back = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.invest));

  if (transactions === null) {
    return (
      <StepScreenLayout title="My investment" centeredTitle stickyHeader onBack={back}>
        <div className="grid flex-1 place-items-center py-20">
          <LoadingSpinner />
        </div>
      </StepScreenLayout>
    );
  }

  const pkg = packageId ? INVESTMENT_PACKAGES[packageId] : null;
  const now = new Date();
  const overview = pkg ? investmentOverview(pkg, transactions, now) : null;

  if (!pkg || !overview) {
    return (
      <StepScreenLayout title="My investment" centeredTitle stickyHeader onBack={back}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-bold tracking-tight">Nothing invested yet</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Once your first payment arrives, you&apos;ll see your cycle, what you&apos;ve earned and what&apos;s next
            here.
          </p>
          <ButtonLink href={ROUTES.invest} size="lg" className="mt-6 h-13! px-10">
            Invest
          </ButtonLink>
        </div>
      </StepScreenLayout>
    );
  }

  return (
    <StepScreenLayout title={pkg.name} centeredTitle stickyHeader onBack={back}>
      <div className="flex flex-1 flex-col pb-6 sm:flex-none">
        {/* Balance */}
        <div className="mt-1 text-center">
          <p className="text-[2rem] leading-tight font-bold tracking-tight tabular-nums">{money(overview.balance)}</p>
          <p className="mt-1 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
            {pkg.ticker}
            {wallet ? ` · ${formatWalletId(wallet.id)}` : ""}
          </p>
        </div>

        <CycleCard overview={overview} now={now} />

        {/* This cycle: the estimate, clearly labelled as one. */}
        {overview.phase === "investing" && overview.cycle && (
          <section className="mt-7" aria-labelledby="this-cycle">
            <h2 id="this-cycle" className={LABEL}>
              This cycle
            </h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <Row label="Earned so far (estimate)" value={moneyRange(overview.earnedSoFar)} strong />
              <Row label="Expected this cycle" value={moneyRange(overview.expectedThisCycle)} />
            </dl>
            <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              From {pkg.name}&apos;s expected return after fees, on your current balance. The actual return is set
              when the cycle ends and isn&apos;t guaranteed.
            </p>
          </section>
        )}

        {/* Coming up */}
        <section className="mt-7" aria-labelledby="coming-up">
          <h2 id="coming-up" className={LABEL}>
            Coming up
          </h2>
          <ul className="mt-2 divide-y divide-neutral-200 dark:divide-white/10">
            {overview.phase === "waiting" && (
              <Upcoming
                title="Your money starts working"
                when={`${dateTime(overview.investedFrom)} (${inDays(overview.investedFrom, now)})`}
                note="Cycle 1 begins. Until then, you can take it all back free."
              />
            )}
            {overview.phase === "investing" && overview.cycle && (
              <Upcoming
                title={`Cycle ${overview.cycle.number} ends · return`}
                when={`${date(overview.cycle.end)} (${inDays(overview.cycle.end, now)})`}
                note={`Expected ${moneyRange(overview.expectedThisCycle)}. Cycle ${overview.cycle.number + 1} starts at the same moment.`}
              />
            )}
            <Upcoming
              title="Next free withdrawal"
              when={
                overview.freeUntil
                  ? `Now, until ${dateTime(overview.freeUntil)}`
                  : `${range(overview.nextFree.from, overview.nextFree.until)} (${inDays(overview.nextFree.from, now)})`
              }
              note={
                overview.freeUntil
                  ? "Withdraw any amount with no fee."
                  : `The first ${WITHDRAWAL_RULES.standardWindowDays} days of the next cycle. Any other time, a ${WITHDRAWAL_RULES.expressFeePercent}% fee applies.`
              }
              highlight={overview.freeUntil !== null}
            />
          </ul>
        </section>

        {/* Past cycles */}
        <section className="mt-7" aria-labelledby="past-cycles">
          <h2 id="past-cycles" className={LABEL}>
            Past cycles
          </h2>
          {overview.finished.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Your first cycle is still running. Finished cycles and their returns will show here.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200 dark:divide-white/10">
              {overview.finished.map((item) => (
                <li key={item.number} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Cycle {item.number}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{range(item.start, item.end)}</p>
                  </div>
                  <p
                    className={cn(
                      "text-right text-sm tabular-nums",
                      item.returned === null ? "text-neutral-500 dark:text-neutral-400" : "font-semibold text-brand-700 dark:text-brand-400",
                    )}
                  >
                    {item.returned === null ? "Awaiting payout" : `${money(item.returned)} paid`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
          <Link href={ROUTES.withdrawGuide} className="rounded-full px-3 py-2 hover:bg-brand-50 dark:hover:bg-white/10">
            How withdrawals work
          </Link>
          <span aria-hidden className="h-3.5 w-px bg-neutral-200 dark:bg-white/15" />
          <Link href={ROUTES.statements} className="rounded-full px-3 py-2 hover:bg-brand-50 dark:hover:bg-white/10">
            Statements
          </Link>
        </div>
      </div>
    </StepScreenLayout>
  );
}

/** The ring: how far through the cycle (or the first 72 hours) we are, and what withdrawing costs now. */
function CycleCard({ overview, now }: { overview: InvestmentOverview; now: Date }) {
  const isWaiting = overview.phase === "waiting";
  const cycle = overview.cycle;
  const progress = isWaiting
    ? overview.waitingHours / WITHDRAWAL_RULES.activationHours
    : cycle
      ? cycle.day / cycle.lengthDays
      : 0;
  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const isFree = overview.freeUntil !== null;

  return (
    <section className="mt-6 flex items-center gap-5 rounded-3xl border border-neutral-200 p-5 dark:border-white/10">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-neutral-100 dark:stroke-white/10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.max(0.02, Math.min(1, progress)))}
            className={cn("transition-[stroke-dashoffset] duration-700", isFree ? "stroke-brand-600" : "stroke-amber-500")}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          {isWaiting ? (
            <>
              <span className="text-xl font-bold tabular-nums">{Math.floor(overview.waitingHours)}h</span>
              <span className="text-[0.6875rem] text-neutral-500 dark:text-neutral-400">of {WITHDRAWAL_RULES.activationHours}h</span>
            </>
          ) : cycle ? (
            <>
              <span className="text-[0.6875rem] text-neutral-500 dark:text-neutral-400">Day</span>
              <span className="text-2xl leading-none font-bold tabular-nums">{cycle.day}</span>
              <span className="mt-0.5 text-[0.6875rem] text-neutral-500 dark:text-neutral-400">of {cycle.lengthDays}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[0.9375rem] font-bold">{isWaiting ? "Getting ready" : `Cycle ${cycle?.number ?? 1}`}</p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {isWaiting
            ? `Invested from ${dateTime(overview.investedFrom)}`
            : cycle
              ? range(cycle.start, cycle.end)
              : ""}
        </p>
        <p
          className={cn(
            "mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
            isFree
              ? "bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300"
              : "bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
          )}
        >
          {isFree
            ? `Withdrawals free until ${dayMonth(overview.freeUntil as Date)}`
            : `Withdrawals: ${WITHDRAWAL_RULES.expressFeePercent}% fee · free ${inDays(overview.nextFree.from, now)}`}
        </p>
      </div>
    </section>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-neutral-600 dark:text-neutral-400">{label}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "text-base font-bold" : "font-medium")}>{value}</dd>
    </div>
  );
}

function Upcoming({ title, when, note, highlight = false }: { title: string; when: string; note: string; highlight?: boolean }) {
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        {highlight && (
          <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">Now</span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-neutral-700 tabular-nums dark:text-neutral-300">{when}</p>
      <p className="mt-0.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{note}</p>
    </li>
  );
}
