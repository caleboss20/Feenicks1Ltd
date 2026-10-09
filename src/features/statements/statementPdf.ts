import { COMPANY, COMPANY_CONTACT_LINE, COMPANY_LINE } from "@/config/company";
import { IS_DEMO_MODE } from "@/config/demoMode";
import { ghs, periodLabel, type Statement } from "./statementModel";
import { verifyUrl } from "./verifyLink";

/**
 * The statement as a PDF (A4), made on the phone: nothing is uploaded.
 * jsPDF and the QR library load only when a statement is downloaded or
 * shared, so they never slow the rest of the app.
 *
 *   ████ Feenicks1 ███████████████████████ ACCOUNT STATEMENT ██   ← brand green band
 *   Investor   Kofi Mensah        Wallet ID  F1 IC 4821 7365     [QR]
 *   Phone      024 123 4567       Portfolio  InvestWise Capital
 *   Email      kofi@…             Period     1 Jul – 8 Oct 2026
 *   ┌ Summary ───────────────┐ ┌ Portfolio value ─────────────┐
 *   │ Opening    GHS 1,000.00│ │        ___/‾‾‾‾\___/‾‾‾       │
 *   │ + Deposits …           │ │ ___/‾‾                         │
 *   │ = Closing  GHS 2,450.00│ └───────────────────────────────┘
 *   └────────────────────────┘
 *   Returns paid       Date · Reference · Portfolio · Gross · Fee · Net
 *   Monthly summary    Month · In · Returns · Out · Closing
 *   Transactions       Date · Reference · Type · Description · In · Out · Balance
 *   ─────────────────────────────────────────────────────────────
 *   Feenicks1 Solutions Ltd · Reg. No. … · Ridge, Accra        Page 1 of 2
 *   +233 54 572 8382 · email · website                   Statement F1S-…
 *
 * The QR code opens the verify page (verifyLink.ts). Demo data: a faint
 * "SPECIMEN" across every page (drawSpecimenMark).
 *
 * Amounts say "GHS" (the PDF's built-in fonts have no ₵ sign). No shadows:
 * structure comes from the green band, light panels and hairlines.
 */

export type StatementMeta = {
  number: string;
  issuedAt: Date;
  holderName: string;
  phone: string | null;
  email: string;
  walletId: string | null;
};

/** Page geometry and the brand palette, shared with the proof of funds letter (letterPdf.ts). */
export const PAGE_W = 210;
export const PAGE_H = 297;
export const M = 16; // margin, mm
export const RIGHT = PAGE_W - M;
export const BRAND: [number, number, number] = [19, 147, 79];
export const BRAND_LIGHT: [number, number, number] = [231, 245, 237];
export const INK: [number, number, number] = [17, 24, 39];
export const MUTED: [number, number, number] = [107, 114, 128];
export const HAIRLINE: [number, number, number] = [229, 231, 235];
export const PANEL: [number, number, number] = [246, 247, 248];

export const shortDate = (date: Date) => date.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
export const dateTime = (date: Date) =>
  `${shortDate(date)}, ${date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" })}`;
