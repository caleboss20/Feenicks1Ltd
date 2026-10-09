"use client";

/**
 * Authenticator-app 2FA setup, STEP 1: scan the QR code (as in the mockup).
 *
 *   ←      Two-factor authentication
 *   Scan the QR code below using an authenticator app
 *   (such as Google Authenticator, Microsoft Authenticator or Authy).
 *
 *               ▛▀▀▜ ▄▀ ▛▀▀▜
 *               ▙▄▄▟ ▀▄ ▙▄▄▟          ← real QR code (otpauth:// link)
 *
 *   Can't scan the QR code? Enter this code into your
 *   authenticator app instead:
 *            MHKV 5RG3 F4DL VUJI …    ← the secret, grouped in 4s
 *                 Copy ⧉
 *
 *   (     Enter confirmation code     )
 *
 * On phones there's also "Open in authenticator app": you can't scan a
 * QR code that's on your own screen, so the link adds the account in one tap.
 *
 * Next: /security/two-factor/authenticator/confirm (type the app's code).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { QrCode } from "@/components/ui/QrCode";
import { ROUTES } from "@/config/routes";
import { formatTotpSecret } from "@/lib/totp";
import { startAuthenticatorSetup } from "./securityService";
import { useAuthenticatorSetupStore } from "./useAuthenticatorSetupStore";

/** Where "Enter confirmation code" leads. */
const NEXT_SCREEN = ROUTES.twoFactorAuthenticatorConfirm;

/** How long "Copied" shows after copying the key. */
const COPIED_FEEDBACK_MS = 2000;

export function AuthenticatorQrScreen() {
  const router = useRouter();
  const setup = useAuthenticatorSetupStore((s) => s.setup);
  const saveSetup = useAuthenticatorSetupStore((s) => s.saveSetup);
  const [isCopied, setIsCopied] = useState(false);

  // One secret per setup: kept if they go to the next screen and come back.
  useEffect(() => {
    if (!setup) void startAuthenticatorSetup().then(saveSetup);
  }, [setup, saveSetup]);

  // Clear the "Copied" tick after a moment.
  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const copyKey = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setIsCopied(true);
    } catch {
      // Clipboard blocked: the key is on screen to type by hand.
    }
  };

  return (
    <StepScreenLayout title="Two-factor authentication" centeredTitle backHref={ROUTES.twoFactor}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
          Scan the QR code below using an authenticator app (such as Google Authenticator,
          Microsoft Authenticator or Authy).
        </p>

        {/* QR code, or a placeholder of the same size while the key is created. */}
        <div className="mt-8 flex justify-center lg:mt-6">
          {setup ? (
            <QrCode
              value={setup.otpAuthUri}
              label="QR code to add Feenicks1 to your authenticator app"
              className="size-44 lg:size-40"
            />
          ) : (
            <div aria-hidden className="size-44 animate-pulse rounded-lg bg-neutral-100 lg:size-40 dark:bg-white/5" />
          )}
        </div>

        <p className="mt-8 text-[0.9375rem] leading-relaxed text-neutral-600 lg:mt-6 lg:text-sm dark:text-neutral-400">
          Can&apos;t scan the QR code? Enter this code into your authenticator app instead:
        </p>

        {/* The secret, grouped in 4s so it's easy to type. Selectable as one block. */}
        <p
          aria-label="Setup key"
          className="mt-4 min-h-14 text-center font-mono text-lg leading-snug font-bold tracking-[0.08em] break-words select-all"
        >
          {setup ? formatTotpSecret(setup.secret) : ""}
        </p>

        <button
          type="button"
          onClick={copyKey}
          disabled={!setup}
          className="mx-auto mt-2 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
        >
          {isCopied ? (
            <>
              <CheckIcon className="size-4" />
              Copied
            </>
          ) : (
            <>
              Copy
              <CopyIcon className="size-4" />
            </>
          )}
        </button>
        <span aria-live="polite" className="sr-only">
          {isCopied ? "Setup key copied" : ""}
        </span>

        <div className={stepActionsClass}>
          <Button
            size="lg"
            fullWidth
            disabled={!setup}
            onClick={() => router.push(NEXT_SCREEN)}
          >
            Enter confirmation code
          </Button>

          {/* Phones: the QR code can't be scanned from its own screen. */}
          {setup && (
            <a
              href={setup.otpAuthUri}
              className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline lg:hidden"
            >
              Using this phone? Open in authenticator app
            </a>
          )}
        </div>
      </div>
    </StepScreenLayout>
  );
}
