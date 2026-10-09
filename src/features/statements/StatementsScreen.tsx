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
 *   RECENT STATEMENTS   F1S-20261008-482913 …  ↓
 *   (   Share   ) (      Download      )               ← pinned to the bottom
 *
 * Every download issues a statement number (statementService), printed on
 * the file with a QR code. Files are made on the phone; nothing is uploaded.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
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
import type { StatementMeta } from "./statementPdf";
import { getIssuedStatements, issueStatement, type IssuedStatement } from "./statementService";

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

  /** Builds the file: a new statement number, or (re-download) the one issued before. */
  const makeFile = async (forPeriod: StatementPeriod, record?: IssuedStatement) => {
    const chosen = FORMATS.find((item) => item.id === format) ?? FORMATS[0];
    const issuedRecord = record ?? issueStatement(forPeriod);
    if (!record) setIssued(getIssuedStatements());
    const data = buildStatement(transactions, withdrawals, forPeriod);
    const meta = metaFor(issuedRecord.number, new Date(issuedRecord.issuedAt));
    const blob =
      chosen.id === "pdf"
        ? await (await import("./statementPdf")).statementPdf(data, meta)
        : await (await import("./statementExcel")).statementExcel(data, meta);
    return new File([blob], `Feenicks1-statement-${issuedRecord.number}.${chosen.extension}`, { type: chosen.mime });
  };

  const download = async (forPeriod: StatementPeriod, record?: IssuedStatement) => {
    setIsBusy(true);
    setStatus(null);
    try {
      const file = await makeFile(forPeriod, record);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus("Statement saved to your downloads.");
    } catch {
      setStatus("Couldn't make the statement. Please try again.");
    }
    setIsBusy(false);
  };

  const share = async () => {
    if (!period) return;
    setIsBusy(true);
    setStatus(null);
    try {
      const file = await makeFile(period);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name.replace(/\.\w+$/, "") });
      } else {
        // No file sharing here (e.g. a desktop browser): save it instead.
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setStatus("Sharing isn't available here, so the statement was saved to your downloads.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("Couldn't share the statement. Try Download instead.");
      }
    }
    setIsBusy(false);
  };

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

        {/* Recent statements: download any again (same number, today's figures for that period). */}
        {issued.length > 0 && (
          <section className="mt-7" aria-labelledby="statement-recent">
            <h2 id="statement-recent" className={LABEL}>
              Recent statements
            </h2>
            <ul className="mt-2 divide-y divide-neutral-200 dark:divide-white/10">
              {issued.slice(0, 5).map((record) => {
                const recordPeriod = { from: new Date(record.from), to: new Date(record.to) };
                return (
                  <li key={record.number} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tabular-nums">{record.number}</p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {periodLabel(recordPeriod)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void download(recordPeriod, record)}
                      aria-label={`Download ${record.number} again as ${format === "pdf" ? "PDF" : "Excel"}`}
                      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-white/10"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" />
                      </svg>
                    </button>
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
              onClick={() => void share()}
              disabled={isBusy || !statement}
              className={cn(button, "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15")}
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => period && void download(period)}
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
