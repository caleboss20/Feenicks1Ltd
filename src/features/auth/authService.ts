import type { LoginValues, SignUpValues } from "./authValidation";

/**
 * Auth service: the single place the UI talks to the auth backend.
 *
 * Components call these functions and never `fetch` directly, so when the
 * backend (or its URL, or the auth provider) changes, only this file changes.
 *
 * ⚠️ Not connected yet. The backend/auth provider hasn't been chosen, so
 * `signUp` deliberately fails. The form then shows its error state instead
 * of pretending an account was created.
 */

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function signUp(values: SignUpValues): Promise<AuthResult> {
  // TODO(auth): replace with the real call once the backend exists, e.g.
  //   const res = await fetch("/api/auth/sign-up", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(values),
  //   });
  void values;
  return {
    ok: false,
    message: "Sign-up isn't connected to a server yet. Please try again later.",
  };
}

export async function logIn(values: LoginValues): Promise<AuthResult> {
  // TODO(auth): replace with the real call once the backend exists, e.g.
  //   POST /api/auth/login → the server sets a secure httpOnly session cookie.
  //   `values.remember` decides whether that cookie outlives the browser session.
  // Security: on failure always show the same generic message, never
  // "email not found" vs "wrong password", which would reveal who has an account.
  void values;
  return {
    ok: false,
    message: "Logging in isn't connected to a server yet. Please try again later.",
  };
}

/** Social log-in providers shown under "or continue with". */
export type SocialProvider = "facebook" | "google" | "apple";

export async function logInWithProvider(provider: SocialProvider): Promise<AuthResult> {
  // TODO(auth): redirect to the provider's OAuth flow once configured.
  void provider;
  return {
    ok: false,
    message: "Logging in with Google, Facebook or Apple isn't available yet.",
  };
}