const money = (amount: number) => amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function imageData(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** The QR code: the verify page for this statement, carrying its key facts. */
export function statementQrText(statement: Statement, meta: StatementMeta): string {
  return verifyUrl({
    kind: "statement",
    number: meta.number,
    holder: meta.holderName,
    wallet: meta.walletId,
    period: periodLabel(statement.period),
    balance: ghs(statement.closingBalance),
    issued: dateTime(meta.issuedAt),
  });
}

/**
 * Demo data only: a faint diagonal "SPECIMEN" on every page, so a document
 * made from demo figures can't pass as a genuine statement or letter. Off
 * automatically when the app runs on real data (IS_DEMO_MODE false).
 */
export function drawSpecimenMark(doc: import("jspdf").jsPDF) {
  if (!IS_DEMO_MODE) return;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.saveGraphicsState();
    // GState is a constructor at runtime; its typings describe it as a method.
    const GState = doc.GState as unknown as new (options: { opacity: number }) => object;
    doc.setGState(new GState({ opacity: 0.07 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(96);
    doc.setTextColor(17, 24, 39);
    doc.text("SPECIMEN", PAGE_W / 2, PAGE_H / 2 + 20, { align: "center", angle: 35 });
    doc.restoreGraphicsState();
  }
}

/** The company footer on every page: who we are, how to reach us, and the document's reference and page. */
export function drawCompanyFooter(doc: import("jspdf").jsPDF, reference: string) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.25);
    doc.line(M, PAGE_H - 16, RIGHT, PAGE_H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(COMPANY_LINE, M, PAGE_H - 11.5);
    doc.text(`${COMPANY_CONTACT_LINE} · ${COMPANY.website}`, M, PAGE_H - 7.5);
    doc.text(pages > 1 ? `Page ${page} of ${pages}` : "", RIGHT, PAGE_H - 11.5, { align: "right" });
    doc.text(reference, RIGHT, PAGE_H - 7.5, { align: "right" });
  }
}


export async function statementPdf(statement: Statement, meta: StatementMeta): Promise<Blob> {
  const [{ jsPDF }, QRCode, logo] = await Promise.all([
    import("jspdf"),
    import("qrcode").then((module) => module.default),
    imageData("/brand/logo-wordmark.png"),
  ]);
  const qr = await QRCode.toDataURL(statementQrText(statement, meta), { errorCorrectionLevel: "M", margin: 0, width: 360 });

  // compress: keeps a two-page statement small enough to send on WhatsApp or email.
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Feenicks1 statement ${meta.number}`,
    subject: `Account statement, ${periodLabel(statement.period)}`,
    author: "Feenicks1 Solutions Ltd",
    creator: "Feenicks1",
  });

  const text = (value: string, x: number, y: number, options?: { align?: "left" | "right" | "center" }) =>
    doc.text(value, x, y, options);
  const font = (size: number, weight: "normal" | "bold" = "normal", color: [number, number, number] = INK) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const hairline = (y: number, x1 = M, x2 = RIGHT) => {
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.25);
    doc.line(x1, y, x2, y);
  };

  /* ── Header band ─────────────────────────────────────────────── */
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 30, "F");
  if (logo) doc.addImage(logo, "PNG", M, 10.5, 50, 50 * (121 / 680), "logo", "FAST");
  else {
    font(18, "bold", [255, 255, 255]);
    text("Feenicks1", M, 18);
  }
  font(11, "bold", [255, 255, 255]);
  text("ACCOUNT STATEMENT", RIGHT, 15, { align: "right" });
  font(8.5, "normal", [255, 255, 255]);
  text(`No. ${meta.number}`, RIGHT, 21, { align: "right" });

  /* ── Details and QR ──────────────────────────────────────────── */
  const field = (label: string, value: string, x: number, y: number) => {
    font(7.5, "normal", MUTED);
    text(label, x, y);
    font(9.5, "bold");
    text(value, x, y + 4.6);
  };
  let y = 41;
  field("Investor", meta.holderName, M, y);
  field("Wallet ID", meta.walletId ?? "-", 82, y);
  y += 12;
  field("Phone", meta.phone ?? "-", M, y);
  field("Portfolio", statement.portfolios.join(", ") || "-", 82, y);
  y += 12;
  field("Email", meta.email, M, y);
  field("Statement period", periodLabel(statement.period), 82, y);

  const qrSize = 27;
  doc.addImage(qr, "PNG", RIGHT - qrSize, 37, qrSize, qrSize, "qr", "FAST");
  font(6.5, "normal", MUTED);
  text("Scan to verify", RIGHT - qrSize / 2, 37 + qrSize + 3.5, { align: "center" });
  text(`Issued ${dateTime(meta.issuedAt)}`, RIGHT - qrSize / 2, 37 + qrSize + 7, { align: "center" });

  /* ── Summary panel ───────────────────────────────────────────── */
  y = 78;
  const panelH = 56;
  doc.setFillColor(...PANEL);
  doc.roundedRect(M, y, 84, panelH, 2.5, 2.5, "F");
  font(8, "bold", MUTED);
  text("SUMMARY", M + 5, y + 7);
  const rows: [string, number, boolean?][] = [
    ["Opening balance", statement.openingBalance],
    ["+ Deposits", statement.totals.deposits],
    ["+ Returns", statement.totals.returns],
    ["+ Rewards", statement.totals.rewards],
    ["- Withdrawals", statement.totals.withdrawals],
  ];
  let ry = y + 14;
  for (const [label, amount] of rows) {
    font(8.5, "normal");
    text(label, M + 5, ry);
    text(ghs(amount), M + 79, ry, { align: "right" });
    ry += 6;
  }
  hairline(ry - 2.5, M + 5, M + 79);
  font(9.5, "bold");
  text("Closing balance", M + 5, ry + 3);
  font(9.5, "bold", BRAND);
  text(ghs(statement.closingBalance), M + 79, ry + 3, { align: "right" });

  /* ── Chart panel: the value through the period (a step line) ── */
  const cx = M + 90;
  const cw = RIGHT - cx;
  doc.setFillColor(...PANEL);
  doc.roundedRect(cx, y, cw, panelH, 2.5, 2.5, "F");
  font(8, "bold", MUTED);
  text("PORTFOLIO VALUE", cx + 5, y + 7);
  if (statement.returnPercent !== null) {
    font(8, "bold", BRAND);
    text(`Returns ${statement.returnPercent.toFixed(2)}% of money invested`, cx + cw - 5, y + 7, { align: "right" });
  }
  const plot = { x: cx + 5, y: y + 13, w: cw - 10, h: panelH - 24 };
  const times = statement.series.map((point) => point.time);
  const values = statement.series.map((point) => point.value);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times, t0 + 1);
  const vMax = Math.max(...values, 1) * 1.1;
  const px = (time: number) => plot.x + ((time - t0) / (t1 - t0)) * plot.w;
  const py = (value: number) => plot.y + plot.h - (value / vMax) * plot.h;
  // Gridlines: 0, half, top.
  for (const fraction of [0, 0.5, 1]) {
    hairline(plot.y + plot.h * (1 - fraction), plot.x, plot.x + plot.w);
  }
  // Step path: flat until each change, then up or down.
  const points: [number, number][] = [];
  statement.series.forEach((point, index) => {
    if (index > 0) points.push([px(point.time), py(statement.series[index - 1].value)]);
    points.push([px(point.time), py(point.value)]);
  });
  if (points.length > 1) {
    const area: [number, number][] = [...points, [points[points.length - 1][0], plot.y + plot.h], [points[0][0], plot.y + plot.h]];
    doc.setFillColor(...BRAND_LIGHT);
    doc.lines(
      area.slice(1).map((point, index) => [point[0] - area[index][0], point[1] - area[index][1]]),
      area[0][0],
      area[0][1],
      [1, 1],
      "F",
      true,
    );
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.6);
    for (let index = 1; index < points.length; index += 1) {
      doc.line(points[index - 1][0], points[index - 1][1], points[index][0], points[index][1]);
    }
  }
  font(6.5, "normal", MUTED);
  text(`GHS ${money(vMax / 1.1)}`, plot.x, plot.y - 1.5);
  text(shortDate(statement.period.from), plot.x, plot.y + plot.h + 5);
  text(shortDate(statement.period.to), plot.x + plot.w, plot.y + plot.h + 5, { align: "right" });

  /* ── Notes under the panels ──────────────────────────────────── */
  y += panelH + 7;
  font(7.5, "normal", MUTED);
  const notes = [
    `Express withdrawal fees (included in withdrawals): ${ghs(statement.totals.expressFees)}.`,
    `Management fees (taken before returns were paid): ${ghs(statement.totals.managementFees)}.`,
    statement.pendingCount > 0
      ? `${statement.pendingCount} pending transaction${statement.pendingCount === 1 ? " is" : "s are"} not included until completed.`
      : null,
  ].filter(Boolean) as string[];
  for (const note of notes) {
    text(note, M, y);
    y += 4.2;
  }

  /* ── Tables ──────────────────────────────────────────────────── */
  type Column = { title: string; x: number; align?: "right"; width?: number };
  const bottom = PAGE_H - 24;
  const table = (title: string, columns: Column[], data: string[][], empty: string) => {
    const header = () => {
      doc.setFillColor(...BRAND_LIGHT);
      doc.rect(M, y, RIGHT - M, 7, "F");
      font(7.5, "bold", INK);
      for (const column of columns) text(column.title, column.x, y + 4.7, { align: column.align ?? "left" });
      y += 7;
    };
    if (y + 24 > bottom) {
      doc.addPage();
      y = M + 4;
    }
    y += 6;
    font(10.5, "bold");
    text(title, M, y);
    y += 4;
    header();
    if (data.length === 0) {
      font(8.5, "normal", MUTED);
      text(empty, M + 2, y + 6);
      y += 10;
      return;
    }
    const LINE = 3.6;
    data.forEach((row, rowIndex) => {
      font(8, "normal");
      // Each cell as up to two lines; the row is as tall as its tallest cell.
      const cells = row.map((cell, index) => {
        const width = columns[index].width;
        if (!width) return [cell];
        const lines = doc.splitTextToSize(cell, width) as string[];
        return lines.length > 2 ? [lines[0], `${lines[1].replace(/\s+\S*$/, "")}…`] : lines;
      });
      const rowH = 7 + (Math.max(...cells.map((lines) => lines.length)) - 1) * LINE;
      if (y + rowH > bottom) {
        doc.addPage();
        y = M + 4;
        header();
        font(8, "normal");
      }
      if (rowIndex % 2 === 1) {
        doc.setFillColor(...PANEL);
        doc.rect(M, y, RIGHT - M, rowH, "F");
      }
      cells.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          text(line, columns[index].x, y + 4.7 + lineIndex * LINE, { align: columns[index].align ?? "left" });
        });
      });
      y += rowH;
    });
  };

  if (statement.returns.length > 0) {
    table(
      "Returns paid",
      [
        { title: "Date", x: M + 2 },
        { title: "Reference", x: M + 26 },
        { title: "Portfolio", x: M + 50, width: 50 },
        { title: "Gross", x: 150, align: "right" },
        { title: "Fee", x: 170, align: "right" },
        { title: "Net (GHS)", x: RIGHT - 2, align: "right" },
      ],
      statement.returns.map((item) => [
        shortDate(item.date),
        item.reference,
        item.portfolio,
        item.gross === null ? "–" : money(item.gross),
        item.fee === null ? "–" : money(item.fee),
        money(item.net),
      ]),
      "",
    );
  }

  if (statement.months.length > 1) {
    table(
      "Monthly summary",
      [
        { title: "Month", x: M + 2 },
        { title: "Money in", x: 92, align: "right" },
        { title: "Returns", x: 124, align: "right" },
        { title: "Money out", x: 156, align: "right" },
        { title: "Closing (GHS)", x: RIGHT - 2, align: "right" },
      ],
      statement.months.map((month) => [
        month.label,
        money(month.moneyIn),
        money(month.returns),
        money(month.moneyOut),
        money(month.closing),
      ]),
      "",
    );
  }

  table(
    "Transactions",
    [
      { title: "Date", x: M + 2 },
      { title: "Reference", x: M + 25 },
      { title: "Type", x: M + 47 },
      { title: "Description", x: M + 67, width: 52 },
      { title: "In", x: 150, align: "right" },
      { title: "Out", x: 170, align: "right" },
      { title: "Balance", x: RIGHT - 2, align: "right" },
    ],
    statement.lines.map((line) => [
      shortDate(line.date),
      line.reference,
      line.kind,
      line.description,
      line.moneyIn ? money(line.moneyIn) : "",
      line.moneyOut ? money(line.moneyOut) : "",
      money(line.balance),
    ]),
    "No completed transactions in this period.",
  );

  /* ── Closing note ────────────────────────────────────────────── */
  if (y + 22 > bottom) {
    doc.addPage();
    y = M + 4;
  }
  y += 8;
  font(7, "normal", MUTED);
  const disclaimer =
    "This statement lists completed transactions only, as recorded by Feenicks1 at the time it was issued. " +
    "All amounts are in Ghana cedis (GHS). Investments carry risk: returns are not guaranteed, and past performance " +
    "does not indicate future results. Please check this statement and tell us within 30 days if anything looks wrong " +
    "(Account › Help & support in the app). The statement number and QR code identify this statement.";
  doc.text(doc.splitTextToSize(disclaimer, RIGHT - M) as string[], M, y);

  /* ── Footer on every page, and the demo specimen mark ────────── */
  drawCompanyFooter(doc, `Statement ${meta.number}`);
  drawSpecimenMark(doc);

  return doc.output("blob");
}
