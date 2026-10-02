import type { Metadata, Viewport } from "next";
import { EditProfileScreen } from "@/features/account/EditProfileScreen";

/**
 * Route: `/account/profile` (change photo and username), from the profile
 * card on Account. Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's light grey (`bg-neutral-100`), like Account. */
export const viewport: Viewport = {
  themeColor: "#f5f5f5",
};

export default function EditProfilePage() {
  return <EditProfileScreen />;
}
