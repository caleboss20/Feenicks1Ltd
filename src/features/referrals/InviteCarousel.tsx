"use client";

/**
 * InviteCarousel: "Invite a friend" as swipeable photo cards, on the Account
 * screen (where the user's reference has its "Upgrade to Pro" card).
 * Swiping, dots and autoplay: the shared <Carousel>.
 *
 *   ╭──────────────────────────────────────╮
 *   │ Invite a friend          [  photo ]  │   ← photo on the right fades into
 *   │ Earn GH₵ 20 for every…   [        ]  │     a gradient picked from it
 *   │ ( Invite for free )            ▬ • • │
 *   ╰──────────────────────────────────────╯
 *
 * Three ways to invite: share the link, show the QR code, send on WhatsApp.
 * ⚠️ Confirm the licence of each photo (or replace it) before launch.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { Carousel } from "@/components/ui/Carousel";
import { ROUTES } from "@/config/routes";
import { REFERRAL_REWARD_LABEL, shareReferralLink, whatsAppInviteUrl } from "./referralService";

type InviteSlide = {
  id: string;
  title: string;
  text: string;
  image: string;
  /** Focus point of the photo, e.g. "50% 25%". */
  imagePosition: string;
  /**
   * Card colour: a gradient [left, right] picked from the photo (the
   * person's clothes), so photo and colour blend. The left colour sits behind
   * the white text: keep it deep enough for contrast.
   */
  colors: [string, string];
  action:
    | { label: string; href: string; external?: boolean }
    | { label: string; onClick: () => Promise<"done" | "copied"> };
};

export function InviteCarousel({ email }: { email: string }) {
  const slides: InviteSlide[] = [
    {
      id: "share",
      title: "Invite a friend",
      text: `Earn ${REFERRAL_REWARD_LABEL} for every friend who signs up.`,
      image: "/illustrations/invite-friend.jpg",
      imagePosition: "50% 25%",
      // Feenicks1 green.
      colors: ["#0c6236", "#23a05e"],
      action: {
        label: "Invite for free",
        onClick: async () => ((await shareReferralLink(email)) === "copied" ? "copied" : "done"),
      },
    },
    {
      id: "qr-code",
      title: "Show your QR code",
      text: "Friends scan it with their phone camera to sign up.",
      image: "/onboarding/start.jpg",
      imagePosition: "50% 20%",
      // Indigo violet, from the blue patterned apron and headwrap.
      colors: ["#3b2a8c", "#5b6bc9"],
      action: { label: "Show my code", href: ROUTES.refer },
    },
    {
      id: "whatsapp",
      title: "Share on WhatsApp",
      text: "Send your invite link to friends and family.",
      image: "/onboarding/peace-of-mind.jpg",
      imagePosition: "50% 45%",
      // Golden mustard, from her trousers.
      colors: ["#8a5a06", "#d19a1f"],
      action: { label: "Open WhatsApp", href: whatsAppInviteUrl(email), external: true },
    },
  ];

  return (
    <Carousel
      label="Invite friends"
      dotsClassName="right-5 bottom-4"
      dotsTone="white"
      slides={slides.map((slide) => ({ id: slide.id, content: <PhotoCard slide={slide} /> }))}
    />
  );
}

/** One card: text and button on the left, photo on the right fading into the card's colour. */
function PhotoCard({ slide }: { slide: InviteSlide }) {
  const [copied, setCopied] = useState(false);

  // Put the button back to its label after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const buttonClass =
    "mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold transition-opacity hover:opacity-90";
  // Button text in the card's colour.
  const buttonStyle = { color: slide.colors[0] };

  return (
    <div
      className="relative isolate h-[9.25rem] w-full overflow-hidden rounded-[1.75rem] text-white"
      style={{ backgroundImage: `linear-gradient(110deg, ${slide.colors[0]} 35%, ${slide.colors[1]})` }}
    >
      <Image
        src={slide.image}
        alt=""
        fill
        sizes="(min-width: 448px) 260px, 60vw"
        className="-z-10 left-auto! w-[58%]! object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)]"
        style={{ objectPosition: slide.imagePosition }}
      />

      <div className="flex h-full flex-col justify-center px-5">
        <h2 className="text-base leading-tight font-semibold">{slide.title}</h2>
        <p className="mt-1 max-w-[11rem] text-xs leading-snug text-white/85">{slide.text}</p>
        <div>
          {"href" in slide.action ? (
            <Link
              href={slide.action.href}
              {...(slide.action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={buttonClass}
              style={buttonStyle}
            >
              {slide.action.label}
            </Link>
          ) : (
            <button
              type="button"
              className={buttonClass}
              style={buttonStyle}
              onClick={async () => {
                if ("onClick" in slide.action && (await slide.action.onClick()) === "copied") {
                  setCopied(true);
                }
              }}
            >
              {copied ? (
                <>
                  <CheckIcon className="size-3.5" />
                  Link copied
                </>
              ) : (
                slide.action.label
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
