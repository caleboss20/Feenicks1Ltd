/**
 * Shared layout for the auth screens (register, login, forgot password…).
 *
 * `(auth)` is a route group: the parentheses mean it groups these routes
 * under one layout WITHOUT adding "/auth" to the URL
 * (app/(auth)/register/page.tsx → /register).
 *
 * One centred column on every screen size: full screen on phones, and a
 * focused form in the middle of the page on tablets and desktops.
 */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-dvh flex-col bg-background">{children}</div>;
}
