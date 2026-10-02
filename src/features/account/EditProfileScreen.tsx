"use client";

/**
 * Edit profile, after the user's reference: opened from the profile card on
 * the Account screen. Light by default, with dark-mode styles (`dark:`).
 *
 *   (←)           Edit profile
 *
 *                 (  📷  )            ← photo; the green badge changes it
 *                       (◉)
 *   ╭────────────────────────────────────╮
 *   │ Full name                  Ama Mensah │   ← read-only
 *   │ Phone number          +233 24 123 4567 │   ← read-only
 *   │ Email                ama@example.com │   ← read-only
 *   │ Username                  @ama_m     │   ← editable
 *   ╰────────────────────────────────────╯
 *   Name, phone and email can't be changed here…
 *
 *   (           Save changes           )
 *
 * Only the photo and username can be changed (see profileService). No
 * "Delete account" here.
 */

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CameraIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { type CurrentAccount, useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { makeSquareThumbnail } from "@/lib/imageThumbnail";
import { formatGhanaPhone } from "@/lib/phoneNumber";
import { cn } from "@/lib/utils";
import { ACCOUNT_PAGE_COLORS } from "./accountTheme";
import { updateProfile } from "./profileService";
import { USERNAME_MAX_LENGTH, usernameSchema } from "./profileValidation";

/** Phone photos can be big; anything larger is almost certainly not a photo. */
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

export function EditProfileScreen() {
  const current = useCurrentAccount();
  useStatusBarColor(ACCOUNT_PAGE_COLORS);
  // Wait for the account before showing the form, so it starts with their details.
  if (current.status !== "signed-in") return null;
  return <EditProfileForm account={current.account} />;
}

function EditProfileForm({ account }: { account: CurrentAccount }) {
  const router = useRouter();
  const photoInputId = useId();
  const usernameId = useId();
  const usernameErrorId = useId();

  const savedUsername = account.username ?? "";
  const [username, setUsername] = useState(savedUsername);
  /** A newly picked photo (thumbnail), not saved yet. */
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const photo = newPhoto ?? account.avatarUrl;
  const usernameChanged = username !== savedUsername;
  const hasChanges = usernameChanged || newPhoto !== null;

  /** The username's problem, if any ("" is fine only if they never had one). */
  const checkUsername = (value: string): string | null => {
    if (value === "" && savedUsername === "") return null;
    if (value === "") return "Choose a username.";
    const result = usernameSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const pickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear it, so picking the same photo again still counts as a change.
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose a photo (JPG or PNG).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large. Choose a smaller one.");
      return;
    }

    const thumbnail = await makeSquareThumbnail(file);
    if (!thumbnail) {
      setPhotoError("We couldn't open that photo. Try a JPG or PNG.");
      return;
    }
    setNewPhoto(thumbnail);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const problem = usernameChanged ? checkUsername(username) : null;
    setUsernameError(problem);
    if (problem) return;

    setIsSaving(true);
    const result = await updateProfile({
      username: usernameChanged ? usernameSchema.parse(username) : undefined,
      avatarDataUrl: newPhoto ?? undefined,
    });
    if (!result.ok) {
      setIsSaving(false);
      if (result.field === "username") setUsernameError(result.message);
      else setFormError(result.message);
      return;
    }
    // Saved: back to Account, which already shows the new photo and username.
    router.replace(ROUTES.account);
  };

  const initials = (account.firstName ?? "F1").slice(0, 2).toUpperCase();
  const details = [
    { label: "Full name", value: account.fullName ?? "Not added" },
    { label: "Phone number", value: formatGhanaPhone(account.phone) ?? "Not added" },
    { label: "Email", value: account.email },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-background">
      {/* Back · title (the empty cell keeps the title centred) */}
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <Link
          href={ROUTES.account}
          aria-label="Back to account"
          className="grid size-11 place-items-center rounded-full bg-black/5 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-center text-[1.0625rem] font-semibold">Edit profile</h1>
        <span />
      </header>

      <form onSubmit={save} noValidate className="mt-8 flex flex-1 flex-col">
        {/* Photo, with a badge to change it (camera or gallery on phones). */}
        <div className="relative mx-auto size-28">
          {photo ? (
            <Image
              src={photo}
              alt="Your profile photo"
              width={112}
              height={112}
              unoptimized // a small local thumbnail: nothing to optimise
              className="size-28 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-28 place-items-center rounded-full bg-brand-50 text-3xl font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {initials}
            </span>
          )}
          <label
            htmlFor={photoInputId}
            className="absolute -right-0.5 -bottom-0.5 grid size-10 cursor-pointer place-items-center rounded-full bg-brand-600 text-white ring-4 ring-neutral-100 transition-colors hover:bg-brand-700 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-400 dark:ring-background"
          >
            <CameraIcon className="size-[18px]" />
            <span className="sr-only">Change profile photo</span>
            <input
              id={photoInputId}
              type="file"
              accept="image/*"
              onChange={pickPhoto}
              className="sr-only"
            />
          </label>
        </div>
        {photoError && (
          <p role="alert" className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
            {photoError}
          </p>
        )}

        {/* Details: three read-only rows, then the username field. */}
        <div className="mt-8 divide-y divide-neutral-100 rounded-3xl bg-white px-4 dark:divide-white/10 dark:bg-white/5">
          {details.map((detail) => (
            <div key={detail.label} className="flex min-h-14 items-center gap-4 py-3">
              <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">{detail.label}</span>
              <span className="ml-auto min-w-0 truncate text-right text-[0.9375rem]">{detail.value}</span>
            </div>
          ))}

          <div className="flex min-h-14 items-center gap-4 py-3">
            <label htmlFor={usernameId} className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
              Username
            </label>
            <input
              id={usernameId}
              // Shown with its "@"; saved without it.
              value={username ? `@${username}` : ""}
              onChange={(event) => {
                setUsername(event.target.value.replace(/^@+/, "").replace(/\s+/g, "").toLowerCase());
                setUsernameError(null);
              }}
              onBlur={() => usernameChanged && setUsernameError(checkUsername(username))}
              placeholder="@yourname"
              maxLength={USERNAME_MAX_LENGTH + 1}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={usernameError ? true : undefined}
              aria-describedby={usernameError ? usernameErrorId : undefined}
              className={cn(
                "ml-auto w-full min-w-0 bg-transparent text-right text-[0.9375rem] outline-none placeholder:text-neutral-400",
                "rounded-md focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900",
              )}
            />
          </div>
        </div>

        {usernameError ? (
          <p id={usernameErrorId} role="alert" className="mt-2 px-1 text-xs text-red-600 dark:text-red-400">
            {usernameError}
          </p>
        ) : (
          <p className="mt-2 px-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Your name, phone number and email can&apos;t be changed here. To update them, contact
            support.
          </p>
        )}

        {formError && (
          <p role="alert" className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}

        <div className="mt-8">
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!hasChanges}
            isLoading={isSaving}
            loadingLabel="Saving your profile"
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
