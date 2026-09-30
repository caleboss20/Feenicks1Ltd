# Feenicks1

Web app for the Feenicks1 investment platform, built with **Next.js 16** (App Router), **TypeScript** and **Tailwind CSS v4**.

## Getting started

```bash
npm install     # install dependencies (first time only)
npm run dev     # start the dev server at http://localhost:3000
npm run build   # production build (also type-checks)
npm run lint    # check code style
```

## Folder structure

```
src/
├── app/            ROUTES ONLY. Each folder becomes a URL.
│   ├── layout.tsx    Root layout: wraps every page (<html>, fonts, globals.css)
│   ├── page.tsx      The "/" page (placeholder until the splash screen is built)
│   └── globals.css   Tailwind import + theme colours
├── components/
│   ├── ui/           Small reusable building blocks (Button, Input, Card…)
│   └── layout/       Page chrome shared by many pages (Navbar, Sidebar, Footer…)
├── hooks/          Custom React hooks (useSomething), client-side only
├── config/         App-wide settings (site.ts: app name, description)
├── lib/            Helper functions and service code (utils.ts)
└── types/          Shared TypeScript types
public/             Static files served as-is (images, icons)
```

### Rules of thumb

- **`app/` holds routes, not reusable code.** Put a component in `components/` if more than one page uses it.
- **Server Components are the default.** Add `"use client"` at the top of a file only when it needs
  state, effects, event handlers, or browser APIs.
- **Import with `@/`**, e.g. `import { cn } from "@/lib/utils"`. It always points at `src/`, so there's no `../../..`.
- **Route groups** like `(auth)` are folders in parentheses. They group routes and share a layout
  **without** adding to the URL: `app/(auth)/login/page.tsx` → `/login`.
