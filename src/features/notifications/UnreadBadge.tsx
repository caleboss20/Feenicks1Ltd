import { cn } from "@/lib/utils";

/** Above this, the badge says "9+" (it stays small, like WhatsApp's). */
const MOST_SHOWN = 9;

/**
 * The red count on the notification bell: "1"…"9", then "9+". Nothing when
 * there's nothing new. Decorative: the bell's own label says how many.
 *
 * `className` places it and sets the ring around it, in the colour behind
 * the bell, so it stands out from the icon (e.g. "ring-neutral-100").
 */
export function UnreadBadge({
  count,
  className,
  style,
}: {
  count: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "absolute -top-0.5 -right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-red-500 px-1 text-[0.625rem] leading-none font-bold text-white tabular-nums ring-2",
        className,
      )}
    >
      {count > MOST_SHOWN ? `${MOST_SHOWN}+` : count}
    </span>
  );
}
