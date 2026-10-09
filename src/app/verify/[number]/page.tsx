import type { Metadata, Viewport } from "next";
import { VerifyDocumentScreen } from "@/features/statements/VerifyDocumentScreen";

/**
 * Route: `/verify/:number` — opened by the QR code on a statement or proof of
 * funds letter, so a bank, embassy or landlord can check it. Public (no
 * login), but never indexed by search engines.
 */
export const metadata: Metadata = {
  title: "Verify a document",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ d?: string | string[] }>;
}) {
  const { number } = await params;
  const { d } = await searchParams;
  return <VerifyDocumentScreen number={decodeURIComponent(number)} encoded={typeof d === "string" ? d : null} />;
}
