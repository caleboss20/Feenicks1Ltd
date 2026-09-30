<div align="center">

# Feenicks1

**Smart investing, simplified.**

The web app for the Feenicks1 investment platform: a mobile-first experience that feels like a native app, running in any browser.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=fff)
![Status](https://img.shields.io/badge/status-in%20development-13934f)

</div>

---

## Contents

- [About](#about)
- [Screens built so far](#screens-built-so-far)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Naming conventions](#naming-conventions)
- [Coding guidelines](#coding-guidelines)
- [Design system](#design-system)
- [Security](#security)
- [SEO](#seo)
- [Demo mode](#demo-mode)
- [Git workflow](#git-workflow)
- [Roadmap](#roadmap)

---

## About

Feenicks1 helps people grow their money through simple, secure investing. This repository contains the **frontend web app**. It is built mobile-first so it looks and behaves like a native app on phones, and adapts to tablets and desktops.

> **Status:** in active development. The backend is not connected yet (see [Demo mode](#demo-mode)).

## Screens built so far

| Screen | Route | Notes |
|---|---|---|
| Splash | `/` | Animated brand logo on solid brand green, then auto-redirects |
| Onboarding | `/onboarding` | Story-style photo slides: tap, swipe or hold to pause. Two columns on desktop |
| Sign up | `/sign-up` | "Create your Account": email, password, social buttons |
| Log in | `/login` | "Log in to your Account" with a "Forgot the password?" link |
| Forgot password, step 1 | `/forgot-password` | Choose SMS or email to receive a code |
| Forgot password, step 2 | `/forgot-password/verify-code` | 4-digit code, resend countdown |
| Forgot password, step 3 | `/forgot-password/new-password` | New password with a live requirements checklist, then a success popup |

Every screen is responsive (phone, tablet, desktop) and fits within one screen height on laptops.

## Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) | Server rendering for speed and SEO; file-based routing |
| Language | TypeScript (strict) | Catches mistakes before they reach users |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Design tokens in one CSS file, consistent spacing and colours |
| State | [Zustand](https://zustand.docs.pmnd.rs) | Small, simple global state (onboarding progress, theme, reset flow) |
| Forms | [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) | Fast forms; one set of validation rules for browser and server |
| Font | Plus Jakarta Sans (self-hosted via `next/font`) | Modern, trustworthy; no layout shift |

## Getting started

**Requirements:** Node.js 20.9 or newer (developed on Node 24) and npm.

```bash
# 1. Clone
git clone https://github.com/caleboss20/Feenicks1Ltd.git
cd Feenicks1Ltd

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local      # then edit the values

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Example | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes (production) | `https://feenicks1.com` | Canonical links, sitemap, social share images |

Never commit `.env.local` or any real secrets. Only `.env.example` belongs in git.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload |
| `npm run build` | Creates an optimised production build (also runs the TypeScript check) |
| `npm run start` | Serves the production build |
| `npm run lint` | Checks code quality with ESLint |

Before opening a pull request, run `npm run lint` and `npm run build`; both must pass.

## Project structure

File names describe what's inside, so you shouldn't need to open a file to know what it is.

```
src/
├── app/                        ROUTES ONLY. Each folder is a URL; files here stay thin.
│   ├── layout.tsx                Wraps every page: fonts, SEO metadata, theme
│   ├── page.tsx                  /            → splash screen
│   ├── onboarding/               /onboarding
│   ├── (auth)/                   Auth pages. "(…)" groups them without adding to the URL
│   │   ├── sign-up/              /sign-up
│   │   ├── login/                /login
│   │   └── forgot-password/      /forgot-password, /verify-code, /new-password
│   ├── globals.css               Brand colours, animations, light/dark theme
│   └── manifest.ts, robots.ts, sitemap.ts, icon.png …   SEO and app-install files
│
├── features/                   One folder per part of the app: its screens and logic
│   ├── splash/
│   ├── onboarding/
│   ├── auth/                     Sign up, log in, shared auth layout, validation, service
│   └── forgot-password/          The 3-step reset flow, its store, service and validation
│
├── components/                 Reusable building blocks shared across screens
│   ├── ui/                       Button, TextField, PasswordField, Checkbox,
│   │                             VerificationCodeInput, PasswordRequirements,
│   │                             FormErrorMessage, LoadingSpinner, IconIllustration
│   ├── icons/                    All app icons (inline SVG)
│   └── brand/                    Logo: symbol and wordmark, white and green versions
│
├── stores/                     App-wide state (Zustand): useAppStore, useThemeStore
├── config/                     site.ts (name, SEO), routes.ts (every URL), theme.ts
├── hooks/                      Shared custom React hooks
├── lib/                        Small helpers (utils.ts, maskContactDetails.ts)
└── types/                      Shared TypeScript types

public/
├── brand/                      Logo files
└── onboarding/                 Onboarding photos
```

## Naming conventions

| Kind of file | Pattern | Example |
|---|---|---|
| A full screen | `…Screen.tsx` | `OnboardingScreen.tsx` |
| A form | `…Form.tsx` | `LoginForm.tsx` |
| A shared page frame | `…Layout.tsx` | `AuthScreenLayout.tsx` |
| Server calls | `…Service.ts` | `authService.ts` |
| Validation rules | `…Validation.ts` | `authValidation.ts` |
| State store | `use…Store.ts` | `useThemeStore.ts` |
| Custom hook | `use….ts` | `useOnboardingSlideshow.ts` |
| URL folders | kebab-case | `forgot-password/verify-code` |

**UI wording:** always **"Log in"** and **"Sign up"**, never "Sign in", "Login" (as a verb) or "Register".

## Coding guidelines

- **`app/` holds routes only.** A page file sets metadata and renders a screen from `features/`.
- **Server Components by default.** Add `"use client"` only when a file needs state, effects, event handlers or browser APIs.
- **Import with `@/`** (`@/` = `src/`), e.g. `import { cn } from "@/lib/utils"`.
- **Navigate with `ROUTES`** from `config/routes.ts`, never with hard-coded URLs.
- **Screens never call `fetch` directly.** All server calls go through a `…Service.ts` file.
- **Validation rules live in one place** (`…Validation.ts`) and are reused, never copied.
- **Comment the *why*.** Every file starts with a short explanation of what it does.

## Design system

| Token | Value | Use |
|---|---|---|
| Brand green | `#13934f` (`brand-600`) | Primary buttons, links, splash screen, active states |
| Background | `#ffffff` | Every screen (light by default) |
| Text | `#0f172a` | Body text |
| Font | Plus Jakarta Sans | All UI text |
| Buttons | Pill-shaped, 60px on touch screens, 52px on desktop | |
| Fields | Soft grey, green when focused, red on error | |

- **Theme:** always white by default, even if the device is in dark mode. Dark mode applies **only** when a user turns it on in Settings (`useThemeStore.setTheme("dark")`); the Settings toggle is still to be built.
- **Motion:** every animation respects the user's "reduce motion" setting.
- Colours and animations are defined once in `src/app/globals.css`.

## Security

This is a financial product, so security is built in from the start.

**In place:**

- Security headers on every page (`next.config.ts`): clickjacking protection (`X-Frame-Options`, CSP `frame-ancestors`), no content-type sniffing, strict referrer policy, HTTPS-only (HSTS), unused browser features disabled. The `X-Powered-By` header is removed.
- All form input is validated with zod. The same rules must be re-checked on the server.
- Password policy is defined once and shown to users as a live checklist.
- Password-reset details live in memory only, never in browser storage, and are cleared when the flow ends.
- Contact details are masked on screen (`and***ley@…`, `+234 ********78`).
- Login errors will use one generic message, so nobody can discover which emails have accounts.

**Rules:**

- Never store tokens or secrets in `localStorage`. Sessions will use secure `httpOnly` cookies.
- Never commit `.env.local` or credentials.

**Needs the backend:** rate limiting and lockouts, reset codes that expire, secure session cookies, and a strict script Content-Security-Policy.

## SEO

- Server-rendered pages with full metadata (titles, descriptions, canonical links)
- Open Graph / Twitter share image, web app manifest, `robots.txt`, `sitemap.xml`
- Private mid-flow pages (e.g. verify code) are marked `noindex`

## Demo mode

The backend isn't built yet. So the password-reset flow can be reviewed end to end, it runs in **demo mode during `npm run dev` only**: any 4-digit code is accepted and each step succeeds.

A production build (`npm run build`) turns demo mode **off**, and screens show a clear "not connected yet" message instead. Nothing is faked in production. Remove demo mode from `src/features/forgot-password/passwordResetService.ts` once the real API is connected.

## Git workflow

- `main` is always deployable. Build new work on a branch, e.g. `feature/dashboard` or `fix/login-error`.
- Write clear commit messages: a short summary line, then what changed and why.
- Open a pull request into `main`. `npm run lint` and `npm run build` must pass.

## Roadmap

- [x] Project setup, brand theme, SEO foundations
- [x] Splash screen
- [x] Onboarding
- [x] Sign up and log in
- [x] Forgot password flow
- [ ] Connect the backend and authentication
- [ ] Identity verification (KYC): ID card, selfie, proof of address
- [ ] Profile setup and security PIN
- [ ] Dashboard and portfolio
- [ ] Settings, including the dark mode toggle

---

<div align="center">

© Feenicks1 Ltd. All rights reserved. This is proprietary software; do not copy or distribute without permission.

</div>
