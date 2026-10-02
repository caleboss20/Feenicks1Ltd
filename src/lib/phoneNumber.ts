import { GHANA_CALLING_CODE } from "./maskContactDetails";

/**
 * A profile phone number (9 digits, without +233 or the leading 0), shown in
 * full on the owner's own screens: "241234567" → "+233 24 123 4567".
 * Null if there's no number (or it isn't 9 digits).
 */
export function formatGhanaPhone(localDigits: string | null | undefined): string | null {
  if (!localDigits || !/^\d{9}$/.test(localDigits)) return null;
  return `${GHANA_CALLING_CODE} ${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5)}`;
}
