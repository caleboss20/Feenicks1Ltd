/**
 * Hides most of an email address or phone number before showing it on
 * screen, e.g. "Code has been sent to and***ley@gmail.com". This is a
 * standard privacy measure: someone glancing at the screen can't read
 * the full contact details.
 */

/** "andrew.ainsley@gmail.com" → "and***ley@gmail.com" */
export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  // Short names only show their first letter, so there's something left to hide.
  const visible = name.length > 6 ? 3 : 1;
  const start = name.slice(0, visible);
  const end = name.length > 6 ? name.slice(-visible) : "";
  return `${start}***${end}@${domain}`;
}

/** "+233 24 123 4567" → "+233 *******67" (country code and last 2 digits stay visible) */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;

  const hasPlus = phone.trim().startsWith("+");
  const prefix = digits.slice(0, 3);
  const last = digits.slice(-2);
  const hidden = "*".repeat(digits.length - prefix.length - last.length);
  return `${hasPlus ? "+" : ""}${prefix} ${hidden}${last}`;
}
