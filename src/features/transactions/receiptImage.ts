import { CEDI_SYMBOL, formatCedisNumber } from "@/lib/money";
import type { ReceiptDetails } from "./receiptDetails";

/**
 * The receipt as a PNG image, for Download and Share (e.g. to WhatsApp),
 * drawn on a <canvas> in the app's colours and font. No library, and
 * nothing leaves the phone: the image is made right here.
 *
 *   Feenicks1                       Transaction receipt
 *                    (✓)
 *               GH₵ 1,500.00
 *            Payment successful
 *     Invested in InvestWise Capital (IC)
 *          5 Oct 2026, at 3:45 PM
 *   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
 *   Investment details
 *   Package               InvestWise Capital (IC)
 *   …
 *   Feenicks1 Solutions Ltd · Ghana
 */

const WIDTH = 1080;
const PADDING = 88;
const ROW_HEIGHT = 72;

const COLORS = {
  page: "#ffffff",
  ink: "#171717",
  muted: "#737373",
  rule: "#d4d4d4",
  brand: "#13934f",
  brandSoft: "#e8f6ee",
};

/** The page's own font (Inter, loaded by next/font), so the image matches the app. */
function appFont(): string {
  return getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
}

/** How tall the image needs to be for these details. */
function heightFor(details: ReceiptDetails): number {
  const rows = details.sections.reduce((sum, section) => sum + section.rows.length, 0);
  return 760 + (details.packageLine ? 60 : 0) + details.sections.length * 150 + rows * ROW_HEIGHT + 120;
}

export async function receiptImage(details: ReceiptDetails): Promise<Blob> {
  await document.fonts?.ready;
  const height = heightFor(details);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available");
  const font = appFont();
  const text = (value: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  };

  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, WIDTH, height);

  // Header: the brand, and what this is.
  text("Feenicks1", PADDING, 130, 44, 700, COLORS.brand);
  text("Transaction receipt", WIDTH - PADDING, 130, 32, 500, COLORS.muted, "right");

  // The green tick.
  const cx = WIDTH / 2;
  const cy = 300;
  ctx.fillStyle = COLORS.brandSoft;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.brand;
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy + 2);
  ctx.lineTo(cx - 6, cy + 18);
  ctx.lineTo(cx + 24, cy - 16);
  ctx.stroke();

  // The amount, what happened, and when.
  text(`${CEDI_SYMBOL} ${formatCedisNumber(details.total, { exact: true })}`, cx, 480, 84, 700, COLORS.ink, "center");
  text(details.headline, cx, 552, 38, 600, COLORS.ink, "center");
  let y = 552;
  if (details.packageLine) {
    y += 60;
    text(details.packageLine, cx, y, 32, 600, COLORS.brand, "center");
  }
  text(details.when, cx, y + 54, 30, 400, COLORS.muted, "center");

  // The sections, each after a dashed rule (like the screen).
  y += 138;
  ctx.setLineDash([14, 12]);
  for (const section of details.sections) {
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(WIDTH - PADDING, y);
    ctx.stroke();
    y += 90;
    text(section.title, PADDING, y, 36, 700, COLORS.ink);
    y += 24;
    for (const row of section.rows) {
      y += ROW_HEIGHT;
      text(row.label, PADDING, y, 32, 400, COLORS.muted);
      text(row.value, WIDTH - PADDING, y, 32, row.isTotal ? 700 : 600, COLORS.ink, "right");
    }
    y += 36;
  }
  ctx.setLineDash([]);

  // Who issued it.
  text("Feenicks1 Solutions Ltd · Ghana", cx, height - 70, 26, 400, COLORS.muted, "center");

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't make the image"))), "image/png"),
  );
}
