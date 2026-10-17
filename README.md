<div align="center">

# Feenicks1

**A mobile-first investment app for Ghana: invest from GH₵ 140 with Mobile Money, track your portfolio and withdraw on clear terms.**

Built for **Feenicks1 Solutions Ltd** · [Live demo](https://feenicksoneltd.vercel.app) (demo mode, no real money)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=fff)
![Status](https://img.shields.io/badge/status-frontend%20complete%2C%20backend%20pending-c9a227)

</div>

---

## What it is

Feenicks1 is the customer app for a Ghanaian investment company. People sign up, verify their identity, pick one of four portfolios (from GH₵ 140), pay in with Mobile Money, follow their returns and withdraw under published rules. It's a web app that installs on a phone like a native app.

**Honest status:** the whole customer experience is built and works end to end, but it runs on a **demo backend in the browser** (no server, no real payments yet). Every place that will call the real API is marked `TODO(api)`, so connecting a backend doesn't mean rewriting screens. See [What's not built yet](#whats-not-built-yet).

## What works today

**Getting started**
- Animated splash, a welcome slideshow, sign-up, log-in and a three-step password reset
- Identity verification flow: Ghana Card upload, selfie, proof of residency, profile
- Investor risk questionnaire that recommends a portfolio, with a plain-language guide to each

**Investing and money**
- Four portfolios with their terms, minimums, fees and return ranges, and a returns calculator
- Investing with Mobile Money: amount, confirmation, then a simulated approval prompt
- Wallet card per portfolio, with a hidden-balance mode
- Withdrawals with the company's rules built in (each portfolio's withdrawal window, a fee-free period, processing time), a step-by-step guide and status tracking
- Transactions with filters, details, and shareable receipts (as images)

**Records and trust**
- Account statements as **PDF or Excel**, plus a proof-of-funds letter. Each document carries a reference number and QR code that anyone can check at `/verify/[number]`
- Notifications for real account events (log-ins, security changes, payments)
- Security centre: devices, recent activity, sign out everywhere
- Legal centre (terms, privacy, fees), currently marked "draft for legal review"

**Security features**
- 4-digit PIN that locks the app after 5 minutes idle
- Two-factor options: SMS code, authenticator app (TOTP, RFC 6238), fingerprint or Face ID (WebAuthn)
- Passwords and PINs are stored only as salted PBKDF2 hashes, even in demo mode
- Security headers on every page (CSP `frame-ancestors`, HSTS, `nosniff`, a strict referrer policy and a Permissions-Policy)

**Everything else**
- Referral programme with a personal QR code and WhatsApp sharing
- Help centre with FAQs and a contact form
- Analytics: portfolio value over time, with a labelled "sample data" preview mode
- Installable as an app (with an "Add to home screen" prompt), pull down to refresh, loading skeletons, offline banner and error screens

## Engineering decisions worth noting

- **A service layer between screens and data.** Screens never fetch data directly; they call `…Service.ts` files. Today those read the demo store, and later they call the API. The demo is a stand-in backend, not mock data baked into the UI.
- **Money is handled carefully.** Amounts are formatted in one place (`lib/money.ts`), fees and returns are calculated in one module (`features/packages/investmentPackages.ts`), and withdrawal rules come from one source shared by the screens, the guide and the legal text.
- **Honest data.** There are no fake balances. A new account is empty until it invests. A clearly labelled sample year can be switched on for previews, and it never mixes with real activity.
- **Accessibility.** Screens were audited with axe-core. The app supports keyboard and screen-reader use, reduced motion is respected everywhere (every animation has a still fallback), and colour contrast was checked against the brand palette.
- **Performance on real networks.** Full-screen images are sized for tall phone screens, all welcome slides load up front and never appear half-loaded, and the PDF and Excel libraries load only when you export.
- **Readable code.** Every file opens with a comment explaining what it does and why, names describe contents (`WithdrawScreen.tsx`, `withdrawalService.ts`), and there's one `ROUTES` map for every URL.

## What's not built yet

| Area | Status |
|---|---|
| Backend and database | Not started. The demo stores accounts in the browser's localStorage |
| Real payments | Mobile Money is simulated; it needs a licensed provider (e.g. Paystack or Hubtel) |
| Real identity checks | The KYC screens exist; ID and selfie verification need a KYC provider |
| SMS and email delivery | Codes are accepted but not sent; any code of the right length works in demo mode |
| Admin panel | Not started |
| Automated tests | None yet. Quality so far relies on TypeScript (strict), ESLint and manual testing on phone-sized screens |
| Legal text | Drafts awaiting a lawyer's review |

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` (forest green, gold, Inter and Inter Tight) |
| State | Zustand |
| Forms and validation | react-hook-form + zod |
| Documents | jsPDF (PDF), write-excel-file (Excel), qrcode |
| Hosting | Vercel (every push to `main` deploys) |

## Run it locally

Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/caleboss20/Feenicks1Ltd.git
cd Feenicks1Ltd
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Demo mode is on by default (`NEXT_PUBLIC_DEMO_MODE`): create any account, and any verification code of the right length is accepted. To start over, clear the site's data in your browser.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (includes the TypeScript check) |
| `npm run lint` | ESLint |

## Project structure

```
src/
├── app/          Routes only: each folder is a URL; pages stay thin
├── features/     One folder per area (auth, kyc, packages, payments, withdraw,
│                 statements, security, …): its screens, logic and service
├── components/   Shared UI (buttons, fields, sheets, skeletons), icons, brand
├── demo/         The in-browser stand-in backend (delete when the API is live)
├── config/       Site settings, ROUTES, demo-mode switch, company details
├── lib/          Small helpers: money, phone numbers, TOTP, WebAuthn, refresh
└── stores/       App-wide state (Zustand)
```

---

<div align="center">

Built by [@caleboss20](https://github.com/caleboss20)

© Feenicks1 Solutions Ltd. All rights reserved. Proprietary software; do not copy or distribute without permission.

</div>
