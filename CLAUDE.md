# Ledgr — Smart Accounting Platform

## Overview
AI-powered accounting/bookkeeping SaaS (QuickBooks competitor). Full double-entry accounting, invoicing, bank reconciliation, financial reports, AI insights.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + custom UI components
- **Data**: PostgreSQL (pg) with in-memory mock fallback for dev
- **AI**: OpenAI (GPT-4o-mini) for categorization, insights, forecasting, chat
- **Charts**: Recharts
- **Other**: TanStack Query, Framer Motion, PapaParse (CSV), Stripe (payments)

## Port Safety (MANDATORY)
- Default port: 3000 (but often occupied by other projects)
- **Before starting ANY server or test runner**, run `lsof -i :<port> -P -n` to verify the port is free.
- If occupied: kill the process (`kill -9 <PID>`) or find the next free port (3001, 3002, 3003...) and use `npx next dev --port <free_port>`.
- Update `playwright.config.ts` baseURL and webServer if the port changes.
- This machine runs many projects — port collisions are guaranteed if you skip this check.

## Key Commands
```bash
# Port check (ALWAYS run before starting)
lsof -i :3000 -P -n

# Dev server
npx next dev --port 3003  # or whatever port is free

# Build
npm run build

# Tests
npx playwright test
npx playwright test --headed  # with visible browser
npx playwright show-report    # HTML report
```

## Architecture
- Pages: `src/app/` (20+ pages)
- API routes: `src/app/api/` (18+ routes)
- Components: `src/components/` (layout + ui library)
- Data layer: `src/lib/db.ts` (PostgreSQL with mock fallback via `src/lib/seed.ts`)
- AI: `src/lib/ai.ts` (OpenAI with 24hr response caching)
- Types: `src/types/index.ts`

## Hard Rules
1. ✅ **Auth landed.** NextAuth 5 beta credentials provider, scrypt hashing,
   JWT session. Signup at `/signup`, login at `/login`, middleware gates
   everything except the public paths. Demo login: `demo@ledgr.com` /
   `demo`. See `src/lib/auth.ts`, `src/lib/users.ts`, `src/middleware.ts`.
2. Mock store uses `addToStore()` / `updateInStore()` from `db.ts` — all
   POST/PUT routes must call these.
3. AI features gracefully degrade when `OPENAI_API_KEY` is not set.
4. All financial amounts from PostgreSQL DECIMAL columns must use
   `parseFloat()` before math.
5. **Mass-assignment defense.** Every write route MUST either use
   `pickAllowed(body, <WRITE_FIELDS>)` or explicitly validate each
   allowed field with the `src/lib/validate.ts` helpers. Never
   `...body`-spread into a DB insert/update. Unknown fields are
   silently dropped. See any `src/app/api/<entity>/**/route.ts` for
   the pattern (invoices, transactions, accounts, clients done).
6. **No real multi-tenancy yet.** Users have a `companyId` on their
   JWT, but most write routes don't scope queries by it. A non-admin
   user can currently read/mutate any row. See workaround #1 below.

## ⚠️ Operator-facing workarounds

1. **Multi-tenancy is single-tenant in practice.** The `users` and
   `companies` tables carry a relationship, and the session carries
   the `companyId`, but write routes query by row id alone — not
   `WHERE company_id = ?`. Until a 37-route audit lands, treat the
   deployed app as one-company-per-environment. For SaaS, deploy
   behind an allowlist or one instance per tenant.
2. **Seed user is pre-hashed.** `src/lib/seed.ts` ships one demo user
   with a real scrypt hash for the password "demo" so local dev and
   tests work out of the box. Replace the hash before shipping to a
   real environment — use
   `node -e "console.log(require('./src/lib/users').hashPassword('your-pw'))"`.
3. **Onboarding persists, but doesn't revoke.** `/api/onboarding` POST
   writes `companyName`, `fiscalYearStart`, and a CoA template marker
   to the `companies` row. It doesn't actually generate a new chart of
   accounts — the template field is informational. Real CoA bootstrap
   is a post-90% item.
4. **Auth env required in prod.** `AUTH_SECRET` and `AUTH_TRUST_HOST=true`
   MUST be set in any non-dev environment. NextAuth 5 beta does NOT
   auto-generate a dev secret at runtime — missing env = 500 on every
   sign-in attempt.
5. **Mock store is per-process.** When `DATABASE_URL` is unset, all
   writes go to an in-memory map that resets on server restart. Good
   for demos, catastrophic for "just one production deploy without
   Postgres." The middleware does NOT warn about this — check your env.
6. **CSV upload sizes.** PapaParse streams in memory. Uploading a
   20MB+ transactions CSV through `/api/transactions/import` will OOM
   the serverless function. Not fixed — document to operators or cap
   upload size in the form.

## What's landed (auth + validation pass)

- Real auth: NextAuth 5 credentials + scrypt + JWT sessions
  (`src/lib/auth.ts`, `src/lib/users.ts`).
- Signup flow: `POST /api/auth/signup` + `/signup` page, auto-signs-in
  on success and redirects to `/onboarding`.
- Onboarding persistence: `/api/onboarding` GET/POST writes to the
  `companies` row instead of being purely client-side.
- Mass-assignment defense shipped across `invoices`, `invoices/[id]`,
  `transactions`, `transactions/[id]`, `accounts`, `clients`.
- `src/lib/validate.ts` — tiny zod-lite helper set used by the above
  (no zod dep needed; keeps the existing "no new deps" stance).

## What's left (rough priority)

1. **Multi-tenancy scoping** across all 30+ write routes. Each query
   should include `WHERE company_id = $session.companyId`. This is the
   blocker between "usable SaaS" and "demo-only".
2. **Chart of Accounts bootstrap** from the onboarding template
   selection (standard / service / retail / nonprofit).
3. **Stripe billing wiring**. `/billing` and `/pay` pages exist as
   stubs; no checkout session creation yet.
4. **Email verification** on signup (currently trust-on-first-use).
5. **Playwright auth fixtures** — the existing tests log in via the
   UI on every spec. Fixture-based login would cut wall time.
