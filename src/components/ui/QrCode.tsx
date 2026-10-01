"use client";

/**
 * QrCode: draws `value` as a QR code (crisp SVG, any size).
 *
 * The `qrcode` library only calculates the black/white squares; we draw
 * them ourselves as one SVG path, so no HTML is injected into the page.
 * Always black on white (with a white quiet zone), even in dark mode:
 * phone cameras read that most reliably.
 *
 * @example <QrCode value="otpauth://totp/…" label="QR code for your authenticator app" className="size-44" />
 */

import { useMemo } from "react";
import QRCode from "qrcode";

type QrCodeProps = {
  value: string;
  /** Read by screen readers, e.g. "QR code for your authenticator app". */
  label: string;
  className?: string;
};

/** White border around the code, in squares (scanners need a margin). */
const QUIET_ZONE = 2;

export function QrCode({ value, label, className }: QrCodeProps) {
  const { size, path } = useMemo(() => {
    // "M" error correction: survives a little glare or a scratched screen.
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    const squares: string[] = [];
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) {
          squares.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
        }
      }
    }
    return { size: modules.size + QUIET_ZONE * 2, path: squares.join("") };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={size} height={size} fill="white" />
      <path d={path} fill="black" />
    </svg>
  );
}
