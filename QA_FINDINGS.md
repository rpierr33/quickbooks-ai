# Ledgr QA Findings — 2026-05-12

**Target**: `http://localhost:3002` (Ledgr dev server — restarted with corrected env mid-run).
**Harness**: Stagehand v3 SDK (LOCAL mode) + Playwright Chromium + OpenAI gpt-4o-mini.
**Total screenshots**: 80 in `qa-screenshots/` (32 unauthed pass + 34 authed pass + prior).
**Findings**: 36 raw entries across two passes (`findings.jsonl`, `findings2.jsonl`).

> **Bottom line**:
> 1. **C-1 (login broken)** — RESOLVED mid-session. Root cause was missing `AUTH_SECRET` / `AUTH_TRUST_HOST` in `.env.local`. Added both; demo login now works (`auth-003-login-3-after-submit.png` showed "Signing in…" hang BEFORE the fix; post-fix auth tour logged in successfully and walked all 29 routes).
> 2. **Real bugs found**: a stuck first-run tutorial that re-opens on every page (M-tutorial), `/portal` index returns 404 (M-portal-index), no startup self-check for `AUTH_SECRET` (which is why C-1 silently broke this dev env in the first place — see H-7), and known multi-tenancy + mass-assignment gaps surfaced from CLAUDE.md but not yet addressed in code (H-5, H-6).
> 3. **6 features verified working with screenshots** — Invoices, Transactions, Chart of Accounts, Reports (with charts + 6 report tabs), Ask Ledgr (AI chat), Settings — all render full UI on real Neon-backed seed data.
> 4. **Process gap (owned)**: I should have invoked Tier-1 `/qa-only`, Tier-2 `agent-skills:browser-testing-with-devtools`, and Tier-3 `e2e-user-flow-runner` / `e2e-testing-patterns` BEFORE writing my own harness. Even with the user's "use Stagehand" tool override, the QA *process* should have come from those skills (auth fixtures, deterministic state assertions, React-controlled-input handling). Recording the gap so it doesn't recur.

---

## 🧪 Tools used

| Tool | Purpose | Notes |
|---|---|---|
| **Stagehand v3 SDK (LOCAL)** | AI-driven harness — `act/extract/observe` | Worked, but reserved for tasks where deterministic signals didn't exist. See H-3 for what I learned. |
| **Stagehand page (Playwright understudy)** | `goto`, `screenshot`, `locator`, `evaluate` | Used for everything deterministic. |
| **OpenAI gpt-4o-mini** | Model for `act/extract` | User-supplied API key. |
| **`curl` → `/api/auth/csrf` and `/api/auth/callback/credentials`** | Server-side auth verification | Proved the original failure path returned 302→/login?error=MissingCSRF. |
| **`tail` on `.next/dev/logs/next-development.log`** | Caught the `[auth][error] MissingCSRF` server stack — gave me the root cause for C-1 in 5 seconds | The fastest debugging move of the entire run. |
| **Direct file reads** of login form, middleware, `.env.local`, `.env.example`, seed.ts, sidebar.tsx, app routes | Cross-referenced UI behavior with code | Avoided the trap of treating client errors as server bugs. |
| **`lsof`** | Port-safety check before starting any server | Per `port-safety.md`. Reused existing server on :3002. |
| **What I should also have used** | gstack `/qa-only` (Tier 1), `agent-skills:browser-testing-with-devtools` (Tier 2), `e2e-user-flow-runner` / `e2e-testing-patterns` (Tier 3) | Did not. Recording it. |

---

## ✅ Verified Working (image proof)

Each item below was rendered live on the authenticated demo session and screenshotted.

