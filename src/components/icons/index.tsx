import { cn } from "@/lib/utils";

/**
 * App icon set: small inline SVGs (no icon library needed).
 *
 * All icons:
 *   - draw in `currentColor`, so they take the surrounding text colour
 *   - are 20px by default; pass a size class to change it, e.g. className="size-6"
 *   - are hidden from screen readers (decorative). The button or field
 *     they sit in must carry the accessible label.
 *
 * Import: `import { MailIcon, LockIcon } from "@/components/icons";`
 */

type IconProps = { className?: string };

/**
 * Adds the default size (20px) ONLY when the caller didn't pass a size.
 * Otherwise both size classes would end up on the icon and CSS order,
 * not the caller, would decide which one wins.
 */
function iconClasses(className?: string) {
  const hasCustomSize = /(^|\s|:)size-/.test(className ?? "");
  return cn("shrink-0", !hasCustomSize && "size-5", className);
}

/** Shared wrapper for the outline (stroke) icons. */
function StrokeIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={iconClasses(className)}
    >
      {children}
    </svg>
  );
}

/* ── Navigation ───────────────────────────────────────────────────────── */

/** Nudges right on hover when inside an element with the `group` class (e.g. Button). */
export function ArrowRight({ className }: IconProps) {
  return (
    <StrokeIcon
      className={cn("transition-transform duration-200 group-hover:translate-x-1", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </StrokeIcon>
  );
}

/** × for closing popups and sheets. */
export function CloseIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </StrokeIcon>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </StrokeIcon>
  );
}

/* ── Form fields ──────────────────────────────────────────────────────── */

export function MailIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </StrokeIcon>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </StrokeIcon>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </StrokeIcon>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.5M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </StrokeIcon>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M11 18h2" />
    </StrokeIcon>
  );
}

/** Speech bubble with dots: "text message / SMS". */
export function MessageIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
      <path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01" strokeWidth={2.75} />
    </StrokeIcon>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2" />
    </StrokeIcon>
  );
}

/** Fingerprint: biometric sign-in (fingerprint / Face ID). */
export function FingerprintIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6.2 5.2A8.5 8.5 0 0 1 20.5 11v1.5" />
      <path d="M3.5 15.5V11c0-1.3.3-2.5.8-3.6" />
      <path d="M7 19.5c.6-1.6 1-3.3 1-5.5v-3a4 4 0 0 1 8 0v1.5" />
      <path d="M12 11v3c0 2.8-.7 5.2-2 7.2" />
      <path d="M16 15.5c0 1.9-.3 3.6-.9 5.2" />
      <path d="M19.8 16.5a17 17 0 0 1-.6 2.5" />
    </StrokeIcon>
  );
}

/** Compass: "find your direction" (investor profile). */
export function CompassIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </StrokeIcon>
  );
}

/** Target with a centre dot: "matched to you". */
export function TargetIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </StrokeIcon>
  );
}

/* ── App navigation & dashboard ─────────────────────────────────────── */

/** Solid up triangle (rounded corners): a gain, as on stock tickers. Rotate 180° for a loss. */
export function TriangleUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={iconClasses(className)}>
      <path d="M12 5.5c.4 0 .77.2.98.55l7.1 11.4a1.15 1.15 0 0 1-.98 1.75H4.9a1.15 1.15 0 0 1-.98-1.75l7.1-11.4c.21-.35.58-.55.98-.55Z" />
    </svg>
  );
}

/** Scan frame (four corners and a line): "show a QR code to scan". */
export function ScanIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M7 12h10" />
    </StrokeIcon>
  );
}

/** Party popper with confetti: a celebration or milestone. */
export function PartyPopperIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M3.5 20.5 8.5 9.5l6 6-11 5Z" />
      <path d="M13.5 9.5c1-2 .6-4.3-1.3-5.4M15 11c2-1 4.4-.6 5.5 1.3" />
      <path d="M17 3.5v.01M21 7.5v.01M19.5 17v.01M9.5 3.5v.01" />
    </StrokeIcon>
  );
}

/** Wrapped gift: "invite a friend" / rewards. */
export function GiftIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </StrokeIcon>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19Z" />
    </StrokeIcon>
  );
}

/** Bar chart: analytics. */
export function ChartBarIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 20h16" />
      <rect x="5.5" y="11" width="3" height="6.5" rx="1" />
      <rect x="10.5" y="6.5" width="3" height="11" rx="1" />
      <rect x="15.5" y="13.5" width="3" height="4" rx="1" />
    </StrokeIcon>
  );
}

/** Receipt with lines: transactions. */
export function ReceiptIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </StrokeIcon>
  );
}
/** Four squares: a collection (investment packages). */
export function GridIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.75" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.75" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75" />
    </StrokeIcon>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 5v14M5 12h14" />
    </StrokeIcon>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </StrokeIcon>
  );
}

export function CalculatorIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" strokeWidth={2.25} />
    </StrokeIcon>
  );
}

