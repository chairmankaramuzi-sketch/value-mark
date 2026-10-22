# Value Mark: Valuation Management & Report Generation

Internal web application for Value Mark staff to manage valuation assignments from client request through inspection, valuation, review, report generation, approval and delivery.

> **Status:** Frontend Phases 0–1 (foundation and application shell) are done. There is no database, authentication or business data yet. See [Roadmap](#roadmap).

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + Radix UI primitives (shadcn/ui-style components, hand-written in `src/components/ui`)
- Zod for shared client/server validation
- Planned: PostgreSQL + Prisma (B1), authentication (B2), private object storage (B4), server-side PDF (B6)

## Requirements

- Node.js **20.18+** (LTS 22 is recommended)
- npm 10+

## Getting started

```bash
npm install
cp .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. You'll be sent to `/sign-in`.

### Development demo session

Real authentication arrives in Phase B2. Until then, you can exercise navigation and role visibility by setting this in `.env.local`:

```
DEMO_AUTH_ENABLED="true"
```

The sign-in page then shows a clearly marked **Development demo session** panel where you pick a role. A banner on every page shows that you are in demo mode. The demo session:

- only works when `NODE_ENV !== "production"` (always off in `next build`/`next start`);
- contains no data;
- is stored in an httpOnly cookie that sign-out clears.

The normal sign-in form validates input on client and server, then reports that authentication is not configured. It never pretends to succeed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck + build |

## Project structure

```
src/
  app/
    (auth)/sign-in/        Sign-in page and form
    (app)/                 Protected route group (server-side session check)
      dashboard|jobs|clients|inspections|evidence|reports|staff|settings/
      layout.tsx           App shell; redirects to /sign-in without a session
      loading.tsx / error.tsx
    not-found.tsx
  components/
    ui/                    Reusable primitives: Button, Input/Select/Textarea/Field, Card, Badge,
                           Alert, Skeleton, Table, Dialog/Sheet, ConfirmDialog, Tabs, DropdownMenu
    common/                PageHeader + Breadcrumbs, Empty/Error/Loading/AccessDenied states,
                           JobStatusBadge, ModulePage
    layout/                AppShell, SidebarNav, MobileNav, UserMenu, Brand
  config/                  navigation.ts, env.ts (server-only)
  lib/
    domain/                roles.ts (roles + UI permissions), job-status.ts
    validation/            Zod schemas shared by client and server
    types.ts, utils.ts
  server/auth/             session.ts (session resolution), actions.ts (server actions)
```

## Security notes

- Role checks in the UI only control what is *shown*. Every protected page also checks the session and permission **on the server** (`requireUser` / `checkPermission`). Phase B2 adds full server-side authorization for every read/mutation.
- Secrets belong in `.env.local`, which is git-ignored. `.env.example` contains placeholders only.
- Search engines are told not to index the app (`robots: noindex`).

## Branding

The logo is a replaceable text mark (`src/components/layout/brand.tsx`). Colours are CSS tokens in `src/app/globals.css` (`--brand`, etc.). Replace both once Value Mark supplies its official logo and colours.

## Roadmap

| Step | Scope | Status |
|---|---|---|
| FE 0–1 | Foundation, UI kit, app shell, navigation, sign-in UI | ✅ Done |
| B0–B1 | Architecture doc, Prisma schema, migrations, seed | ⏳ Next |
| B2 | Authentication and server-side authorization | ⏳ |
| B3–B4 / FE 2–7 | Clients, jobs, assets, inspections, evidence, files, dashboard | ⏳ |
| B5 / FE 8 | Valuation worksheet (needs company-approved methods) | ⏳ |
| B6 / FE 9 | Report generation and PDF | ⏳ |
| B7 / FE 10 | Review, approval, delivery | ⏳ |
| B8–B10 / FE 11–12 | Search, exports, settings, audit, QA, deployment | ⏳ |

## Known limitations (current phase)

- There's no real authentication: the sign-in form can't sign anyone in yet.
- Module pages show a "not available yet" state. No data is displayed.
