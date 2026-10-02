"use client";

/**
 * Invite a friend: the user's referral QR code, opened from the scan button
 * on the dashboard. The friend points their phone camera at it and lands on
 * sign-up with the user's code already filled in (/sign-up?ref=F1ABC123).
 *
 *   ← Invite a friend
 *   Ask your friend to scan this code …
 *   ┌──────────────────────────────┐
 *   │          ▓▓ QR ▓▓            │   ← always dark on white, even in dark mode
 *   │      Your referral code      │
 *   │       F1ABC123  (⧉)          │   ← tap to copy
 *   └──────────────────────────────┘
 *   (🎁) Earn GH₵ 20 for every friend …
 *
 *   (      Share invite link      )   ← share sheet, or copies on desktop
 */

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, GiftIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { QrCode } from "@/components/ui/QrCode";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import {
  REFERRAL_REWARD_LABEL,
  referralCodeFor,
  referralLinkFor,
  shareReferralLink,
} from "./referralService";

/** How long "Copied" / "Link copied" shows before going back to normal. */
const COPIED_FEEDBACK_MS = 2000;

/** True for COPIED_FEEDBACK_MS after `show()` is called. */
function useBriefFlag() {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    if (!isOn) return;
    const timer = setTimeout(() => setIsOn(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [isOn]);
  return [isOn, () => setIsOn(true)] as const;
}

export function ReferScreen() {
  const current = useCurrentAccount();
  const [codeCopied, showCodeCopied] = useBriefFlag();
  const [linkCopied, showLinkCopied] = useBriefFlag();

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { email } = current.account;
  const code = referralCodeFor(email);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showCodeCopied();
    } catch {
      // Clipboard blocked: the code is on screen to read out instead.
    }
  };

  const shareLink = async () => {
    if ((await shareReferralLink(email)) === "copied") showLinkCopied();
  };

  return (
    <StepScreenLayout
      title="Invite a friend"
      backHref={ROUTES.dashboard}
      subtitle="Ask your friend to scan this code with their phone camera to sign up."
    >
      <section
        aria-label="Your referral QR code"
        className="flex flex-col items-center rounded-3xl border border-neutral-200/80 px-6 pt-7 pb-6 dark:border-white/10"
      >
        {/* White behind the code even in dark mode: cameras read dark-on-white best. */}
        <div className="rounded-2xl bg-white p-1.5">
          <QrCode
            value={referralLinkFor(email)}
            label="QR code with your referral link"
            className="size-52"
          />
        </div>

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">Your referral code</p>
        <div className="mt-1 flex items-center gap-1.5">
          <p className="text-2xl font-bold tracking-[0.12em]">{code}</p>
          <button
            type="button"
            onClick={copyCode}
            aria-label={codeCopied ? "Code copied" : "Copy referral code"}
            className="grid size-9 cursor-pointer place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {codeCopied ? (
              <CheckIcon className="size-[18px] text-brand-600" />
            ) : (
              <CopyIcon className="size-[18px]" />
            )}
          </button>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-3.5 rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand-600 dark:bg-white/10 dark:text-brand-400">
          <GiftIcon className="size-5" />
        </span>
        <p className="text-[0.8125rem] leading-relaxed text-brand-900 dark:text-brand-100">
          Earn <strong className="font-semibold">{REFERRAL_REWARD_LABEL}</strong> for every friend
          who signs up with your code.
        </p>
      </div>

      <div className={stepActionsClass}>
        <Button size="lg" fullWidth onClick={shareLink}>
          {linkCopied ? (
            <>
              <CheckIcon className="size-5" />
              Link copied
            </>
          ) : (
            "Share invite link"
          )}
        </Button>
      </div>
    </StepScreenLayout>
  );
}
