/**
 * PIN rules: the security PIN approves investments and withdrawals, so
 * easy-to-guess PINs are refused.
 *
 * Checked in the browser for instant feedback; the SERVER must apply the
 * same rules (and store the PIN only as a salted hash, never in plain text).
 */

/** Number of digits in the PIN (matches the design: 4 boxes). */
export const PIN_LENGTH = 4;

/**
 * The most commonly used 4-digit PINs (from published PIN-frequency
 * studies). Together they cover a large share of all real-world PINs,
 * so attackers try them first.
 */
const COMMON_PINS = new Set([
  "1234", "0000", "1111", "1212", "7777", "1004", "2000", "4444", "2222", "6969",
  "9999", "3333", "5555", "6666", "1122", "1313", "8888", "4321", "2001", "1010",
]);

/** True for runs like 1234, 3456, 9876, 6543 (each digit one up, or one down). */
function isSequential(pin: string) {
  const digits = [...pin].map(Number);
  const steps = digits.slice(1).map((digit, i) => digit - digits[i]);
  return steps.every((step) => step === 1) || steps.every((step) => step === -1);
}

/**
 * Parts of a birth date people often reuse as a PIN:
 * the year (1992), day+month (0405) and month+day (0504).
 */
function birthDatePins(dateOfBirth?: string): string[] {
  if (!dateOfBirth) return [];
  const [year, month, day] = dateOfBirth.split("-"); // YYYY-MM-DD
  return [year, `${day}${month}`, `${month}${day}`];
}

/**
 * Explains why a PIN is too easy to guess, or returns null if it's fine.
 * `dateOfBirth` (YYYY-MM-DD, from the profile) lets us refuse birthdays.
 */
export function getPinWeakness(pin: string, dateOfBirth?: string): string | null {
  if (/^(\d)\1+$/.test(pin)) return "Avoid repeating the same digit, like 1111.";
  if (isSequential(pin)) return "Avoid sequences like 1234 or 9876.";
  if (birthDatePins(dateOfBirth).includes(pin)) return "Avoid using your birth date or birth year.";
  if (COMMON_PINS.has(pin)) return "This PIN is too common. Choose one that's harder to guess.";
  return null;
}
