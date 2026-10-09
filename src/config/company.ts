import { siteConfig } from "./site";

/**
 * Feenicks1 Solutions Ltd's official details, printed on statements and
 * proof of funds letters (letterhead and footers) and shown on the verify
 * page. One place, so the CEO's confirmed details replace them everywhere.
 *
 * Address and contacts: from the company's own portfolio guide (October
 * 2026). TODO(ceo): confirm them, and give the registered office address
 * and the Registrar-General's company registration number (the number
 * below is a placeholder).
 */
export const COMPANY = {
  legalName: "Feenicks1 Solutions Ltd",
  address: "Ridge, Accra, Ghana",
  /** Placeholder until the CEO confirms the registration number. */
  registrationNumber: "CS000000000",
  /**
   * Who licenses and supervises the company, and the licence number.
   * TODO(ceo): confirm (e.g. the Securities and Exchange Commission, Ghana).
   * Shown as "To be confirmed" until then: the app never claims a licence it
   * hasn't been given.
   */
  regulator: null as string | null,
  licenceNumber: null as string | null,
  phones: ["+233 54 572 8382", "+233 55 021 2623"],
  email: "feenicks1solutionsltd@gmail.com",
  website: siteConfig.url.replace(/^https?:\/\//, ""),
};

/** "Feenicks1 Solutions Ltd · Reg. No. CS000000000 · Ridge, Accra, Ghana". */
export const COMPANY_LINE = `${COMPANY.legalName} · Reg. No. ${COMPANY.registrationNumber} · ${COMPANY.address}`;

/** "+233 54 572 8382 · feenicks1solutionsltd@gmail.com". */
export const COMPANY_CONTACT_LINE = `${COMPANY.phones[0]} · ${COMPANY.email}`;
