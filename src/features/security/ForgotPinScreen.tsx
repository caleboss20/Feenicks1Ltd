"use client";

/**
 * Forgot PIN, STEP 1 of 3: "Reset your PIN". Reached from "Forgot PIN?" on
 * the Enter PIN screen (the user is logged in; only the PIN is forgotten).
 *
 *   ←
 *            ⠿⠿[📱💬]⠿⠿             ← phone receiving a code
 *
 *   Reset your PIN                   ← bold title, left-aligned
 *   We'll text a 6-digit code to     ← faint text
 *   +233 *******67 to confirm it's you…
 *
 *   ┌ 🛡 Only your PIN changes. ┐     ← reassurance
 *   └───────────────────────────┘
 *   (          Send code          )
 *
 * Next: /security/forgot-pin/verify-code → /security/forgot-pin/new-pin
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { TWO_FACTOR_CODE_LENGTH } from "@/config/verification";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { maskGhanaPhone } from "@/lib/maskContactDetails";
import { PhoneCodeIllustration } from "./SecurityIllustrations";
import { requestPinResetCode } from "./securityService";

/** Where "Send code" leads. */
const NEXT_SCREEN = ROUTES.forgotPinVerifyCode;

export function ForgotPinScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always signed in here (the /security layout checks); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const handleSendCode = async () => {
    setError(null);
    setIsSending(true);
    const result = await requestPinResetCode();
    if (!result.ok) {
      setIsSending(false);
      setError(result.message);
      return;
    }
    router.push(NEXT_SCREEN);
  };

  return (
    // Same column as StepScreenLayout, but the title sits under the picture
    // (as on the 2FA screen), so the header row only has the back arrow.
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-8 lg:max-w-sm">
      <div className="flex min-h-11 items-center">
        <Link
          href={ROUTES.enterPin}
          aria-label="Back to Enter PIN"
          className="-ml-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-foreground/5"
        >
          <ArrowLeft className="size-6" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col sm:flex-none">
        <PhoneCodeIllustration className="mx-auto mt-[3dvh] w-32 sm:mt-2 lg:w-28 [@media(max-height:700px)]:mt-0 [@media(max-height:700px)]:w-24" />

        <h1 className="mt-8 text-[1.625rem] leading-tight font-bold tracking-tight lg:mt-6 lg:text-2xl [@media(max-height:700px)]:mt-5">
          Reset your PIN
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm dark:text-neutral-400">
          We&apos;ll text a {TWO_FACTOR_CODE_LENGTH}-digit code to{" "}
          <span className="font-semibold whitespace-nowrap text-neutral-700 dark:text-neutral-200">
            {maskGhanaPhone(current.account.phone)}
          </span>{" "}
          to confirm it&apos;s you. Then you&apos;ll choose a new PIN.
        </p>

        {/* Reassurance: forgetting the PIN doesn't put anything else at risk. */}
        <p className="mt-6 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm leading-relaxed text-brand-900 lg:mt-5 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
          <ShieldCheckIcon className="mt-0.5 size-5 text-brand-600" />
          <span>
            Only your PIN changes. Your password, investments and money stay exactly as they are.
          </span>
        </p>

        {error && (
          <div className="mt-4">
            <FormErrorMessage message={error} />
          </div>
        )}

        <div className="mt-auto pt-6 sm:mt-8 sm:pt-0 lg:mt-6">
          <Button
            size="lg"
            fullWidth
            onClick={handleSendCode}
            isLoading={isSending}
            loadingLabel="Sending code"
          >
            Send code
          </Button>
        </div>
      </div>
    </main>
  );
}
