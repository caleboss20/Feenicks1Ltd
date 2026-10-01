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
  /** Once, right after registration: intro to the risk profile and packages. */
  startInvesting: "/start-investing",

  // Forgot-password flow (3 steps, in order)
  forgotPassword: "/forgot-password",
  forgotPasswordVerifyCode: "/forgot-password/verify-code",
  forgotPasswordNewPassword: "/forgot-password/new-password",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
