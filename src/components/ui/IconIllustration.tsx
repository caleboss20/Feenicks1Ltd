import { cn } from "@/lib/utils";

/**
 * IconIllustration: a large decorative badge (an icon inside soft green
 * circles), used as the picture at the top of simple screens such as
 * Forgot Password.
 *
 * It stands in for custom illustrations. When real illustration images
 * are ready, replace the <IconIllustration> on those screens with an <Image>.
 *
 * @example <IconIllustration icon={<KeyIcon />} />
 */
export function IconIllustration({
  icon,
  className,
}: {
  /** The icon to show in the middle; it's scaled up automatically. */
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid size-40 place-items-center rounded-full bg-brand-50 lg:size-28 dark:bg-brand-500/10",
        className,
      )}
    >
      <div className="grid size-3/4 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 [&_svg]:size-1/2 [&_svg]:stroke-[1.6]">
        {icon}
      </div>
    </div>
  );
}
