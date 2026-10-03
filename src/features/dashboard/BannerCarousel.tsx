"use client";

/**
 * BannerCarousel: swipeable white cards on the dashboard, after the "Bill
 * negotiator" card in the user's reference. (Swiping, dots and autoplay:
 * the shared <Carousel>.)
 *
 *   ╭──────────────────────────────────────╮
 *   │ 🎁 Invite a friend            ▬ • •  │   ← dots: which card is showing
 *   │ ╭──────────────────────────────────╮ │
 *   │ │ Earn 100 points (GH₵ 100) for …  │ │   ← soft grey box with the message
 *   │ │ ╭──────────────────────────────╮ │ │
 *   │ │ │      Invite for free  →      │ │ │   ← full-width white button
 *   │ │ ╰──────────────────────────────╯ │ │
 *   │ ╰──────────────────────────────────╯ │
 *   ╰──────────────────────────────────────╯
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon } from "@/components/icons";
import { Carousel } from "@/components/ui/Carousel";

export type Banner = {
  id: string;
  /** Small icon before the title, shown in brand green. */
  icon: React.ReactNode;
  title: string;
  /** The message in the grey box. Wrap the key part in <strong> to highlight it. */
  text: React.ReactNode;
  /** The card's button: a link, or an action (e.g. sharing). */
  action: { label: string; href: string } | { label: string; onClick: () => Promise<"done" | "copied"> };
};

export function BannerCarousel({ banners, label }: { banners: Banner[]; label: string }) {
  return (
    <Carousel
      label={label}
      // Top-right of the card, level with its title.
      dotsClassName="top-[1.375rem] right-5"
      dotsTone="brand"
      slides={banners.map((banner) => ({ id: banner.id, content: <BannerCard banner={banner} /> }))}
    />
  );
}

/** One white card: icon and title, then a grey box with the message and a button. */
function BannerCard({ banner }: { banner: Banner }) {
  const [copied, setCopied] = useState(false);

  // Put the button back to its label after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const buttonClass =
    "group mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-background text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5";
  const arrow = <ArrowRight className="size-4" />;

  return (
    <div className="flex w-full flex-col rounded-3xl border border-neutral-200/80 bg-background p-2.5 dark:border-white/10">
      {/* Room on the right for the dots. */}
      <div className="flex items-center gap-2 px-2 pt-1 pr-16 pb-2.5">
        <span className="text-brand-600 dark:text-brand-400 [&_svg]:size-[18px]">{banner.icon}</span>
        <h2 className="truncate text-[0.8125rem] font-semibold">{banner.title}</h2>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl border border-neutral-100 bg-neutral-50 p-3.5 dark:border-white/5 dark:bg-white/5">
        <p className="flex-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white">
          {banner.text}
        </p>
        {"href" in banner.action ? (
          <Link href={banner.action.href} className={buttonClass}>
            {banner.action.label}
            {arrow}
          </Link>
        ) : (
          <button
            type="button"
            className={buttonClass}
            onClick={async () => {
              if ("onClick" in banner.action && (await banner.action.onClick()) === "copied") {
                setCopied(true);
              }
            }}
          >
            {copied ? (
              <>
                <CheckIcon className="size-4 text-brand-600" />
                Link copied
              </>
            ) : (
              <>
                {banner.action.label}
                {arrow}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
