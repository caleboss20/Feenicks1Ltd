"use client";

/**
 * Statements: the investor's account record for any period, as a PDF (to
 * read, print or send to a bank or embassy) or an Excel file (to work with
 * the numbers). Opened from Account › Statements, Home's Performance card
 * and Transactions.
 *
 *   ←                Statements
 *   Your account record for any period…
 *   PERIOD   (This month) (Last 3 months) (Last 6 months) (This year) (All time) (Custom)
 *   FORMAT   [ PDF ] [ Excel ]
 *   ╭──────────────────────────────────────────────╮
 *   │ 1 Jul – 8 Oct 2026                           │
 *   │ Closing balance   GH₵ 2,450.00                │   ← in-app preview: the same
 *   │  ___/‾‾‾‾‾\___/‾‾‾‾                           │     figures as the file
 *   │ Opening · Deposits · Returns · Withdrawals    │
 *   ╰──────────────────────────────────────────────╯
 *   MONTHLY STATEMENTS  September 2026 · Ready   ↓   ← every month that has ended
 *   PROOF OF FUNDS      [ Create letter ]              ← a formal balance letter (sheet)
 *   RECENT              F1S-20261008-482913 …  ↓
 *   (   Share   ) (      Download      )               ← pinned to the bottom
 *
 * Every download issues a statement number (statementService), printed on
 * the file with a QR code. Files are made on the phone; nothing is uploaded.
 */

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";
import { valueAt } from "@/features/analytics/portfolioHistory";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import { heldPackageIds } from "@/features/packages/packagePolicy";
import { useTransactions } from "@/features/transactions/useTransactions";
import { formatWalletId } from "@/features/wallets/walletModel";
import { useWallet } from "@/features/wallets/useWallet";
import type { WithdrawalRequest } from "@/features/withdraw/withdrawalModel";
import { getWithdrawals } from "@/features/withdraw/withdrawalService";
import { formatLocalNumber } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  buildStatement,
  isValidPeriod,
  periodFor,
  periodLabel,
  STATEMENT_PERIODS,
  type Statement,
  type StatementPeriod,
  type StatementPeriodId,
} from "./statementModel";
import type { LetterDetails } from "./letterPdf";
import type { StatementMeta } from "./statementPdf";
import {
  completedMonths,
  getIssuedStatements,
  issueLetter,
  issueStatement,
  type IssuedStatement,
} from "./statementService";

type Format = "pdf" | "excel";