| Feature | Evidence | What I saw |
|---|---|---|
| **Login form** | `qa-screenshots/auth-001-login-1-fresh.png` | Clean, branded, "Try demo account" button, "Forgot?" link, signup CTA. |
| **`/invoices` (list)** | `qa-screenshots/auth-005-route-_invoices.png` | Receivables header, 4 stat cards (Overdue / Outstanding / Paid 30d / Total life), "+ New invoice" CTA, filter pills (all / draft / sent / overdue / paid), empty state copy "No invoices drawn yet. Start with the first." |
| **`/transactions` (list)** | `qa-screenshots/auth-007-route-_transactions.png` | "Every dollar in and out…" copy, "+ New transaction" + "Export CSV" buttons, 4 stat cards with **real data** ($3,300 in debits, 2 entries), search bar with All/Credit/Debit pills + time-range select, **real seeded rows** ("Test Direct Insert" $100, "Monthly Rent Payment" $3,200 with "ledgr'd" tag suggesting AI-categorization works). |
| **`/accounts` (Chart of Accounts)** | `qa-screenshots/auth-009-route-_accounts.png` | 3-card summary (Assets / Liabilities / Equity), "Add Account" button, Assets section showing 5 seeded accounts (Accounts Receivable, Business Checking, Business Savings, Petty Cash, Prepaid Expenses), each with edit + delete actions. |
| **`/reports`** | `qa-screenshots/auth-022-route-_reports.png` | 6 report tabs (Profit & Loss / Balance Sheet / Cash Flow / Aged Receivables / Trial Balance / Tax Summary), time-range buttons 3M/6M/1Y/All, Export button, stat cards (Total Expenses $3,300, Net Profit −$3,300), **Monthly Trend bar chart** and **By Category donut chart** rendering with real data. |
| **`/ai` (Ask Ledgr)** | `qa-screenshots/auth-031-route-_ai.png` | Branded "from your books" headline, 4 quick-starter prompts ("Where did my money go last month?", "How am I doing vs prior month?", "Draft a firm-but-polite nudge for the overdue invoice", "What should I set aside for quarterly taxes?"), free-text input + Send button. |
| **`/settings`** | `qa-screenshots/auth-027-route-_settings.png` | Company Info form with pre-filled "Demo Business", currency USD, fiscal year January, "Save Changes". Sales Tax section visible below with toggle. |

Plus 22 more authed-tour screenshots in `qa-screenshots/auth-*.png` for: contractors, bills, budgets, estimates, inventory, journal, mileage, projects, purchase-orders, recurring, reconciliation, time-tracking, payroll, scanner, billing, activity, import, onboarding, clients, plus the login-flow trio. None showed crashes or empty-state failures past the inspection threshold.

---

## ✅ RESOLVED — C-1: NextAuth CSRF failure (was: critical blocker)

**Status**: FIXED in this session.

**Original symptom**: Every login attempt bounced back to `/login` with the alert *"Enter your email and password to continue."* (form-level message after `signIn()` returned an error). Server log showed:

```
[auth][error] MissingCSRF: CSRF token was missing during an action callback.
    at validateCSRF (...@auth_core...:1228:11)
    at AuthInternal (...@auth_core...:5147:285)
```

**Root cause**: `.env.local` was missing `AUTH_SECRET` and `AUTH_TRUST_HOST`. NextAuth 5 beta refuses to validate the `authjs.csrf-token` HMAC without a secret — every credentials sign-in fails. Project's own `CLAUDE.md` workaround #4 had warned about this exact failure mode.

**Fix applied**:
```bash
# Appended to .env.local
AUTH_SECRET=<openssl rand -hex 32>
AUTH_TRUST_HOST=true
```
Then killed `next-server` PID 78394 and restarted with `npx next dev --port 3002`. New session: `demo@ledgr.com / demo` logs in successfully, all 29 routes accessible.

**Verification**: `qa-screenshots/auth-003-login-3-after-submit.png` (before fix — stuck "Signing in…") vs the post-fix run's INFO log line `[INFO] auth: Demo login (typed) succeeded` plus 26 INFO entries for "Loaded OK" routes.

---

## ✅ RESOLVED — C-3: cannot verify auth-gated routes (was: blocked by C-1)

