import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Buttons: the app's primary call-to-action components.
 *
 * - <Button>      renders a real <button> (form submits, actions)
 * - <ButtonLink>  looks identical but navigates (wraps next/link)
 *
 * Always use ButtonLink for navigation, never <Button onClick={router.push}>.
 * Real links are crawlable, can be opened in a new tab, and prefetch the
 * next page automatically.
 *
 * @example <ButtonLink href={ROUTES.register}>Get started</ButtonLink>
 * @example <Button variant="secondary" type="submit">Save</Button>
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  // Fully rounded "pill" shape is the Feenicks1 button style across the app.
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[background-color,color,transform] duration-150 active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  /** Solid brand green: the main action on a screen (use once per screen). */
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  /** White with green text: the alternative action. Works on photos and on white. */
  secondary:
    "bg-white text-brand-700 ring-1 ring-black/5 ring-inset hover:bg-brand-50",
  /** Text-only: low-emphasis actions (e.g. "Skip"). */
  ghost: "text-current hover:bg-black/5",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  /** Large CTA: 60px thumb target on touch screens, a compact 52px on desktop. */
  lg: "h-15 px-7 text-lg lg:h-13 lg:px-6 lg:text-base",
};

type StyleProps = {
  variant?: Variant;
  size?: Size;
  /** Stretch to the full width of the parent. */
  fullWidth?: boolean;
};

function buttonClasses({ variant = "primary", size = "md", fullWidth }: StyleProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & StyleProps) {
  return (
    <button
      type={type}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: React.ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
