import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";

/**
 * Edit profile: saves what the user can change themselves, their username
 * and photo.
 *
 * Not editable here, on purpose:
 *   - full name: it must match their ID (identity check)
 *   - phone and email: they sign in and receive codes with them; changing
 *     them needs its own verified flow (TODO), or support
 */

export type ProfileResult =
  | { ok: true }
  | { ok: false; message: string; field?: "username" };

export async function updateProfile(changes: {
  /** Already validated with `usernameSchema` (lowercase, no "@"). */
  username?: string;
  /** Square JPEG thumbnail (see lib/imageThumbnail.ts). */
  avatarDataUrl?: string;
}): Promise<ProfileResult> {
  // TODO(api): PATCH /api/me  { username?, avatar? }
  //   The server re-validates the username, checks it's free and not reserved,
  //   stores the photo (full size, serving its own thumbnails) and returns the profile.
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (!email) return { ok: false, message: "Your session has ended. Please log in again." };

    if (changes.username) {
      const owner = demo.findAccountByUsername(changes.username);
      if (owner && owner.email !== email) {
        return { ok: false, field: "username", message: "That username is taken. Try another one." };
      }
    }

    demo.updateSessionAccount({
      ...(changes.username ? { username: changes.username } : {}),
      ...(changes.avatarDataUrl ? { avatarDataUrl: changes.avatarDataUrl } : {}),
    });
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}
