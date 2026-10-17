import { cn } from "@/lib/utils";

/**
 * The Feenicks1 phoenix ("Phoenix Ascent"), drawn as inline SVG so each part
 * can move on its own (the same drawing as public/brand/phoenix-mark.svg).
 *
 *        ◆          ← head (gold)
 *   \\ \ ┃ / //     ← three beige feathers per wing
 *    \\\ ┃ ///
 *        ┃          ← body (gold), a flame that tapers to a point
 *
 * `animated` plays the splash sequence (globals.css, "Splash: the phoenix
 * rising"): the body rises like a flame, the head sparks, the wings unfold
 * feather by feather, a gold glow pulses and the bird lifts a little.
 * Without it (or with "reduce motion") the mark simply shows.
 *
 * `tone`: "dark" (default) for forest green or photo backgrounds, beige
 * wings; "light" for white backgrounds, forest green wings (beige would
 * vanish on white). The body and head stay gold in both.
 */

const WING_COLOUR = { dark: "#EFE6CF", light: "#0E3B2C" } as const;

/** One wing, drawn on the left; the right wing is the same, mirrored. */
const FEATHERS = [
  // Top feather: tall, curving up and out.
  "M97 120 C70 98 60 60 63 16 C78 40 93 62 99 86 Z",
  // Middle feather.
  "M97 126 C62 114 36 82 22 40 C50 56 80 72 99 92 Z",
  // Low feather: the widest reach.
  "M97 132 C58 136 28 120 8 92 C38 98 72 100 99 100 Z",
];

function Wing({ mirrored, colour }: { mirrored?: boolean; colour: string }) {
  return (
    <g fill={colour} transform={mirrored ? "translate(200 0) scale(-1 1)" : undefined}>
      {FEATHERS.map((d, index) => (
        <path key={index} className={`phoenix-feather phoenix-feather-${index + 1}`} d={d} />
      ))}
    </g>
  );
}

export function PhoenixMark({
  className,
  animated = false,
  label = "Feenicks1",
  tone = "dark",
}: {
  className?: string;
  animated?: boolean;
  tone?: keyof typeof WING_COLOUR;
  /** Read by screen readers; pass null when the name is announced elsewhere. */
  label?: string | null;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("phoenix overflow-visible", animated && "phoenix-rise", className)}
    >
      <g className="phoenix-lift">
        <Wing colour={WING_COLOUR[tone]} />
        <Wing mirrored colour={WING_COLOUR[tone]} />
        <path className="phoenix-body" fill="#C9A227" d="M100 50 L111 82 L104.5 138 L100 182 L95.5 138 L89 82 Z" />
        <path className="phoenix-head" fill="#C9A227" d="M100 30 L105.5 39 L100 48 L94.5 39 Z" />
      </g>
    </svg>
  );
}
