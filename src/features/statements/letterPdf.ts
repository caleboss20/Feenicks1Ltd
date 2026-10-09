import { ghs } from "./statementModel";
import { BRAND, dateTime, HAIRLINE, imageData, INK, M, MUTED, PAGE_H, PAGE_W, PANEL, RIGHT, shortDate } from "./statementPdf";

/**
 * Proof of funds letter (A4, one page): a formal letter on Feenicks1
 * letterhead confirming the investor's balance as of a date, for a visa,
 * loan or other application. Made on the phone, nothing uploaded.
 *
 *   ████ Feenicks1 ████████████████████████ PROOF OF FUNDS ██
 *   8 October 2026                                    [QR]
 *   Ref: F1P-20261008-551204
 *   To: The Visa Officer, Embassy of …
 *   CONFIRMATION OF INVESTMENT ACCOUNT BALANCE
 *   This is to confirm that Kofi Mensah holds an investment account …
 *   ┌───────────────────────────────────────────┐
 *   │ Account holder      Kofi Mensah            │
 *   │ Wallet ID           F1 IC 4821 7365        │
 *   │ Balance as of 8 Oct GHS 2,012.10           │  ← bold
 *   └───────────────────────────────────────────┘
 *   Purpose · what the balance means · how to verify (ref + QR)
 *   Issued electronically by Feenicks1 Solutions Ltd …
 *
 * It isn't signed by a person: it says it was issued electronically, and
 * the reference and QR code identify it.
 * TODO(api): the server issues and digitally signs the letter, and the QR
 * code links to /verify/:number. TODO(ceo): the company's registered
 * address, registration number and contact details for the letterhead.
 */

export type LetterDetails = {
  number: string;
  issuedAt: Date;
  asOf: Date;
  balance: number;
  holderName: string;
  phone: string | null;
  email: string;
  walletId: string | null;
  portfolio: string;
  accountOpened: Date | null;
  addressedTo: string;
  purpose: string;
};

const longDate = (date: Date) => date.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" });

