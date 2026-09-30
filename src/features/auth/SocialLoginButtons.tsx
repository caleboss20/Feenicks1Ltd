"use client";

/**
 * "or continue with" divider + social sign-in buttons (Facebook, Google, Apple).
 * Shared by the register and login screens.
 */

import { AppleIcon, FacebookIcon, GoogleIcon } from "@/components/icons";
import { logInWithProvider, type SocialProvider } from "./authService";

const PROVIDERS: { id: SocialProvider; label: string; Icon: typeof GoogleIcon }[] = [
  { id: "facebook", label: "Continue with Facebook", Icon: FacebookIcon },
  { id: "google", label: "Continue with Google", Icon: GoogleIcon },
  { id: "apple", label: "Continue with Apple", Icon: AppleIcon },
];

export function SocialLoginButtons({ onError }: { onError: (message: string) => void }) {
  const handleClick = async (provider: SocialProvider) => {
    const result = await logInWithProvider(provider);
    if (!result.ok) onError(result.message);
  };

  return (
    <div>
      {/* Divider: line — text — line */}
      <div className="flex items-center gap-4 text-[0.9375rem] font-semibold text-neutral-500 lg:text-sm">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
        or continue with
        <span className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
      </div>

      <div className="mt-5 flex justify-center gap-4">
        {PROVIDERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            aria-label={label}
            title={label}
            // 72×48 on phones (above the 44px minimum tap size), compact 64×44 on desktop.
            className="grid h-12 w-18 cursor-pointer place-items-center rounded-xl border border-neutral-200 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 lg:h-11 lg:w-16 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );
}
