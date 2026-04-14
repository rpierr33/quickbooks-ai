# Ledgr — Investor Pitch

---

## The One-Liner

**Ledgr is AI-powered accounting that costs 50–78% less than QuickBooks — with features they charge $275/month for, starting at $29.99/month.**

---

## The Problem

### 30 Seconds

Picture Marcus. He runs a four-person landscaping business doing $380,000 a year. He pays $115 a month for QuickBooks Plus — $1,380 a year — just to track his tools in inventory and set a budget. He called their support line last fall. Forty-seven minutes on hold. The agent could not answer his question.

QuickBooks has 80% of the U.S. small business accounting market. They have a **1.1 out of 5 stars** on Trustpilot. 93% of reviewers gave them a single star. Not 2. Not 3. One.

They have raised prices every year since 2018. The entry plan that cost $15/month eight years ago is $38/month today. The plan with AI features, budgeting, and inventory is $275/month — more than $3,200 a year.

33 million small businesses in the United States need accounting software. Most of them are overpaying for software they hate, from a company that has no competitive reason to improve.

**The pain is real. The market is enormous. The incumbent is vulnerable.**

---

## The Solution

### 30 Seconds

Ledgr is an AI-native accounting platform that gives every small business — from a solo freelancer to a 50-person company — enterprise-grade financial tools at a fraction of what they currently pay.

**For the freelancer (Sara, 32, graphic designer):**
Create invoices, track expenses, run a P&L, and ask an AI assistant "how much have I made this year?" — all starting at $29.99/month. A 14-day free trial gives her full Professional access before she pays a dollar.

**For the small business owner (Marcus, landscaping company):**
Inventory tracking, budgeting, bank reconciliation, AI transaction categorization, and 7 financial reports — $59.99/month. That's $55 less per month than QuickBooks Plus.

**For the growing company (Priya, 12-person e-commerce brand):**
Custom roles, API access, audit trail, AI insights, cash flow forecasting, and dedicated support — $139.99/month. QuickBooks charges $275/month for the same.

One product. Every tier. AI included. Pricing that doesn't punish growth.

---

## What We've Built

The platform is complete. No prototype. No wireframes. A fully functional, production-ready product:

**Core Accounting**
- Full double-entry accounting with Journal Entries
- Chart of Accounts (4 templates: standard, service, retail, nonprofit)
- Bank reconciliation workflow
- 7 financial reports: P&L, Balance Sheet, Cash Flow, Tax Summary, Trial Balance, Aged Receivables, General Ledger

**Business Operations**
- Invoice creation with professional PDF output
- Estimate creation and one-click conversion to invoice
- Client management
- Inventory management
- Recurring transactions
- CSV import for bulk transaction upload
- Activity log / audit trail on all changes

**AI Features (every plan)**
- AI chat assistant — ask questions about your finances in plain English
- AI transaction categorization — auto-classifies every transaction
- AI cash flow forecasting — 30/60/90-day projections
- AI insights panel — anomaly alerts and trend narratives
- Receipt scanner with OCR — create expenses from photos

**Infrastructure**
- NextAuth 5 authentication with scrypt password hashing
- Stripe integration (payment processing, pending activation)
- Plaid integration (bank feeds, pending activation)
- PostgreSQL database with mock fallback for zero-config dev

**Stack:** Next.js 16, React 19, TypeScript 5, PostgreSQL, OpenAI GPT-4o-mini, TanStack Query, Tailwind CSS 4, Framer Motion, Stripe, Plaid

---

## How It Works

**The full user journey in 6 steps:**

1. **Sign up** — 14-day free trial, full Professional access, no credit card required
2. **Connect your bank** — Plaid integration pulls transactions automatically
3. **AI categorizes everything** — GPT-4o-mini classifies transactions against your chart of accounts; review and confirm with one click
4. **Review your dashboard** — Real-time P&L, cash position, revenue vs. expenses, and accounts receivable
5. **Generate reports** — One click to produce P&L, Balance Sheet, Cash Flow, or Tax Summary — formatted, accurate, ready for your accountant
6. **Ask your AI assistant** — "What was my busiest month?" "How much did I spend on contractors?" "Am I on track to hit my budget?" The AI answers in plain English from your live data

The entire workflow requires zero accounting knowledge. If you can read a bank statement, you can use Ledgr.

