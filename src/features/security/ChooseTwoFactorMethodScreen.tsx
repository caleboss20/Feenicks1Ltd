"use client";

/**
 * Two-factor authentication (2FA): offered right after the PIN is created.
 * The user picks HOW they'll prove it's them, or skips for now.
 *
 *              ⠿⠿[📱🛡]⠿⠿                ← phone with a shield, dotted circle
 *
 *   Protect your account                 ← bold title (left-aligned)
 *   in two steps
 *   Choose how you'll confirm it's you…  ← faint text
 *
 *   ┌──────────────────────────────┐
 *   │ (👆) Fingerprint / Face ID ◉ │     ← preselected when the device has it
 *   ├──────────────────────────────┤
 *   │ (💬) SMS code             ○ │     ← codes to +233 *******67
 *   ├──────────────────────────────┤
 *   │ (📱) Authenticator app    ○ │     ← Google Authenticator, Authy…
 *   └──────────────────────────────┘
 *   (           Continue           )
 *            Skip for now
 *
 * Methods:
 *   biometric          the phone's own fingerprint / face unlock (WebAuthn passkey).
 *                      Shown greyed out when the device doesn't support it.
 *   sms                6-digit code texted to the phone on the profile.
 *   authenticator-app  6-digit code from an app, set up by scanning a QR code.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatorAppIcon, FingerprintIcon, MessageIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { useKycStore } from "@/features/kyc/useKycStore";
import { maskPhone } from "@/lib/maskContactDetails";
import { cn } from "@/lib/utils";
import { registerBiometric, sendTwoFactorSetupCode, type SecurityResult } from "./securityService";
import { useBiometricSupport } from "./useBiometricSupport";

type TwoFactorMethod = "biometric" | "sms" | "authenticator-app";

/**
 * Where each choice leads.
 * TODO(security): point each method at its own setup screen once built
 *   (biometric → success, sms → "Verify your phone", app → QR code).
 * TODO(dashboard): SKIP → the dashboard once built.
 */
const NEXT_SCREEN: Record<TwoFactorMethod, string> = {
  biometric: ROUTES.login,
  sms: ROUTES.login,
  "authenticator-app": ROUTES.login,
};
const NEXT_SCREEN_SKIP = ROUTES.login;

/** Ghana's country calling code; profile numbers are stored without it. */
const GHANA_CALLING_CODE = "+233";

