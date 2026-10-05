/**
 * Central list of app routes.
 *
 * Always navigate with these constants (e.g. `router.push(ROUTES.login)`)
 * instead of hard-coding strings. If a URL changes, it only changes here.
 */
export const ROUTES = {
  splash: "/",
  onboarding: "/onboarding",
  login: "/login",
  /** Log-in, step 2 when 2FA is on: enter the code from the app or SMS. */
  loginTwoStep: "/login/two-step",
  signUp: "/sign-up",
  /** Enter the code emailed after sign-up. */
  verifyEmail: "/verify-email",
  // Identity verification (KYC), required before the dashboard (steps in order)
  kycInvestmentGoals: "/kyc/investment-goals",
  kycVerifyIdentity: "/kyc/verify-identity",
  kycProofOfResidency: "/kyc/proof-of-residency",
  kycUploadId: "/kyc/upload-id",
  kycSelfie: "/kyc/selfie",
  kycProfile: "/kyc/profile",
  kycAllSet: "/kyc/all-set",

  // Account security
  createPin: "/security/create-pin",
  /** Choose a two-factor method (fingerprint, SMS, authenticator app), or skip. */
  twoFactor: "/security/two-factor",
  /** SMS 2FA setup: enter the code texted to the profile phone number. */
  twoFactorSms: "/security/two-factor/sms",
  /** Authenticator-app 2FA setup: scan the QR code, then enter the app's code. */
  twoFactorAuthenticator: "/security/two-factor/authenticator",
  twoFactorAuthenticatorConfirm: "/security/two-factor/authenticator/confirm",
  /** Returning users: unlock the app with their PIN after logging in. */
  enterPin: "/security/enter-pin",
  // Forgot PIN (3 steps, in order)
  forgotPin: "/security/forgot-pin",
  forgotPinVerifyCode: "/security/forgot-pin/verify-code",
  forgotPinNewPin: "/security/forgot-pin/new-pin",

  // The app (signed-in, fully registered users)
  dashboard: "/dashboard",
  // Main tabs (with the dashboard)
  analytics: "/analytics",
  transactions: "/transactions",
  account: "/account",
  /** Change photo and username (from the profile card on Account). */
  editProfile: "/account/profile",
  /** Choose the colour behind the balance on Home (Account › Dashboard colour). */
  dashboardColor: "/account/dashboard-color",
  /** Help & support: the dashboard's headset, and Account › Help & support. */
  support: "/support",
  /** Help & support › Send a message. */
  supportMessage: "/support/message",
  /** From the dashboard's header bell. */
  notifications: "/notifications",
  /** From the dashboard's Withdraw button. */
  withdraw: "/withdraw",
  /** Invite a friend: the user's referral QR code (the dashboard's scan button). */
  refer: "/refer",
  /**
   * Investing, inside the app: the dashboard's Invest button. Opens their
   * package (chosen at sign-up, or the one they're invested in), or the
   * packages list if they haven't chosen one (features/packages/InvestStartScreen).
   */
  invest: "/invest",
  /** All packages (matched to the risk profile first): choose or change. Details at /invest/[id], terms at /invest/[id]/terms. */
  investPackages: "/invest/packages",
  /** The investor risk profile inside the app (Account › Investor profile), and retaking it. */
  investorProfile: "/account/investor-profile",
  investorProfileQuestions: "/account/investor-profile/questions",

  // Start investing: ONCE, right after registration (see config/investingFlow.ts).
  // Intro → risk profile questions → result → packages (→ details → terms).
  // Once the user has reached the dashboard, these send them to the in-app versions above.
  startInvesting: "/start-investing",
  riskProfileQuestions: "/investor-profile",
  riskProfileResult: "/investor-profile/result",
  packages: "/packages",

  // Forgot-password flow (3 steps, in order)
  forgotPassword: "/forgot-password",
  forgotPasswordVerifyCode: "/forgot-password/verify-code",
  forgotPasswordNewPassword: "/forgot-password/new-password",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** One transaction's details (receipt), e.g. `/transactions/SMP1182137`: from Transactions and Recent activity. */
export function transactionDetailsHref(id: string): string {
  return `${ROUTES.transactions}/${encodeURIComponent(id)}`;
}

/**
 * A completed transaction's receipt (Share / Download), e.g. `/transactions/FX4991600/receipt`.
 * `isNewPayment`: straight after paying (Back then goes home, not back into the payment).
 */
export function transactionReceiptHref(id: string, { isNewPayment = false } = {}): string {
  return `${transactionDetailsHref(id)}/receipt${isNewPayment ? "?new=1" : ""}`;
}

/** Waiting for a Mobile Money payment to be approved on the phone, e.g. `/invest/payment/PAY48291736`. */
export function investPaymentHref(paymentId: string): string {
  return `${ROUTES.invest}/payment/${encodeURIComponent(paymentId)}`;
}

/** Help & support › Send a message, with a transaction already picked ("Need help with this?"). */
export function supportMessageAboutHref(transactionId: string): string {
  return `${ROUTES.supportMessage}?transaction=${encodeURIComponent(transactionId)}`;
}
