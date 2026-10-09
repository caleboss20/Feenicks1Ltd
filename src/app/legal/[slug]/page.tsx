import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentScreen } from "@/features/legal/LegalScreens";
import { LEGAL_DOCUMENTS, legalDocument } from "@/features/legal/legalDocuments";

/** Route: `/legal/<slug>` — one legal document (terms, privacy, risk, fees, complaints). Public. */
export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: legalDocument(slug)?.title ?? "Legal", robots: { index: false, follow: false } };
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = legalDocument(slug);
  if (!document) notFound();
  return <LegalDocumentScreen document={document} />;
}