---

## Why It's Different

### Side-by-Side Comparison

| | Ledgr Professional ($59.99/mo) | QuickBooks Plus ($115/mo) | FreshBooks Plus ($55/mo) |
|--|-------------------|--------------------------|-------------------------|
| AI chat assistant | Yes | No | No |
| AI cash flow forecast | Yes | No | No |
| AI transaction categorization | Yes | Basic | No |
| Receipt scanning | Yes | Add-on cost | Yes |
| Inventory management | Business tier ($99.99) | Yes | No |
| Budgeting | Yes | Yes | No |
| Activity log / audit trail | Yes | No | No |
| Financial reports | 7 included | 40+ | 5 |
| Journal entries (double-entry) | Yes | No (Simple Start) | No |
| Users included | 3 | 5 | 1 |
| Monthly price | **$59.99** | **$115** | **$55** |
| Annual savings vs. alternative | — | **$660/year** | **Comparable price, more features** |
| Trustpilot rating | — | 1.1/5 | 2.8/5 |

**The headline number: Ledgr Professional is 48% cheaper than QuickBooks Plus and includes AI features QuickBooks does not offer at any price below $275/month.**

---

## Business Model

### Four Revenue Streams

**1. Subscription (primary — live at launch)**

| Tier | Price | Target Customer |
|------|-------|----------------|
| Free Trial | 14 days, full Professional access | All new signups — high-intent lead capture |
| Starter | $29.99/mo ($23.99 annual) | Solo entrepreneurs, freelancers |
| Professional | $59.99/mo ($47.99 annual) | Small teams, growing businesses |
| Business | $99.99/mo ($79.99 annual) | Growing companies (10 users, inventory, POs) |
| Enterprise | $139.99/mo ($111.99 annual) | Accounting firms, multi-entity businesses |
| Payroll Add-on | $20/mo + $5/employee | Business + Enterprise subscribers |

**2. Payment processing (Q3 2026)**
0.5% fee on invoices paid through Ledgr. At 2,000 paying users invoicing an average of $8,000/month, this generates $80,000/month in GMV and scales to $32,000/month by Year 2 with 20% GMV participation.

**3. Accountant partner tier (Q4 2026)**
$99/month per CPA firm. Unlimited client organizations. Accountants recommend Ledgr to clients — each firm is a distribution channel, not just a customer.

**4. API access (Enterprise+)**
Metered at $0.01/call above 10,000 calls/month. Targets financial services integrations, e-commerce platforms, and custom reporting pipelines.

### Unit Economics

- **Blended ARPU (paying, Month 12 mix):** $55/month
- **Gross margin:** 82%
- **Target monthly churn:** 2.5%
- **LTV:** $1,804
- **Target CAC:** $200
- **LTV:CAC ratio:** 9.0x
- **CAC payback:** 4.5 months

---

## Market Opportunity

| Metric | Value | Source |
|--------|-------|--------|
| U.S. small businesses | 33.2M | SBA, 2024 |
| U.S. SMB accounting software TAM | $8.3B | IBISWorld, 2025 |
| Global accounting software (2026) | $20.4B | Grand View Research, 2025 |
| Global market CAGR | 8.5% | Grand View Research, 2025 |
| QuickBooks U.S. market share | ~80% | Industry estimates |
| QuickBooks Trustpilot (April 2026) | 1.1/5 | Trustpilot |
| QuickBooks 1-star reviews | 93% | Trustpilot |
| Addressable switchers (high intent) | ~2.3M | Derived from complaint volume and churn data |

**Why now:** AI-native accounting tools are 2–3 years behind AI-native tools in adjacent categories (CRM, project management). The window to become the AI-first accounting platform for SMBs is open. QuickBooks' AI features are late and gated behind its most expensive tier. The window will close in 3–4 years as incumbents catch up.

---

## Financial Projections

| Year | Paying Users | ARR | Revenue |
|------|-------------|-----|---------|
| 2026 (launch year) | 2,000 | $1.32M | $585K |
| 2027 | 6,500 | $4.3M | $3.6M |
| 2028 | 14,000 | $9.2M | $7.8M |
| 2029 | 24,000 | $15.8M | $13.4M |

