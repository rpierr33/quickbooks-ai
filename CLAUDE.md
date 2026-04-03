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
1. No authentication exists yet — this is the #1 priority before deployment
2. Mock store uses `addToStore()` / `updateInStore()` from `db.ts` — all POST/PUT routes must call these
3. AI features gracefully degrade when OPENAI_API_KEY is not set
4. All financial amounts from PostgreSQL DECIMAL columns must use `parseFloat()` before math
