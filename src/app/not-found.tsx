import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_PRIMARY, StatusScreen } from "@/components/feedback/StatusScreen";
import { ROUTES } from "@/config/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** Any address that doesn't exist: a plain message and the way home. */
export default function NotFound() {
  return (
    <StatusScreen
      icon="missing"
      title="Page not found"
      message="This page doesn't exist or has moved. Let's get you back to your account."
      primary={
        <Link href={ROUTES.dashboard} className={STATUS_PRIMARY}>
          Go to Home
        </Link>
      }
    />
  );
}