/** What the QR code holds: the letter's key facts. TODO(api): the /verify/:number link instead. */
export function letterQrText(letter: LetterDetails): string {
  return [
    "FEENICKS1 PROOF OF FUNDS",
    `Ref: ${letter.number}`,
    `Account holder: ${letter.holderName}`,
    letter.walletId ? `Wallet: ${letter.walletId}` : null,
    `Balance as of ${shortDate(letter.asOf)}: ${ghs(letter.balance)}`,
    `Issued: ${dateTime(letter.issuedAt)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function letterPdf(letter: LetterDetails): Promise<Blob> {
  const [{ jsPDF }, QRCode, logo] = await Promise.all([
    import("jspdf"),
    import("qrcode").then((module) => module.default),
    imageData("/brand/logo-wordmark.png"),
  ]);
  const qr = await QRCode.toDataURL(letterQrText(letter), { errorCorrectionLevel: "M", margin: 0, width: 360 });

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Feenicks1 proof of funds ${letter.number}`,
    subject: `Proof of funds for ${letter.holderName}`,
    author: "Feenicks1 Solutions Ltd",
    creator: "Feenicks1",
  });
  const font = (size: number, weight: "normal" | "bold" = "normal", color: [number, number, number] = INK) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const width = RIGHT - M;

  /* ── Letterhead ──────────────────────────────────────────────── */
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 30, "F");
  if (logo) doc.addImage(logo, "PNG", M, 10.5, 50, 50 * (121 / 680), "logo", "FAST");
  else {
    font(18, "bold", [255, 255, 255]);
    doc.text("Feenicks1", M, 18);
  }
  font(11, "bold", [255, 255, 255]);
  doc.text("PROOF OF FUNDS", RIGHT, 15, { align: "right" });
  font(8.5, "normal", [255, 255, 255]);
  doc.text("Feenicks1 Solutions Ltd · Accra, Ghana", RIGHT, 21, { align: "right" });

  /* ── Date, reference, addressee, QR ─────────────────────────── */
  const qrSize = 27;
  doc.addImage(qr, "PNG", RIGHT - qrSize, 40, qrSize, qrSize, "qr", "FAST");
  font(6.5, "normal", MUTED);
  doc.text("Scan for the letter details", RIGHT - qrSize / 2, 40 + qrSize + 3.5, { align: "center" });

  let y = 44;
  font(10);
  doc.text(longDate(letter.issuedAt), M, y);
  y += 6;
  font(9, "normal", MUTED);
  doc.text(`Ref: ${letter.number}`, M, y);
  y += 12;
  font(10);
  const to = doc.splitTextToSize(`To: ${letter.addressedTo}`, width - qrSize - 8) as string[];
  doc.text(to, M, y);
  y += to.length * 5 + 10;

  /* ── Subject and body ────────────────────────────────────────── */
  font(11, "bold");
  doc.text("CONFIRMATION OF INVESTMENT ACCOUNT BALANCE", M, y);
  y += 3;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.6);
  doc.line(M, y, M + 30, y);
  y += 9;

  const paragraph = (value: string, size = 10) => {
    font(size);
    const lines = doc.splitTextToSize(value, width) as string[];
    doc.text(lines, M, y, { lineHeightFactor: 1.45 });
    y += lines.length * size * 0.3528 * 1.45 + 4.5;
  };
  paragraph(
    `This is to confirm that ${letter.holderName}${letter.phone ? ` (phone ${letter.phone})` : ""} holds an investment account with Feenicks1 Solutions Ltd, an investment company in Accra, Ghana. The account details and balance are as follows:`,
  );

  /* ── Details panel ───────────────────────────────────────────── */
  const rows: [string, string, boolean?][] = [
    ["Account holder", letter.holderName],
    ["Email", letter.email],
    ["Wallet ID", letter.walletId ?? "-"],
    ["Portfolio", letter.portfolio],
    ["Account opened", letter.accountOpened ? longDate(letter.accountOpened) : "-"],
    [`Balance as of ${longDate(letter.asOf)}`, ghs(letter.balance), true],
  ];
  const panelH = rows.length * 8 + 6;
  doc.setFillColor(...PANEL);
  doc.roundedRect(M, y, width, panelH, 2.5, 2.5, "F");
  let ry = y + 9;
  rows.forEach(([label, value, isTotal], index) => {
    if (isTotal) {
      doc.setDrawColor(...HAIRLINE);
      doc.setLineWidth(0.25);
      doc.line(M + 6, ry - 5, RIGHT - 6, ry - 5);
    }
    font(isTotal ? 10.5 : 9.5, isTotal ? "bold" : "normal", isTotal ? INK : MUTED);
    doc.text(label, M + 6, ry);
    font(isTotal ? 11 : 9.5, "bold", isTotal ? BRAND : INK);
    doc.text(value, RIGHT - 6, ry, { align: "right" });
    ry += index === rows.length - 2 ? 9 : 8;
  });
  y += panelH + 9;

  paragraph(
    `The balance is the value of the account's completed transactions as of the date shown, in Ghana cedis (GHS). It does not include transactions still pending. The account is an investment account: its value can rise and fall, and returns are not guaranteed.`,
  );
  paragraph(`This letter is issued at the account holder's request for the purpose of: ${letter.purpose}.`);
  paragraph(
    `To confirm this letter is genuine, scan the QR code above or contact Feenicks1 Solutions Ltd quoting reference ${letter.number}.`,
  );

  y += 4;
  font(10);
  doc.text("Yours faithfully,", M, y);
  y += 12;
  font(10, "bold");
  doc.text("Feenicks1 Solutions Ltd", M, y);
  y += 5;
  font(8.5, "normal", MUTED);
  doc.text(`Issued electronically on ${dateTime(letter.issuedAt)}. Valid without a signature.`, M, y);

  /* ── Footer ──────────────────────────────────────────────────── */
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.25);
  doc.line(M, PAGE_H - 14, RIGHT, PAGE_H - 14);
  font(7, "normal", MUTED);
  doc.text("Feenicks1 Solutions Ltd · Accra, Ghana", M, PAGE_H - 9);
  doc.text(`Ref ${letter.number}`, RIGHT, PAGE_H - 9, { align: "right" });

  return doc.output("blob");
}
