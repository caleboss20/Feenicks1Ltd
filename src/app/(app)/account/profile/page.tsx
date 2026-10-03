import type { Metadata, Viewport } from "next";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { EditProfileScreen } from "@/features/account/EditProfileScreen";

/**
 * Route: `/account/profile` (change photo and username), from the profile
 * card on Account. Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's colour, like Account (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

export default function EditProfilePage() {
  return <EditProfileScreen />;
}