/** Headset: help / support. */
export function SupportIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M18.5 19c0 1.2-1.5 2-3.5 2h-2" />
    </StrokeIcon>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </StrokeIcon>
  );
}

/** Briefcase: a managed portfolio (Mutual Fund Capital). */
export function BriefcaseIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18M11 12.5v1.5h2v-1.5" />
    </StrokeIcon>
  );
}

/** Sprout: agriculture (Agribusiness Capital). */
export function SproutIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5Z" />
      <path d="M12 14.5c0-3.2-2-5.2-6-5.2 0 3.6 2 5.2 6 5.2Z" />
    </StrokeIcon>
  );
}

/** Buildings: real estate (Real Estate Pool Fund). */
export function BuildingIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V21M2.5 21h19" />
      <path d="M7.5 8h3M7.5 12h3M7.5 16h3M16.5 14h1M16.5 17.5h1" />
    </StrokeIcon>
  );
}

/** Line going up and to the right: growth, returns. */
export function TrendUpIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </StrokeIcon>
  );
}

/** Two overlapping pages: "copy to clipboard". */
export function CopyIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="8" y="8" width="12" height="13" rx="2.5" />
      <path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-7A2.5 2.5 0 0 0 4 5.5v9A2.5 2.5 0 0 0 6.5 17H8" />
    </StrokeIcon>
  );
}

/** Face ID: a face inside scanning corners (iPhone face unlock). */
export function FaceIdIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M3 8V6a3 3 0 0 1 3-3h2M16 3h2a3 3 0 0 1 3 3v2M21 16v2a3 3 0 0 1-3 3h-2M8 21H6a3 3 0 0 1-3-3v-2" />
      <path d="M9 9v1.5M15 9v1.5M12 9v4h-1" />
      <path d="M9 16a4.5 4.5 0 0 0 6 0" />
    </StrokeIcon>
  );
}

/** Phone with a lock code on screen: authenticator app (Google Authenticator etc.). */
export function AuthenticatorAppIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M9.5 10.5h.01M12 10.5h.01M14.5 10.5h.01" strokeWidth={2.75} />
      <path d="M9.5 14.5h5" />
    </StrokeIcon>
  );
}

/* ── Identity documents ───────────────────────────────────────────────── */

/** ID card with a photo and text lines (national ID, Ghana Card). */
export function IdCardIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4.5M14 13.5h3" />
    </StrokeIcon>
  );
}

/** Passport booklet with a globe on the cover. */
export function PassportIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <circle cx="12" cy="10.5" r="3.5" />
      <path d="M8.5 10.5h7M12 7c1 1 1.5 2.2 1.5 3.5S13 13 12 14c-1-1-1.5-2.2-1.5-3.5S11 8 12 7ZM9 17.5h6" />
    </StrokeIcon>
  );
}

/** Car: driver's licence. */
export function CarIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M5 16.5V12l1.8-4.5A2 2 0 0 1 8.7 6.2h6.6a2 2 0 0 1 1.9 1.3L19 12v4.5" />
      <path d="M3.5 12h17v4.5h-17ZM6 19v-2.5M18 19v-2.5" />
      <path d="M7 14.2h.01M17 14.2h.01" strokeWidth={2.75} />
    </StrokeIcon>
  );
}

/* ── Profile fields ──────────────────────────────────────────────────── */

export function UserIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
    </StrokeIcon>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </StrokeIcon>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </StrokeIcon>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4Z" />
      <path d="m13.5 6.5 4 4" />
    </StrokeIcon>
  );
}

/** Keypad delete key. */
export function BackspaceIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M8.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8.5L3 12Z" />
      <path d="m11 9.5 5 5M16 9.5l-5 5" />
    </StrokeIcon>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </StrokeIcon>
  );
}

/* ── Camera ──────────────────────────────────────────────────────────── */

export function CameraIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </StrokeIcon>
  );
}

/** Circular arrow: retake / try again. */
export function RetakeIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7" />
    </StrokeIcon>
  );
}

/** Globe: "other country" / international. */
export function GlobeIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </StrokeIcon>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </StrokeIcon>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 2.8 4.5 5.6v5.6c0 4.7 3.2 8.6 7.5 10 4.3-1.4 7.5-5.3 7.5-10V5.6Z" />
      <path d="m8.8 12 2.2 2.2 4.3-4.4" />
    </StrokeIcon>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </StrokeIcon>
  );
}

/* ── Social sign-in (official brand colours, per each brand's guidelines) ── */

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClasses(className)}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClasses(className)}>
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

export function AppleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={iconClasses(className)}>
      <path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.5a11 11 0 0 0 1.4-2.9 4.5 4.5 0 0 1-2.4-4.1ZM13.9 5.1a4.4 4.4 0 0 0 1-3.2 4.6 4.6 0 0 0-3 1.5 4.3 4.3 0 0 0-1.1 3.1 3.8 3.8 0 0 0 3.1-1.4Z" />
    </svg>
  );
}