**Key assumptions:**
- Trial-to-paid conversion: 30% (full-feature trial drives higher intent than freemium)
- Monthly churn: 2.5%
- Blended ARPU (paying): $55/month (Month 12 mix)
- CAC: $200 (declining to $140 by Month 18)

**Path to profitability:** Contribution-margin positive at ~150 paying users (within Q1). Operating profitability at Year 2 end with a 4-person team, given significantly higher ARPU than freemium model.

**Series A target:** Q3 2027 at $2M+ ARR, 2x+ YoY growth rate.

---

## The Team

### Ralph Pierre — Founder & CEO

Ralph Pierre built the entire Ledgr platform as a solo developer: 22 pages, 22 API routes, 6 AI integrations, and a full double-entry accounting engine — in under 6 months.

He is a full-stack engineer with deep experience in Next.js, React, TypeScript, PostgreSQL, and OpenAI APIs. He approached the accounting software problem the way a product-obsessed engineer would: study the Trustpilot data, read the Reddit threads, map the competitor pricing history, then build the thing the market needs.

The platform is live. The code is clean. The product is ready.

**What the seed funding pays for:** The first marketing hire, the accountant partnership program, Stripe and Plaid activation, and the first 18 months of customer acquisition — not more engineering.

---

## Traction

**What exists today (April 2026):**

- Fully functional platform, production-ready, available for immediate user acquisition
- 22 frontend pages, fully responsive and mobile-first
- 22 API routes with security hardening (mass-assignment defense, validation, rate limiting)
- 6 working AI endpoints (categorization, chat, forecasting, insights, OCR, suggestions)
- Real authentication (NextAuth 5, scrypt hashing, JWT sessions)
- 7 financial report generators producing GAAP-aligned output
- Full Playwright test suite with documented flow testing
- Zero external funding. 100% founder-built. No technical debt from outsourcing.

**Technology validated:**
- OpenAI GPT-4o-mini integration tested and working
- Plaid and Stripe integrations wired and ready for activation
- PostgreSQL schema designed for multi-tenancy
- 24-hour AI response caching delivering sub-penny per-user AI costs

**What we are NOT claiming:**
- We do not have paying customers yet. This is a pre-revenue seed raise.
- We do not have a growth team yet. That is what we are hiring with the seed.
- We do not have enterprise sales yet. That is Phase 4.

The platform is the proof of concept. The seed round is the fuel.

---

## The Ask

### Seed Round: $750,000 at $2.5M Pre-Money

**Use of funds:**

| Category | Amount | % | Purpose |
|----------|--------|---|---------|
| Sales & Marketing | $300,000 | 40% | Content marketing, SEO, paid acquisition (Phase 3), Product Hunt |
| Team (Year 1) | $225,000 | 30% | Founder salary, 1 marketing hire at Month 7 |
| Product & Engineering | $112,500 | 15% | Plaid/Stripe activation, payroll module, mobile app (Year 2) |
| Operations & Legal | $75,000 | 10% | Accounting, legal, compliance (SOC 2 prep, data privacy) |
| Reserve | $37,500 | 5% | Buffer for unexpected costs |
| **Total** | **$750,000** | 100% | |

**What this buys:**
- 21 months of runway
- $2M ARR before the Series A conversation (higher ARPU accelerates this milestone vs. freemium)
- A proven CAC and LTV data set to de-risk the Series A ask
- The accountant partner program launched with 10+ founding partners
- Payment processing live and generating ancillary revenue

**The milestones investors will use to measure success:**

1. 100 paying users by August 2026
2. $10,000 MRR by September 2026
3. 10 accountant partners by December 2026
4. $1M ARR by Q1 2027
5. Series A close at $2M ARR, Q3 2027

---

## Closing

Small business owners spend $38–275 a month on software they describe as too expensive, too complicated, and impossible to get support for. They have been saying this for years. Nothing has changed because QuickBooks has no reason to change — they own 80% of the market and raise prices every year.

Ledgr is built. It is priced competitively. The audience is actively looking for an alternative.

The window to become the default accounting platform for the next generation of small business owners is open. We intend to take it.

---

*Ledgr. AI-powered accounting for the businesses QuickBooks forgot.*

---

**Contact:** Ralph Pierre, Founder & CEO
**Platform:** Available for live demo on request
**Repository:** Private — available to investors under NDA
