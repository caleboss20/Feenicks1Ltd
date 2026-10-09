import { periodLabel, type Statement } from "./statementModel";
import type { StatementMeta } from "./statementPdf";

/**
 * The statement as an Excel file (.xlsx), made on the phone. Four sheets,
 * with real numbers and dates (not text), so an investor or their
 * accountant can sort, filter and add them up:
 *
 *   Summary           who, which period, opening → closing, fees
 *   Transactions      date · reference · type · description · in · out · balance
 *   Returns           date · reference · portfolio · principal · rate · gross · fee · net
 *   Monthly           month · money in · returns · money out · closing balance
 *
 * write-excel-file loads only when a statement is downloaded or shared.
 */

const MONEY = "#,##0.00";
const DATE = "dd mmm yyyy hh:mm";

type Cell = { value?: string | number | Date; type?: StringConstructor | NumberConstructor | DateConstructor; format?: string; fontWeight?: "bold"; textColor?: string; backgroundColor?: string; align?: "left" | "right" };

const head = (titles: string[]): Cell[] =>
  titles.map((title) => ({ value: title, fontWeight: "bold", backgroundColor: "#E7F5ED", textColor: "#0F5132" }));
const num = (value: number | null): Cell => (value === null ? {} : { value, type: Number, format: MONEY });
const date = (value: Date): Cell => ({ value, type: Date, format: DATE });
const str = (value: string, bold = false): Cell => ({ value, type: String, ...(bold ? { fontWeight: "bold" as const } : {}) });

export async function statementExcel(statement: Statement, meta: StatementMeta): Promise<Blob> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const summary: Cell[][] = [
    [str("Feenicks1 account statement", true)],
    [],
    [str("Statement number"), str(meta.number)],
    [str("Issued"), date(meta.issuedAt)],
    [str("Investor"), str(meta.holderName)],
    [str("Phone"), str(meta.phone ?? "")],
    [str("Email"), str(meta.email)],
    [str("Wallet ID"), str(meta.walletId ?? "")],
    [str("Portfolio"), str(statement.portfolios.join(", "))],
    [str("Period"), str(periodLabel(statement.period))],
    [],
    head(["", "GHS"]),
    [str("Opening balance"), num(statement.openingBalance)],
    [str("+ Deposits"), num(statement.totals.deposits)],
    [str("+ Returns"), num(statement.totals.returns)],
    [str("+ Rewards"), num(statement.totals.rewards)],
    [str("- Withdrawals"), num(statement.totals.withdrawals)],
    [str("Closing balance", true), { ...num(statement.closingBalance), fontWeight: "bold" }],
    [],
    [str("Express withdrawal fees (included in withdrawals)"), num(statement.totals.expressFees)],
    [str("Management fees (taken before returns were paid)"), num(statement.totals.managementFees)],
    [
      str("Returns as % of money invested"),
      statement.returnPercent === null ? {} : { value: statement.returnPercent / 100, type: Number, format: "0.00%" },
    ],
    ...(statement.pendingCount > 0 ? [[str(`Pending transactions not included: ${statement.pendingCount}`)]] : []),
    [],
    [str("Completed transactions only. Investments carry risk; returns are not guaranteed.")],
  ];

  const transactions: Cell[][] = [
    head(["Date", "Reference", "Type", "Description", "Money in (GHS)", "Money out (GHS)", "Balance (GHS)"]),
    ...statement.lines.map((line) => [
      date(line.date),
      str(line.reference),
      str(line.kind),
      str(line.description),
      num(line.moneyIn || null),
      num(line.moneyOut || null),
      num(line.balance),
    ]),
  ];

  const returns: Cell[][] = [
    head(["Date", "Reference", "Portfolio", "Amount invested (GHS)", "Monthly rate (%)", "Months", "Gross (GHS)", "Fee (GHS)", "Net paid (GHS)"]),
    ...statement.returns.map((item) => [
      date(item.date),
      str(item.reference),
      str(item.portfolio),
      num(item.principal),
      item.ratePercent === null ? {} : { value: item.ratePercent, type: Number, format: "0.00" },
      item.months === null ? {} : { value: item.months, type: Number },
      num(item.gross),
      num(item.fee),
      num(item.net),
    ]),
  ];

  const monthly: Cell[][] = [
    head(["Month", "Money in (GHS)", "Returns (GHS)", "Money out (GHS)", "Closing balance (GHS)"]),
    ...statement.months.map((month) => [
      str(month.label),
      num(month.moneyIn),
      num(month.returns),
      num(month.moneyOut),
      num(month.closing),
    ]),
  ];

  return writeXlsxFile([
    { sheet: "Summary", data: summary, columns: [{ width: 48 }, { width: 30 }] },
    {
      sheet: "Transactions",
      data: transactions,
      columns: [{ width: 20 }, { width: 14 }, { width: 12 }, { width: 50 }, { width: 16 }, { width: 16 }, { width: 16 }],
      stickyRowsCount: 1,
    },
    {
      sheet: "Returns",
      data: returns,
      columns: [{ width: 20 }, { width: 14 }, { width: 24 }, { width: 20 }, { width: 16 }, { width: 8 }, { width: 14 }, { width: 12 }, { width: 16 }],
      stickyRowsCount: 1,
    },
    {
      sheet: "Monthly",
      data: monthly,
      columns: [{ width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 22 }],
      stickyRowsCount: 1,
    },
  ] as Parameters<typeof writeXlsxFile>[0]).toBlob();
}
