"use client";

/**
 * InviteCarousel: "Invite a friend" as swipeable photo cards, on the Account
 * screen (where the user's reference has its "Upgrade to Pro" card).
 * Swiping, dots and autoplay: the shared <Carousel>.
 *
 *   ╭──────────────────────────────────────╮
 *   │ Invite a friend          [  photo ]  │   ← photo on the right fades into
 *   │ Earn 100 points (GH₵ 100)[        ]  │     a gradient picked from it
 *   │ ( Invite for free )            ▬ • • │
 *   ╰──────────────────────────────────────╯
 *
 * Three ways to invite (share the link, show the QR code, send on WhatsApp),
 * then a gold-coins card: "Invite friends and earn rewards".
 * ⚠️ Confirm the licence of each photo and the coin image (or replace them) before launch.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { Carousel } from "@/components/ui/Carousel";
import { ROUTES } from "@/config/routes";
import {
  REFERRAL_POINTS_LABEL,
  REFERRAL_REWARD_LABEL,
  shareReferralLink,
  whatsAppInviteUrl,
} from "./referralService";

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
      text: `Earn ${REFERRAL_POINTS_LABEL} (${REFERRAL_REWARD_LABEL}) for every friend who signs up.`,
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
      // On a soft dark pill, so the dots stay visible over photos and coins alike.
      dotsClassName="right-4 bottom-3 rounded-full bg-black/25 px-2 py-1.5"
      dotsTone="white"
      slides={[
        ...slides.map((slide) => ({ id: slide.id, content: <PhotoCard slide={slide} /> })),
        { id: "coins", content: <CoinCard email={email} /> },
      ]}
    />
  );
}

/**
 * The coin card's background, all CSS (no image): deep green behind the text
 * fading to mint and warm cream, with a golden glow behind the coins.
 */
const COIN_CARD_BACKGROUND = [
  "radial-gradient(55% 90% at 82% 45%, rgba(255, 221, 140, 0.55), transparent 70%)",
  "linear-gradient(115deg, #0b5a32 0%, #178a4f 42%, #6fbf95 70%, #e9e2bf 100%)",
].join(", ");

/** A fine grain over the gradient, like the reference (SVG noise, no image file). */
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * "Invite friends and earn rewards", with a stack of gold coins on the right
 * and the reward in a white pill (after the user's NeoCoin reference).
 * The whole card is one button: it shares the invite link.
 */
function CoinCard({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  // Put the pill back to the reward after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={`Invite friends: earn ${REFERRAL_POINTS_LABEL} (${REFERRAL_REWARD_LABEL}) for every friend who signs up`}
      onClick={async () => {
        if ((await shareReferralLink(email)) === "copied") setCopied(true);
      }}
      className="relative isolate h-[9.25rem] w-full cursor-pointer overflow-hidden rounded-[1.75rem] text-left text-white transition-opacity hover:opacity-95"
      style={{ backgroundImage: COIN_CARD_BACKGROUND }}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20 mix-blend-soft-light"
        style={{ backgroundImage: GRAIN_TEXTURE }}
      />
      {/* ⚠️ Confirm the licence of the coin image (or replace it) before launch. */}
      <Image
        src="/illustrations/gold-coins.png"
        alt=""
        width={400}
        height={340}
        sizes="180px"
        // A little smaller on narrow phones, so the reward pill stays clear of the coins.
        className="pointer-events-none absolute -right-1 -bottom-2 -z-10 h-auto w-[46%] min-[360px]:w-[52%] [filter:drop-shadow(0_10px_16px_rgba(0,0,0,0.18))]"
      />

      <span className="flex h-full max-w-[52%] flex-col justify-center pl-5">
        <span className="text-[0.9375rem] leading-snug font-semibold">
          Invite friends and earn rewards
        </span>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white py-1.5 pr-3.5 pl-1.5 text-[0.8125rem] font-semibold whitespace-nowrap text-neutral-900">
          {copied ? (
            <>
              <CheckIcon className="ml-1 size-4 text-brand-700" />
              Link copied
            </>
          ) : (
            <>
              <CoinIcon />
              {REFERRAL_POINTS_LABEL} per friend
            </>
          )}
        </span>
      </span>
    </button>
  );
}

/** A tiny gold coin (a point is worth GH₵ 1), for the reward pill. */
function CoinIcon() {
  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 text-[0.625rem] font-bold text-amber-900 ring-1 ring-amber-600/30 ring-inset"
    >
      ₵
    </span>
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
