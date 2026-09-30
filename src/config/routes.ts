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
  signUp: "/sign-up",
  // Forgot-password flow (3 steps, in order)
  forgotPassword: "/forgot-password",
  forgotPasswordVerifyCode: "/forgot-password/verify-code",
  forgotPasswordNewPassword: "/forgot-password/new-password",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