const FORMATS: { id: Format; name: string; note: string; extension: string; mime: string }[] = [
  { id: "pdf", name: "PDF", note: "To read, print or send", extension: "pdf", mime: "application/pdf" },
  {
    id: "excel",
    name: "Excel",
    note: "To sort and add up",
    extension: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

const LABEL = "text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400";
const todayInput = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd, local

export function StatementsScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const transactions = useTransactions();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[] | null>(null);
  const [periodId, setPeriodId] = useState<StatementPeriodId>("last-3-months");
  const [custom, setCustom] = useState({ from: "", to: todayInput() });
  const [format, setFormat] = useState<Format>("pdf");
  const [issued, setIssued] = useState<IssuedStatement[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getWithdrawals().then((list) => {
      if (!cancelled) setWithdrawals(list);
    });
    const load = window.setTimeout(() => setIssued(getIssuedStatements()), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(load);
    };
  }, []);

  // Opened from "Your September statement is ready" (?month=2026-09): show that month.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("month");
    if (!key || !/^\d{4}-\d{2}$/.test(key)) return;
    const [year, month] = key.split("-").map(Number);
    const lastDay = String(new Date(year, month, 0).getDate()).padStart(2, "0");
    const apply = window.setTimeout(() => {
      setPeriodId("custom");
      setCustom({ from: `${key}-01`, to: `${key}-${lastDay}` });
    }, 0);
    return () => window.clearTimeout(apply);
  }, []);

  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const packageId = transactions ? (heldPackageIds(transactions)[0] ?? null) : null;
  const wallet = useWallet(packageId);

  const period = useMemo(
    () => (transactions ? periodFor(periodId, transactions, periodId === "custom" ? custom : null) : null),
    [transactions, periodId, custom],
  );
  const isPeriodValid = period !== null && isValidPeriod(period) && (periodId !== "custom" || custom.from !== "");
  const statement = useMemo(
    () => (transactions && withdrawals && period && isPeriodValid ? buildStatement(transactions, withdrawals, period) : null),
    [transactions, withdrawals, period, isPeriodValid],
  );

  const back = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.account));

  if (current.status !== "signed-in" || transactions === null || withdrawals === null) {
    return (
      <StepScreenLayout title="Statements" centeredTitle stickyHeader onBack={back}>
        <div className="grid flex-1 place-items-center py-20">
          <LoadingSpinner />
        </div>
      </StepScreenLayout>
    );
  }

  const hasActivity = transactions.some((item) => item.status === "completed");
  if (!hasActivity) {
    return (
      <StepScreenLayout title="Statements" centeredTitle stickyHeader onBack={back}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-bold tracking-tight">No statements yet</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Statements cover your investments, returns and withdrawals. They&apos;re available after your first
            investment.
          </p>
          <ButtonLink href={ROUTES.invest} size="lg" className="mt-6 h-13! px-10">
            Invest
          </ButtonLink>
        </div>
      </StepScreenLayout>
    );
  }

  const account = current.account;
  const metaFor = (number: string, issuedAt: Date): StatementMeta => ({
    number,
    issuedAt,
    holderName: account.fullName ?? account.email,
    phone: account.phone ? formatLocalNumber(account.phone) : null,
    email: account.email,
    walletId: wallet ? formatWalletId(wallet.id) : null,
  });

  /** A statement file: a new statement number, or (download again) the one issued before. */
  const makeStatementFile = async (
    forPeriod: StatementPeriod,
    record?: IssuedStatement,
    kind: "statement" | "monthly" = "statement",
  ) => {
    const chosen = FORMATS.find((item) => item.id === format) ?? FORMATS[0];
    const issuedRecord = record ?? issueStatement(forPeriod, kind);
    if (!record) setIssued(getIssuedStatements());
    const data = buildStatement(transactions, withdrawals, forPeriod);
    const meta = metaFor(issuedRecord.number, new Date(issuedRecord.issuedAt));
    const blob =
      chosen.id === "pdf"
        ? await (await import("./statementPdf")).statementPdf(data, meta)
        : await (await import("./statementExcel")).statementExcel(data, meta);
    return new File([blob], `Feenicks1-statement-${issuedRecord.number}.${chosen.extension}`, { type: chosen.mime });
  };

  const firstDeposit = transactions
    .filter((item) => item.type === "investment" && item.status === "completed")
    .reduce<Date | null>((earliest, item) => {
      const date = new Date(item.createdAt);
      return earliest === null || date < earliest ? date : earliest;
    }, null);
  /** The balance at the end of `date` (completed transactions only). */
  const balanceOn = (date: Date) =>
    valueAt(transactions, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime());

  /** A proof of funds letter (always a PDF): a new reference, or the one issued before. */
  const makeLetterFile = async (input: LetterInput, record?: IssuedStatement) => {
    const issuedRecord = record ?? issueLetter(input.asOf, input.addressedTo, input.purpose);
    if (!record) setIssued(getIssuedStatements());
    const meta = metaFor(issuedRecord.number, new Date(issuedRecord.issuedAt));
    const details: LetterDetails = {
      ...meta,
      asOf: input.asOf,
      balance: balanceOn(input.asOf),
      portfolio: heldPackageIds(transactions).map((id) => INVESTMENT_PACKAGES[id].name).join(", ") || "-",
      accountOpened: firstDeposit,
      addressedTo: input.addressedTo,
      purpose: input.purpose,
    };
    const blob = await (await import("./letterPdf")).letterPdf(details);
    return new File([blob], `Feenicks1-proof-of-funds-${issuedRecord.number}.pdf`, { type: "application/pdf" });
  };

  /** Makes the file, then saves it (download) or opens the phone's share sheet (share). */
  const deliver = async (make: () => Promise<File>, mode: "download" | "share", what: string) => {
    setIsBusy(true);
    setStatus(null);
    try {
      const file = await make();
      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name.replace(/\.\w+$/, "") });
      } else {
        saveFile(file);
        setStatus(
          mode === "share"
            ? `Sharing isn't available here, so the ${what} was saved to your downloads.`
            : `The ${what} was saved to your downloads.`,
        );
      }
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus(`Couldn't make the ${what}. Please try again.`);
      }
    }
    setIsBusy(false);
  };

  const months = completedMonths(transactions);

  const button =
    "flex h-13 flex-1 cursor-pointer items-center justify-center rounded-full text-[0.9375rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";

  return (
    <StepScreenLayout title="Statements" centeredTitle stickyHeader onBack={back}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Your account record for any period, with a statement number and QR code on every copy.
        </p>

        {/* Period */}
        <section className="mt-6" aria-labelledby="statement-period">
          <h2 id="statement-period" className={LABEL}>
            Period
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATEMENT_PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriodId(option.id)}
                aria-pressed={periodId === option.id}
                className={cn(
                  "h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors",
                  periodId === option.id
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-white/15 dark:text-neutral-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {periodId === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <DateField label="From" value={custom.from} max={custom.to || todayInput()} onChange={(from) => setCustom((value) => ({ ...value, from }))} />
              <DateField label="To" value={custom.to} min={custom.from} max={todayInput()} onChange={(to) => setCustom((value) => ({ ...value, to }))} />
            </div>
          )}
        </section>

        {/* Format */}
        <section className="mt-6" aria-labelledby="statement-format">
          <h2 id="statement-format" className={LABEL}>
            Format
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="statement-format">
            {FORMATS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={format === option.id}
                onClick={() => setFormat(option.id)}
                className={cn(
                  "cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors",
                  format === option.id
                    ? "border-brand-600 bg-brand-50/70 dark:bg-brand-500/10"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-white/15",
                )}
              >
                <span className="block text-[0.9375rem] font-semibold">{option.name}</span>
                <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{option.note}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="mt-6" aria-label="Statement preview">
          {statement ? (
            <StatementPreview statement={statement} />
          ) : (
            <p className="rounded-3xl border border-dashed border-neutral-300 px-5 py-8 text-center text-sm text-neutral-500 dark:border-white/15">
              Choose the start and end dates.
            </p>
          )}
        </section>

        {/* Monthly statements: every month that has ended is ready (announced on Home). */}
        <section className="mt-7" aria-labelledby="statement-monthly">
          <h2 id="statement-monthly" className={LABEL}>
            Monthly statements
          </h2>
          {months.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Your first monthly statement will be ready when this month ends.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200 dark:divide-white/10">
              {months.slice(0, 6).map((month) => (
                <li key={month.key} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{month.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Ready · the whole month</p>
                  </div>
                  <DownloadButton
                    label={`Download the ${month.label} statement as ${format === "pdf" ? "PDF" : "Excel"}`}
                    disabled={isBusy}
                    onClick={() =>
                      void deliver(() => makeStatementFile(month.period, undefined, "monthly"), "download", "statement")
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Proof of funds: a formal letter confirming the balance on a chosen date. */}
        <section className="mt-7 rounded-3xl bg-brand-50 p-5 dark:bg-brand-500/10" aria-labelledby="statement-letter">
          <h2 id="statement-letter" className="text-[0.9375rem] font-bold tracking-tight">
            Proof of funds letter
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            A formal letter on Feenicks1 letterhead confirming your balance on a date you choose, for a visa, loan or
            rental application.
          </p>
          <button
            type="button"
            onClick={() => setIsLetterOpen(true)}
            className="mt-4 h-11 cursor-pointer rounded-full bg-white px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-white/70 dark:bg-white/10 dark:text-brand-300 dark:hover:bg-white/15"
          >
            Create letter
          </button>
        </section>

        {/* Recent documents: download any again (same number, today's figures for that period). */}
        {issued.length > 0 && (
          <section className="mt-7" aria-labelledby="statement-recent">
            <h2 id="statement-recent" className={LABEL}>
              Recent
            </h2>
            <ul className="mt-2 divide-y divide-neutral-200 dark:divide-white/10">
              {issued.slice(0, 5).map((record) => {
                const recordPeriod = { from: new Date(record.from), to: new Date(record.to) };
                const isLetter = record.kind === "letter";
                const detail = isLetter
                  ? `Proof of funds · balance as of ${recordPeriod.to.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}`
                  : `${record.kind === "monthly" ? "Monthly statement" : "Statement"} · ${periodLabel(recordPeriod)}`;
                return (
                  <li key={record.number} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tabular-nums">{record.number}</p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{detail}</p>
                    </div>
                    <DownloadButton
                      label={`Download ${record.number} again${isLetter ? "" : ` as ${format === "pdf" ? "PDF" : "Excel"}`}`}
                      disabled={isBusy}
                      onClick={() =>
                        void (isLetter
                          ? deliver(
                              () =>
                                makeLetterFile(
                                  {
                                    asOf: recordPeriod.to,
                                    addressedTo: record.addressedTo ?? "To whom it may concern",
                                    purpose: record.purpose ?? "General",
                                  },
                                  record,
                                ),
                              "download",
                              "letter",
                            )
                          : deliver(() => makeStatementFile(recordPeriod, record), "download", "statement"))
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Pinned to the bottom of the phone screen: always in view. */}
        <div className={stickyActionsClass}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => period && void deliver(() => makeStatementFile(period), "share", "statement")}
              disabled={isBusy || !statement}
              className={cn(button, "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15")}
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => period && void deliver(() => makeStatementFile(period), "download", "statement")}
              disabled={isBusy || !statement}
              className={cn(button, "bg-brand-600 text-white hover:bg-brand-700")}
            >
              {isBusy ? "Preparing…" : `Download ${format === "pdf" ? "PDF" : "Excel"}`}
            </button>
          </div>
          <p role="status" className="mt-2 min-h-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {status}
          </p>
        </div>
      </div>

      {isLetterOpen && (
        <ProofOfFundsSheet
          onClose={() => setIsLetterOpen(false)}
          earliest={firstDeposit}
          balanceOn={balanceOn}
          isBusy={isBusy}
          status={status}
          onCreate={(input, mode) => void deliver(() => makeLetterFile(input), mode, "letter")}
        />
      )}
    </StepScreenLayout>
  );
}

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="date"
        value={value}
        min={min || undefined}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-[0.9375rem] focus:border-brand-600 focus:outline-none dark:border-white/15"
      />
    </label>
  );
}

/** The period at a glance: the same figures the file will carry. */
function StatementPreview({ statement }: { statement: Statement }) {
  const rows: [string, number][] = [
    ["Opening balance", statement.openingBalance],
    ["Deposits", statement.totals.deposits],
    ["Returns", statement.totals.returns],
    ...(statement.totals.rewards > 0 ? ([["Rewards", statement.totals.rewards]] as [string, number][]) : []),
    ["Withdrawals", -statement.totals.withdrawals],
  ];
  return (
    <div className="rounded-3xl border border-neutral-200 p-5 dark:border-white/10">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{periodLabel(statement.period)}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Closing balance</p>
        <p className="text-xl font-bold tracking-tight tabular-nums">{formatCedis(statement.closingBalance, { exact: true })}</p>
      </div>
      <MiniChart series={statement.series} />
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
            <dd className="font-medium tabular-nums">
              {amount < 0 ? "− " : ""}
              {formatCedis(Math.abs(amount), { exact: true })}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
        {statement.lines.length} transaction{statement.lines.length === 1 ? "" : "s"}
        {statement.returnPercent !== null && statement.totals.returns > 0
          ? ` · returns ${statement.returnPercent.toFixed(2)}% of money invested`
          : ""}
        {statement.pendingCount > 0 ? ` · ${statement.pendingCount} pending (not included)` : ""}
      </p>
    </div>
  );
}

/** The value through the period as a small step chart (same shape as the PDF's). */
function MiniChart({ series }: { series: { time: number; value: number }[] }) {
  const width = 300;
  const height = 64;
  const t0 = Math.min(...series.map((point) => point.time));
  const t1 = Math.max(...series.map((point) => point.time), t0 + 1);
  const vMax = Math.max(...series.map((point) => point.value), 1) * 1.1;
  const x = (time: number) => ((time - t0) / (t1 - t0)) * width;
  const y = (value: number) => height - (value / vMax) * height;
  let path = "";
  series.forEach((point, index) => {
    if (index === 0) path += `M${x(point.time)},${y(point.value)}`;
    else path += ` L${x(point.time)},${y(series[index - 1].value)} L${x(point.time)},${y(point.value)}`;
  });
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-3 h-16 w-full" aria-hidden>
      <path d={area} className="fill-brand-50 dark:fill-brand-500/15" />
      <path d={path} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-brand-600" />
    </svg>
  );
}

/** Saves a file to the phone's downloads. */
function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function DownloadButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" />
      </svg>
    </button>
  );
}

type LetterInput = { asOf: Date; addressedTo: string; purpose: string };

const PURPOSES = ["Visa application", "Loan application", "Rental application", "Other"];

/**
 * Proof of funds: who it's for, why, and the date of the balance, with the
 * balance shown live, then Share or Download (always a PDF).
 */
function ProofOfFundsSheet({
  onClose,
  earliest,
  balanceOn,
  isBusy,
  status,
  onCreate,
}: {
  onClose: () => void;
  earliest: Date | null;
  balanceOn: (date: Date) => number;
  isBusy: boolean;
  status: string | null;
  onCreate: (input: LetterInput, mode: "download" | "share") => void;
}) {
  const titleId = useId();
  const [addressedTo, setAddressedTo] = useState("");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [otherPurpose, setOtherPurpose] = useState("");
  const [asOf, setAsOf] = useState(todayInput());
  const asOfDate = asOf ? new Date(`${asOf}T12:00`) : null;
  const finalPurpose = purpose === "Other" ? otherPurpose.trim() : purpose;
  const isReady = asOfDate !== null && !Number.isNaN(asOfDate.getTime()) && finalPurpose.length > 0;
  const input = (): LetterInput => ({
    asOf: asOfDate ?? new Date(),
    addressedTo: addressedTo.trim() || "To whom it may concern",
    purpose: finalPurpose,
  });
  const button =
    "flex h-13 flex-1 cursor-pointer items-center justify-center rounded-full text-[0.9375rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <BottomSheet open onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="text-lg font-bold tracking-tight">
        Proof of funds letter
      </h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        A one-page letter confirming your balance, with a reference and QR code.
      </p>

      <label className="mt-5 block">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Addressed to</span>
        <input
          type="text"
          value={addressedTo}
          onChange={(event) => setAddressedTo(event.target.value)}
          placeholder="To whom it may concern"
          maxLength={120}
          className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-[0.9375rem] focus:border-brand-600 focus:outline-none dark:border-white/15"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Purpose</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PURPOSES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={purpose === option}
              onClick={() => setPurpose(option)}
              className={cn(
                "h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors",
                purpose === option
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-200 text-neutral-700 dark:border-white/15 dark:text-neutral-300",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {purpose === "Other" && (
          <input
            type="text"
            value={otherPurpose}
            onChange={(event) => setOtherPurpose(event.target.value)}
            placeholder="e.g. School fees application"
            maxLength={80}
            aria-label="Purpose"
            className="mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-[0.9375rem] focus:border-brand-600 focus:outline-none dark:border-white/15"
          />
        )}
      </fieldset>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
        <DateField
          label="Balance as of"
          value={asOf}
          min={earliest ? earliest.toLocaleDateString("en-CA") : undefined}
          max={todayInput()}
          onChange={setAsOf}
        />
        <p className="pb-3 text-right text-[0.9375rem] font-bold tabular-nums">
          {asOfDate && !Number.isNaN(asOfDate.getTime()) ? formatCedis(balanceOn(asOfDate), { exact: true }) : "–"}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={isBusy || !isReady}
          onClick={() => onCreate(input(), "share")}
          className={cn(button, "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15")}
        >
          Share
        </button>
        <button
          type="button"
          disabled={isBusy || !isReady}
          onClick={() => onCreate(input(), "download")}
          className={cn(button, "bg-brand-600 text-white hover:bg-brand-700")}
        >
          {isBusy ? "Preparing…" : "Download PDF"}
        </button>
      </div>
      <p role="status" className="mt-2 min-h-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {status}
      </p>
    </BottomSheet>
  );
}
