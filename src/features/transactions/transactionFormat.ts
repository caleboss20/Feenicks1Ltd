/**
 * How transactions are written, shared by the Transactions list and the
 * dashboard's Recent activity, so dates read the same everywhere.
 */

/** "Today, 1:23 pm" · "Yesterday, 9:00 am" · "20 Oct, 2:23 pm" · "20 Oct 2025, 2:23 pm". */
export function formatWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  return `${day}, ${time}`;
}