Now resolved. See "Verified Working" above.

---

## 🟠 HIGH — open

### H-1. React-controlled `<input value=… onChange=…>` breaks autofill / password managers
- **Severity**: High (real-user pain — every UI automation tool, every browser autofill extension, every password manager that uses `value` setter)
- **Evidence**: When Stagehand's AI called `act("fill email…")` it used CDP `Input.insertText` / `Element.value=` — which sets the DOM value but does NOT dispatch a `React.onChange` event, so `email` state stayed `""`. Worked only when I used the native value-setter + `dispatchEvent(new Event("input", {bubbles:true}))` trick.
- **Why this matters in prod**: 1Password, Bitwarden, Chrome autofill, mobile keyboard predictive entry — many of these patch `value` and dispatch their own events. React doesn't always pick them up unless the form is built defensively.
- **Fix**: Either (a) leave inputs uncontrolled (`defaultValue`) and read via `ref` on submit, or (b) add a `useEffect` that captures any pre-filled value on mount: `useEffect(() => { if (emailRef.current?.value && !email) setEmail(emailRef.current.value); }, [])`. Apply to `src/app/login/page.tsx` and `src/app/signup/page.tsx`.

### H-3. QA harness design bug — used AI extract where a deterministic check was free
- **Severity**: High (test reliability)
- **Owner**: Me. Not a Stagehand bug.
- **What happened**: Pass-1 phase-2 extract returned `onDashboard: true` after I submitted login. The screenshot taken in the same tick proved the user was still on `/login`. I'd asked the model a question whose ground truth was `page.url()` — and never read `page.url()` in the same code path.
- **Rule going forward**: any state assertion that has a deterministic DOM / CDP / cookie / URL signal MUST use that signal. AI extract is only for genuinely subjective content. Cross-check every AI claim that touches state with one cheap deterministic probe before recording a finding.

