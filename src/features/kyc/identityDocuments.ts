/**
 * Who can sign up, and which ID documents each person can use.
 *
 * BUSINESS RULES (confirm any change with compliance):
 *   1. Feenicks1 is licensed in Ghana and, at launch, serves ONLY people who
 *      live in Ghana. Country of residence is therefore fixed to Ghana.
 *   2. Nationality can be any country (foreigners living in Ghana are welcome).
 *   3. Accepted ID depends on nationality:
 *        Ghanaian citizens → Ghana Card (recommended), Driver's Licence or Passport
 *        Everyone else     → Passport (pre-selected) or Non-Citizen Ghana Card
 *                            (issued by the NIA to foreigners living in Ghana)
 *
 *      ⚠️ COMPLIANCE CHECK: the Bank of Ghana (2022) made the Ghana Card the
 *      primary ID for financial services. Confirm with compliance that our
 *      SEC licence allows Ghanaians to verify with a Driver's Licence or
 *      Passport. If not, edit getAcceptedDocuments() below; nothing else changes.
 *
 * Content lives here, separate from the screen, so the rules can change
 * without touching the UI. Codes/ids are what gets saved (keep them stable);
 * names/labels are what users see (safe to change).
 */

/** The only country we operate in (ISO 3166 code). */
export const RESIDENCE_COUNTRY_CODE = "GH";

/** Default nationality: most of our users are Ghanaian. */
export const DEFAULT_NATIONALITY = "GH";

/** Every ISO 3166-1 country code (alpha-2). */
const ALL_COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO " +
  "BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK " +
  "DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ " +
  "GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM " +
  "KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO " +
  "MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH " +
  "PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR " +
  "SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE " +
  "VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ");

/** Country names in English, from the browser/Node's built-in data. */
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export type CountryCode = string;

export const getCountryName = (code: CountryCode) => countryNames.of(code) ?? code;

/** All countries for the nationality picker: Ghana first, then A–Z. */
export const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: "GH", name: getCountryName("GH") },
  ...ALL_COUNTRY_CODES.filter((code) => code !== "GH")
    .map((code) => ({ code, name: getCountryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name)),
];

/* ── ID documents ───────────────────────────────────────────────────────── */

export const IDENTITY_DOCUMENTS = {
  "ghana-card": {
    label: "Ghana Card",
    hint: "National ID (recommended)",
  },
  "drivers-licence": {
    label: "Driver's Licence",
    hint: "Valid DVLA licence",
  },
  // Official name "Non-Citizen Ghana Card": issued by the NIA to foreigners
  // who live in Ghana legally. Labelled so it's clearly a Ghana Card variant.
  "non-citizen-ghana-card": {
    label: "Ghana Card (Non-Citizen)",
    hint: "For foreigners living in Ghana, issued by the NIA",
  },
  passport: {
    label: "Passport",
    hint: "Valid international passport",
  },
} as const;

export type IdentityDocumentId = keyof typeof IDENTITY_DOCUMENTS;

/* ── Sides to photograph ────────────────────────────────────────────────── */

export type DocumentSide = {
  id: "front" | "back" | "photo-page";
  /** Short name for the step chips, e.g. "Front". */
  shortLabel: string;
  /** Used in "Upload {label}" and "Scanning {label}…". */
  label: string;
};

const CARD_SIDES: DocumentSide[] = [
  { id: "front", shortLabel: "Front", label: "front of your card" },
  { id: "back", shortLabel: "Back", label: "back of your card" },
];

/** Cards have two sides to capture; a passport only its photo page. */
export function getDocumentSides(document: IdentityDocumentId): DocumentSide[] {
  return document === "passport"
    ? [{ id: "photo-page", shortLabel: "Photo page", label: "your passport photo page" }]
    : CARD_SIDES;
}

/** Which documents a person can verify with, based on their nationality. */
export function getAcceptedDocuments(nationality: CountryCode): IdentityDocumentId[] {
  // Listed in the order shown on screen; the first one is pre-selected.
  return nationality === "GH"
    ? ["ghana-card", "drivers-licence", "passport"]
    : // Foreigners: passport first (everyone has one); the NIA card is an option.
      ["passport", "non-citizen-ghana-card"];
}