export function ChooseTwoFactorMethodScreen() {
  const router = useRouter();
  // The phone number from "Fill Your Profile" (9 digits, no leading 0).
  const phone = useKycStore((s) => s.profile?.phone);
  const hasBiometrics = useBiometricSupport();
  const [chosen, setChosen] = useState<TwoFactorMethod | null>(null);
  const [action, setAction] = useState<"continue" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Until the user picks, preselect the most convenient method the device has.
  const selected: TwoFactorMethod = chosen ?? (hasBiometrics ? "biometric" : "sms");

  // Masked so someone glancing at the screen can't read the full number.
  const maskedPhone = phone ? maskPhone(`${GHANA_CALLING_CODE}${phone}`) : "your phone";

  const methods: {
    id: TwoFactorMethod;
    title: string;
    description: string;
    icon: React.ReactNode;
    unavailable?: boolean;
  }[] = [
    {
      id: "biometric",
      title: "Fingerprint / Face ID",
      description:
        hasBiometrics === false ? "Not on this device" : "Use your phone's own unlock",
      icon: <FingerprintIcon />,
      unavailable: hasBiometrics === false,
    },
    { id: "sms", title: "SMS code", description: `Codes sent to ${maskedPhone}`, icon: <MessageIcon /> },
    {
      id: "authenticator-app",
      title: "Authenticator app",
      description: "Google Authenticator or Authy",
      icon: <AuthenticatorAppIcon />,
    },
  ];

  const handleContinue = async () => {
    setError(null);
    setAction("continue");

    // The app method is set up on its own screen (QR code), so no call is needed here.
    let result: SecurityResult = { ok: true };
    if (selected === "biometric") result = await registerBiometric();
    if (selected === "sms") result = await sendTwoFactorSetupCode();

    if (!result.ok) {
      setAction(null);
      setError(result.message);
      return;
    }
    router.push(NEXT_SCREEN[selected]);
  };

  const handleSkip = () => {
    setAction("skip");
    // replace: Back shouldn't return here once they've decided.
    router.replace(NEXT_SCREEN_SKIP);
  };

  return (
    // Same column as StepScreenLayout, but the title sits under the picture
    // (no header row): there's no previous step to go back to once the PIN is set.
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-8 lg:max-w-sm">
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* Short phones (≤ 700px tall, e.g. 320×640): smaller picture and
            tighter spacing, so everything fits without scrolling. */}
        <PhoneShieldIllustration className="mx-auto w-32 lg:w-28 [@media(max-height:700px)]:w-22" />

        <h1 className="mt-8 text-[1.625rem] leading-tight font-bold tracking-tight lg:mt-6 lg:text-2xl [@media(max-height:700px)]:mt-5 [@media(max-height:700px)]:text-[1.375rem]">
          Protect your account in two steps
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm [@media(max-height:700px)]:text-sm dark:text-neutral-400">
          Choose how you&apos;ll confirm it&apos;s you when you log in or withdraw money.
        </p>

        {/* Radio group styled as cards. The real radio is visually hidden;
            the card reacts to it with `has-checked:` / `peer-checked:`. */}
        <fieldset className="mt-6 flex min-w-0 flex-col gap-3 lg:mt-5 [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:gap-2">
          <legend className="sr-only">Verification method</legend>
          {methods.map((method) => (
            <label
              key={method.id}
              className={cn(
                "flex items-center gap-3.5 rounded-2xl border border-neutral-200 p-3.5 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50/50 has-focus-visible:border-brand-400 dark:border-white/10 dark:has-checked:bg-brand-500/10 [@media(max-height:700px)]:p-3",
                method.unavailable
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-neutral-300",
              )}
            >
              <input
                type="radio"
                name="two-factor-method"
                value={method.id}
                checked={selected === method.id}
                disabled={method.unavailable || action !== null}
                onChange={() => setChosen(method.id)}
                className="peer sr-only"
              />
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 [@media(max-height:700px)]:size-10">
                {method.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[0.9375rem] font-bold lg:text-sm">{method.title}</span>
                <span className="truncate text-[0.8125rem] text-neutral-500">{method.description}</span>
              </span>
              {/* Radio dot: grey ring, filled green when selected. */}
              <span
                aria-hidden
                className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-neutral-300 peer-checked:border-brand-600 peer-checked:[&>span]:scale-100 dark:border-white/20"
              >
                <span className="size-2.5 scale-0 rounded-full bg-brand-600 transition-transform" />
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <div className="mt-4">
            <FormErrorMessage message={error} />
          </div>
        )}

        <div className="mt-auto pt-6 sm:mt-8 sm:pt-0 lg:mt-6 [@media(max-height:700px)]:pt-4">
          <Button
            size="lg"
            fullWidth
            onClick={handleContinue}
            isLoading={action === "continue"}
            disabled={action !== null}
            loadingLabel="Setting up"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={handleSkip}
            disabled={action !== null}
            className="mt-2 text-[0.9375rem] text-neutral-600 lg:text-sm dark:text-neutral-400 [@media(max-height:700px)]:mt-1"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </main>
  );
}

/**
 * A phone rising out of a dotted circle, showing a card with a green shield:
 * "your phone keeps your account safe". Drawn in SVG (no image file), so it's
 * sharp at any size, uses the brand green and follows dark mode.
 */
function PhoneShieldIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" aria-hidden className={className}>
      <defs>
        {/* Halftone dots for the circle. */}
        <pattern id="tfa-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" className="fill-neutral-300 dark:fill-white/20" />
        </pattern>
        {/* Everything is cut off flat at the bottom, so the phone "rises" out of the circle. */}
        <clipPath id="tfa-cut">
          <rect width="160" height="128" />
        </clipPath>
      </defs>

      <g clipPath="url(#tfa-cut)">
        <circle cx="80" cy="70" r="64" fill="url(#tfa-dots)" />
        <circle cx="80" cy="70" r="64" className="fill-none stroke-neutral-200 dark:stroke-white/10" strokeWidth="1" />

        {/* Phone body + speaker slot. */}
        <rect x="47" y="20" width="66" height="124" rx="11" strokeWidth="2.5" className="fill-background stroke-neutral-800 dark:stroke-neutral-200" />
        <rect x="71" y="27" width="18" height="3.5" rx="1.75" className="fill-neutral-800 dark:fill-neutral-200" />

        {/* Card on the screen, with the shield. */}
        <rect x="55" y="54" width="50" height="38" rx="6" strokeWidth="2" className="fill-brand-50 stroke-neutral-800 dark:fill-brand-500/10 dark:stroke-neutral-200" />
        <path d="M80 60.5 71.5 63.7v6.4c0 5.3 3.6 9.7 8.5 11.3 4.9-1.6 8.5-6 8.5-11.3v-6.4Z" className="fill-brand-600" />
        <path d="m76.3 70.6 2.6 2.6 4.9-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Flat base line where the phone is cut off. */}
      <line x1="38" y1="128" x2="122" y2="128" strokeWidth="2.5" strokeLinecap="round" className="stroke-neutral-800 dark:stroke-neutral-200" />
    </svg>
  );
}