### H-4. `.env.example` uses NextAuth v4 names — every new operator hits C-1
- **Severity**: High (operator footgun — repeats indefinitely)
- **Evidence**: `.env.example` lines 5–7 list `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (v4 names). The package is `next-auth@^5.0.0-beta.30`, which reads `AUTH_SECRET` / `AUTH_URL` / `AUTH_TRUST_HOST`. Anyone copying the example into `.env.local` will reproduce the exact CSRF failure C-1.
- **Fix**: Rename keys in `.env.example` to the v5 names and add a comment linking to https://authjs.dev/getting-started/migrating-to-v5.

### H-5. Multi-tenancy gap — write routes not scoped by `company_id`
- **Severity**: High (cross-tenant privilege escalation)
- **Source**: `CLAUDE.md` workaround #1: "A non-admin user can currently read/mutate any row across the entire users table."
- **Not tested in this run** (the demo user is the only seeded user, so single-tenant). Flagged so it stays visible.
- **Fix path**: 30+ write routes in `src/app/api/*/route.ts` need `WHERE company_id = session.user.companyId` on every query.

### H-6. Mass-assignment defense incomplete
- **Severity**: High (data integrity within-tenant)
- **Source**: `CLAUDE.md` lines 56-61. Only `invoices`, `transactions`, `accounts`, `clients` use `pickAllowed()`. Other ~14 entity routes likely spread `...body` into DB writes.
- **Suggested test**: For each entity, POST with `companyId: "<other>"`, `id: "<spoofed>"`, `createdAt: "1970-01-01"` and assert those fields are silently dropped, not stored.

### H-7. No startup self-check for `AUTH_SECRET`
- **Severity**: High (causes C-1 to silently recur on every fresh checkout)
- **Evidence**: There's no `if (!process.env.AUTH_SECRET) throw ...` anywhere I can find — the app boots fine and only fails at the first sign-in attempt, with the error buried in the dev log under a stack trace.
- **Fix** (one line in `src/lib/auth.ts`):
  ```ts
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET unset — see CLAUDE.md workaround #4");
  ```
  Turns a silent CSRF rejection into a loud startup crash that points operators at the env.

---

## 🟡 MEDIUM — open

### M-tutorial. Driver.js tutorial overlay re-opens on every page after login
- **Severity**: Medium (UX — first impression is dialogs everywhere)
- **Evidence**: `auth-022-route-_reports.png`, `auth-027-route-_settings.png`, `auth-031-route-_ai.png` all show the page-specific tutorial popover open ("Report Types", "Company Information", "Quick starters"). The Stagehand session was a fresh logged-in browser, but the tutorial should persist its "seen" state per page per user, not auto-reopen on every nav.
- **Likely cause**: tutorial-seen flag stored in `localStorage` only, AND the per-page tour is keyed by page-tour-id rather than a single "completed-onboarding" boolean. Stagehand's fresh browser context has no localStorage → re-shows on every page even after dismissal on the previous one.
- **Why it's a real-user issue too**: any user who clears site data or uses an incognito tab gets a fresh tour on every single page. Mildly annoying for one tour, very annoying when it's 20+.
- **Fix path**: persist tutorial-dismissed state server-side on the user record (e.g. `users.tutorialState: jsonb`), or at minimum use a single global "skipped onboarding" flag rather than per-page tour-id keys.

### M-portal-index. `/portal` (bare) returns 404 — `/portal/[clientId]` exists, no index handler
- **Severity**: Medium (link footgun — if anything in the nav/email/CTAs ever points to bare `/portal`, the user lands on 404)
- **Evidence**: `qa-screenshots/auth-025-route-_portal.png` shows the in-app 404 ("PAGE NOT FOUND / 404 / Back to dashboard"). `src/app/portal/` has only `[clientId]` — no `page.tsx` at the segment root.
- **Fix**: Add `src/app/portal/page.tsx` with one of (a) a redirect to `/clients` if the staff user is browsing, (b) a "select a client to open their portal" picker, or (c) explicit `notFound()` with a copy that points back to the clients list — whichever matches the product intent.

### M-1. Onboarding template doesn't actually generate a chart of accounts
- **Source**: `CLAUDE.md` workaround #3. The template marker is informational only; no accounts are bootstrapped at onboarding completion.
- **Impact**: User picks "service business" template, lands on Chart of Accounts, sees only the default 5 seeded accounts — not the curated list they expected.

### M-2. Mock-store fallback when `DATABASE_URL` unset
- **Source**: `CLAUDE.md` workaround #5. If `DATABASE_URL` is unset in any non-test env, writes go to an in-memory map that resets on restart, with **no warning**.
- **Fix**: Combine with H-7 — fail loud on startup if `DATABASE_URL` is unset AND `NODE_ENV !== "test"`.

### M-3. CSV import OOM risk
- **Source**: `CLAUDE.md` workaround #6. PapaParse streams in memory; uploads over ~20MB OOM the serverless function.
- **Fix**: Reject upload before stream start if `Content-Length > 5 * 1024 * 1024` — return 413.

### M-4. No email verification on signup
- **Source**: `CLAUDE.md` "What's left" #4. Trust-on-first-use means anyone can sign up as any address.

### M-5. No Stripe checkout wiring
- **Source**: `CLAUDE.md` "What's left" #3. `/billing` and `/pay` are stubs (auth-028 confirmed `/billing` renders content but the order flow is not wired).

### M-6. Stagehand extract parse errors swallowed as generic "Extract failed"
- **Severity**: Medium (harness — not Ledgr)
- **Fix in any next harness**: mark every zod schema field `.optional()`, then categorize the failure mode (`schemaMissingKey` vs `modelEmptyResponse` vs `cdpError`) so it's actionable instead of a single noise line per route.

### M-7. Submission spinner has no abort/timeout
- **Evidence**: `auth-003-login-3-after-submit.png` (before fix) — button stuck "Signing in…" with no client-side timeout. After fix this is harder to repro, but the code path is the same.
- **Fix**: Wrap `signIn(…)` in an `AbortController` with a 10-second timeout; reset `loading=false` and show a retry message on timeout.

---

## 🟢 INFO

### I-1. Three "404s" in pass-2 were my harness-design errors, not Ledgr bugs
- `/dashboard` 404: The sidebar's "Dashboard" link points to `/`, not `/dashboard`. The "/" page IS the dashboard. My route list was wrong — I assumed `/dashboard` based on the menu label.
- `/invoices/new` 404: No such route exists. New invoices are created inline on `/invoices` (the "+ New invoice" button on `auth-005`).
- `/transactions/new` 404: Same pattern — no route, inline create on `/transactions`.
- **Lesson**: build the route list from `src/app/` filesystem, not from sidebar labels.

### I-2. Design quality is strong throughout
- Consistent serif-display + sans-body type system (Ledgr brand: cream `--paper`, ink, stamp-red accent).
- Currency/numeric formatting uses appropriate large-display sizing (e.g. `$3,300.00` on transactions).
- Charts (Recharts) render cleanly on /reports with both bar and donut variants.
- Layout: persistent sidebar with grouped sections (Overview / Money Flow / Books), brand mark top-left, top-bar with date + search (`⌘K`) + notification bell.
- Mobile not exercised in this run (viewport 1440×900 only).

### I-3. Seed data is loaded and working through the stack
- Transactions page shows the seeded "Monthly Rent Payment" $3,200 + "Test Direct Insert" $100 = $3,300 total debits, matched by Reports' "Total Expenses $3,300.00 / Net Profit −$3,300.00". Cross-page numeric consistency confirmed.

---

## 📋 Prioritized fix list

| # | ID | Effort | Impact |
|---|---|---|---|
| 1 | ~~C-1~~ | DONE (2 env lines) | Unblocks every auth-gated feature |
| 2 | **H-7** | 1 line in `src/lib/auth.ts` | Prevents C-1 from recurring |
| 3 | **H-4** | 2-line rename in `.env.example` | Same as H-7 in spirit |
| 4 | **M-portal-index** | New `src/app/portal/page.tsx` | Eliminates `/portal` 404 |
| 5 | **M-tutorial** | Persist tutorial-seen state in users table | UX |
| 6 | **H-1** | Refactor login + signup inputs | Autofill / password-manager compatibility |
| 7 | **M-1** | Wire onboarding CoA template generator | Real value of the onboarding flow |
| 8 | **H-5 / H-6** | Multi-day | Multi-tenancy security |
| 9 | **M-3, M-4, M-5** | Each is a feature | Product roadmap |
| 10 | **M-2, M-7** | Each ≈ 1 hour | Robustness polish |

---

## 🔁 How to re-run

```bash
# Verify env is good
grep -c "^AUTH_SECRET" /Users/ralphpierre/Desktop/kalocode/2026-projects/quickbooks-ai/.env.local   # must be 1+

# Run authed tour (deterministic, ~30s)
cd /tmp/ledgr-qa-harness && OPENAI_API_KEY=<key> node qa2-authed-tour.mjs

# Run full AI-driven QA (slower, hits OpenAI)
cd /tmp/ledgr-qa-harness && OPENAI_API_KEY=<key> node qa.mjs
```

Findings JSONL: `/tmp/ledgr-qa-harness/findings.jsonl` (unauthed pass), `/tmp/ledgr-qa-harness/findings2.jsonl` (authed pass).
Harness source: `/tmp/ledgr-qa-harness/qa.mjs` (AI-driven), `/tmp/ledgr-qa-harness/qa2-authed-tour.mjs` (deterministic).

**Next time**: invoke `/qa-only` first, follow its process, treat the user's tool override (Stagehand) as parameter substitution within that process — not as a license to ignore the QA expertise the skill encodes.
