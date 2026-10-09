"use client";

/**
 * KYC finish: "You're all set" celebration, between the profile and the PIN.
 *
 *   ┌────────────────────────────┐
 *   │ [ photo: woman or man,     │  ← chosen by the gender on the profile
 *   │   matching the profile ]   │
 *   ╞════════════════════════════╡  ← white sheet slides up over the photo
 *   │          ( ✓ )             │  ← ring draws itself, tick draws in, confetti
 *   │  You're all set, Kwame! 🎉 │  ← first name from the profile
 *   │  ✓ Email verified          │  ← ticks appear one by one
 *   │  ✓ Ghana Card scanned      │
 *   │  ✓ Selfie matched          │
 *   │  ✓ Profile completed       │
 *   │  ⏱ We're reviewing your…   │  ← honest: the final check is still running
 *   │ (   Secure my account →  ) │  ← next: create a PIN
 *   └────────────────────────────┘
 *
 * Desktop: photo on the left as a rounded card, celebration on the right.
 * Tone: celebrate what they've done, but don't claim the account is fully
 * approved; documents are still being reviewed on the server.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckIcon, ClockIcon } from "@/components/icons";
import { AnimatedCheck } from "@/components/ui/AnimatedCheck";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { ROUTES } from "@/config/routes";
import { IDENTITY_DOCUMENTS } from "./identityDocuments";
import { useKycStore } from "./useKycStore";

/** Where "Secure my account" leads: creating the security PIN. */
const NEXT_SCREEN = ROUTES.createPin;

/**
 * Photo shown at the top, matched to the gender given on "Fill Your Profile".
 * Replace the files to change them (portrait, subject in the upper half).
 * ⚠️ all-set-male.jpg is a watermarked Rawpixel preview: replace it with
 * the licensed version before launch.
 */
const PHOTOS = {
  female: {
    src: "/illustrations/all-set-female.jpg",
    alt: "Smiling woman checking her phone",
    focus: "52% 20%",
  },
  male: {
    src: "/illustrations/all-set-male.jpg",
    alt: "Smiling man in a blazer looking at his phone",
    focus: "40% 30%",
  },
} as const;

export function AllSetScreen() {
  const router = useRouter();
  const profile = useKycStore((s) => s.profile);
  const document = useKycStore((s) => s.identityDocument);
  const [isContinuing, setIsContinuing] = useState(false);

  // Only reachable after the profile is filled in (e.g. not after a refresh).
  useEffect(() => {
    if (!profile) router.replace(ROUTES.kycProfile);
  }, [profile, router]);

  if (!profile) return null;

  const firstName = profile.fullName.split(/\s+/)[0];
  const photo = PHOTOS[profile.gender];
  const documentLabel = document ? IDENTITY_DOCUMENTS[document].label : "ID document";

  const completedSteps = [
    "Email verified",
    `${documentLabel} scanned`,
    "Selfie matched",
    "Profile completed",
  ];

  return (
    <main className="flex min-h-dvh flex-col bg-background lg:grid lg:h-dvh lg:grid-cols-2">
      {/* ── Photo: top of the screen on phones, rounded card on desktop ── */}
      <div className="relative h-[33dvh] shrink-0 lg:m-5 lg:h-auto lg:overflow-hidden lg:rounded-[2rem]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: photo.focus }}
        />
      </div>

      {/* ── The white sheet, sliding up over the bottom of the photo ── */}
      <section className="relative z-10 -mt-8 flex flex-1 animate-sheet-up flex-col rounded-t-[2rem] bg-background px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] motion-reduce:animate-none sm:px-10 lg:mt-0 lg:justify-center lg:rounded-none lg:px-16">
        <Confetti className="h-64" />

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">
          <div className="flex flex-col items-center text-center">
            <AnimatedCheck className="size-16" />
            <h1 className="mt-3 text-[1.625rem] leading-tight font-bold lg:text-2xl">
              You&apos;re all set, {firstName}! 🎉
            </h1>
            <p className="mt-1.5 text-[0.9375rem] text-neutral-600 lg:text-sm dark:text-neutral-400">
              Thanks for completing your verification.
            </p>
          </div>

          {/* Everything they've done, ticking in one by one. */}
          <ul className="mt-5 flex flex-col gap-2 rounded-2xl bg-neutral-50 p-3.5 lg:mt-5 dark:bg-white/5">
            {completedSteps.map((step, i) => (
              <li
                key={step}
                className="flex animate-fade-up items-center gap-3 text-[0.9375rem] font-medium motion-reduce:animate-none lg:text-sm"
                style={{ animationDelay: `${0.9 + i * 0.15}s` }}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
                  <CheckIcon className="size-3.5 stroke-3" />
                </span>
                {step}
              </li>
            ))}
          </ul>

          {/* Honest status: the final check happens on our side. */}
          <p className="mt-3 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-3.5 text-left text-sm leading-relaxed text-brand-900 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
            <ClockIcon className="mt-0.5 size-5 text-brand-700" />
            <span>
              We&apos;re reviewing your documents. This usually takes a few minutes, and
              we&apos;ll let you know when it&apos;s done.
            </span>
          </p>

          <div className="mt-auto pt-5 lg:mt-8 lg:pt-0">
            <Button
              size="lg"
              fullWidth
              isLoading={isContinuing}
              loadingLabel="Continuing"
              onClick={() => {
                setIsContinuing(true);
                router.push(NEXT_SCREEN);
              }}
            >
              Secure my account
              <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
