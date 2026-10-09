"use client";

/**
 * ProfilePhotoPicker: the round avatar at the top of "Fill Your Profile",
 * with a green pencil badge, as in the design.
 *
 *        ( 👤 )        ← empty: grey circle with a person icon
 *            ✏️         ← tap anywhere on it to choose / change the photo
 *
 * Optional. Phones offer the camera or the photo library.
 */

import { PencilIcon, UserIcon } from "@/components/icons";

/** Largest profile photo we accept. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type ProfilePhotoPickerProps = {
  /** Preview URL of the chosen photo, or null for the empty placeholder. */
  photoUrl: string | null;
  onPhotoSelected: (file: File) => void;
  /** Called with a friendly message if the file isn't usable. */
  onError: (message: string) => void;
};

export function ProfilePhotoPicker({ photoUrl, onPhotoSelected, onError }: ProfilePhotoPickerProps) {
  return (
    <label className="relative mx-auto block size-20 cursor-pointer rounded-full focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-brand-400 lg:size-20">
      <span className="sr-only">{photoUrl ? "Change profile photo" : "Add a profile photo (optional)"}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow choosing the same file again
          if (!file) return;
          if (!file.type.startsWith("image/")) return onError("Please choose a photo (JPG, PNG, WebP or HEIC).");
          if (file.size > MAX_PHOTO_BYTES) return onError("That photo is larger than 5 MB. Please choose a smaller one.");
          onPhotoSelected(file);
        }}
      />

      <span className="block size-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        {photoUrl ? (
          // In-memory blob: URL of the user's own photo, so a plain <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your profile photo" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-neutral-300 dark:text-neutral-400">
            <UserIcon className="size-10" />
          </span>
        )}
      </span>

      {/* Green pencil badge, bottom-right, with a white ring to separate it. */}
      <span
        aria-hidden
        className="absolute right-0.5 bottom-0.5 grid size-8 place-items-center rounded-lg bg-brand-700 text-white ring-[3px] ring-background"
      >
        <PencilIcon className="size-4" />
      </span>
    </label>
  );
}
