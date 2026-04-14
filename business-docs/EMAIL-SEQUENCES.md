# Ledgr — Email Sequences

**Version:** 1.0 | **Date:** April 2026
**Platform notes:** All sequences are written for Loops, HubSpot, or equivalent behavioral email tool. Trigger logic noted per email.
**Tone:** Direct, personal, founder voice. Never corporate. Subject lines under 50 characters.

---

## SEQUENCE 1: Welcome Sequence
### New Trial Signups — 5 emails over 14 days

**Trigger:** User completes signup (email confirmed), starts 14-day free trial
**Goal:** Drive activation (first bank connection or first invoice sent)

---

### Email 1 — Immediate (0 minutes after signup)

**Subject:** You're in. Here's what to do first.
**Preview text:** Takes 5 minutes. Worth it.

---

Hey {{first_name}},

You just started your 14-day Ledgr trial. Here's the single most useful thing you can do in the next 5 minutes:

Connect your business bank account.

Once you do that, Ledgr will import your transaction history and AI will pre-categorize everything. You'll have a working P&L before you finish your coffee.

**[Connect my bank account →]**

If you prefer to start by sending an invoice instead, that's fine too:

**[Create my first invoice →]**

Either way — you're set up. The AI features activate automatically once you have data. No setup wizard. No 45-minute onboarding.

If you have any questions, reply to this email. I read every reply.

— Ralph
Ledgr Founder

P.S. You have full Professional access for 14 days — every feature, no restrictions. At the end of the trial, Starter starts at $29.99/mo. No obligation to upgrade during the trial.

---

### Email 2 — Day 2 (if no bank connected)

**Subject:** Your P&L is waiting for one thing.
**Preview text:** Connect your bank and it builds itself.
**Trigger condition:** Send only if user has NOT connected a bank account yet

---

Hey {{first_name}},

Quick note — you haven't connected your bank yet.

I know that sounds like it could be a thing. It isn't. We use bank-grade encryption and read-only access — Ledgr can see your transactions, but we cannot move a single dollar.

Here's what happens when you connect:

1. Ledgr imports your last 12 months of transactions
2. AI categorizes all of them in about 2 minutes
3. Your P&L, Balance Sheet, and Cash Flow Statement appear — live

The whole thing takes about 4 minutes.

**[Connect my bank account →]**

If you're not ready for bank sync, you can also import a CSV from your bank manually — same result, slightly more steps.

See you inside,
Ralph

---

### Email 3 — Day 5 (product value education)

**Subject:** 5 things most users don't know Ledgr can do
**Preview text:** The AI chat one surprises everyone.
**Trigger condition:** Send to all, regardless of activation status

---

Hey {{first_name}},

A few things most new users don't find on their own:

**1. Ask your books a question.**
Open AI chat and type "What's my profit this quarter?" or "What did I spend on software last month?" You'll get a direct answer from your actual data. No report builder needed.

**2. Scan a receipt with your phone.**
Open the mobile app, tap the camera icon, photograph any receipt. Ledgr logs the vendor, amount, date, and category automatically. Takes about 3 seconds.

**3. Set a cash flow alert.**
Go to Forecasting → Alerts. Set a minimum cash balance threshold. Ledgr sends you an email if your projected balance drops below it 30 days out.

**4. See your books by client.**
In Reports → Client P&L, you can see exactly which clients are profitable and which are costing you money after expenses.

**5. Auto-send invoice reminders.**
Open any invoice → Automation. Toggle on "Send reminder on day 3 and day 7 after due date." You never have to chase a payment manually again.

None of these require a specific plan tier. They're all part of your Professional access during the trial.

**[Log in and try one →]**

Let me know if you have questions — reply here or use the chat in the app.

Ralph

---

### Email 4 — Day 9 (social proof + use case)

**Subject:** How a 3-person agency cut bookkeeping to 45 min/month
**Preview text:** Real numbers, no fluff.
**Trigger condition:** Send to all

---

Hey {{first_name}},

One of our beta users runs a 3-person design agency. Here's what her monthly bookkeeping routine looked like before and after Ledgr:

**Before Ledgr:**
- Sunday evening, 3–4 hours
- Manual bank transaction review
- Export and email to accountant
- Wait for feedback, fix, repeat

**After Ledgr:**
- AI categorizes everything during the week (she approves as they come in — 2 min/day)
- Month-end: AI flags 3–4 items that need attention
- Fix them in 20 minutes
- Download the P&L, share the link with her accountant
- Done

Total monthly time: ~45 minutes vs. 4 hours.

She switched from QuickBooks Plus ($115/mo). She's on our Professional plan ($59.99/mo). Annual savings: $660.

This is not an unusual story. If you haven't gotten to this point with Ledgr yet, here's the fastest way to get there:

1. Connect your bank (if you haven't)
2. Turn on AI categorization auto-approval for transactions under $50 (Settings → AI → Auto-Approve)
3. Check the AI chat once a week: "What needs my attention this week?"

That's it. The 45-minute month is achievable in week 2.

**[Set this up now →]**

Ralph

---

### Email 5 — Day 12 (trial ending soon — plan selection)

**Subject:** Your trial ends in 2 days — choose your plan
**Preview text:** Honest breakdown of which plan fits you.
**Trigger condition:** Send to all

---

Hey {{first_name}},

Your 14-day trial ends in 2 days. Here's the honest breakdown so you can choose the right plan:

**Starter — $29.99/mo**
For freelancers and solo business owners. 1 user, 20 invoices/month, bank feeds, all AI features. If you send fewer than 20 invoices a month and work alone — this is the one.

**Professional — $59.99/mo** (most popular)
For small teams or solo users who need unlimited invoices. 3 users, unlimited invoices, multi-currency, time tracking, accountant access. If you're billing more than 20 clients a month or want to share access — this is the one.

**Business — $99.99/mo**
For businesses with inventory, purchase orders, and teams up to 10 people. If you have physical products or need department-level budgeting — this is the one.

**Enterprise — $139.99/mo**
For accounting firms and multi-entity businesses. Unlimited users, API access, white-label invoices, dedicated support.

Annual plans save roughly 20% on each tier.

**[Choose my plan →]**

If you're not sure which plan is right, reply to this email with a quick description of your business and I'll tell you exactly which tier fits.

Ralph

P.S. If you want to keep exploring before committing — reply and I can extend your trial by 7 days. No sales pitch attached.

---

## SEQUENCE 2: Upgrade Sequence
### Starter Users Hitting Limits — 3 emails

**Trigger:** User attempts to create a 21st invoice in a month (hits Starter tier limit)
**Goal:** Convert to Professional ($59.99/mo)

---

### Upgrade Email 1 — Immediate (triggered at limit hit)

**Subject:** You've hit the 20-invoice limit.
**Preview text:** Here's what happens next.

---

Hey {{first_name}},

You tried to create an invoice but you've reached the 20-invoice limit on the Starter plan.

Here's the situation:

**Starter ($29.99/mo):** 20 invoices/month, 1 user.
**Professional ($59.99/mo):** Unlimited invoices + multi-currency + time tracking + accountant access (1 seat).

That's the main difference between where you are and unlimited invoices.

At $59.99/mo, Professional pays for itself if you're regularly billing more than 20 clients a month. And if you came from QuickBooks Plus, you're saving $55/mo even on the Professional plan.

**[Upgrade to Professional — $59.99/mo →]**

If you want to stay on Starter, your current invoices still work fine — you just can't create new ones this month until the counter resets.

Either way, this is your account and your call.

Ralph

---

### Upgrade Email 2 — Day 3 after limit hit (if still not upgraded)

**Subject:** Quick note on the invoice limit
**Preview text:** One-click if you're ready.
**Trigger condition:** User still has not upgraded

---

Hey {{first_name}},

Just a quick follow-up.

If the invoice limit is blocking real work, Professional is $59.99/mo and takes about 30 seconds to activate.

If it's not blocking anything right now — no worries, your Starter plan is solid. Come back to this when it matters.

**[Upgrade to Professional when you're ready →]**

That's it. Short email.

Ralph

---

### Upgrade Email 3 — Day 7 after limit hit (final)

**Subject:** Last note on the upgrade
**Preview text:** No more emails about this after today.
**Trigger condition:** User still has not upgraded

---

Hey {{first_name}},

Last email about this — I promise.

If you're ready to remove the invoice limit, here's the link: **[Upgrade to Professional →]**

If not, no problem. You'll have all AI features, full reporting, and bank reconciliation on Starter indefinitely.

One other thing: if the price is the issue, email me at ralph@ledgr.com. I have some flexibility for early users who are genuinely tight on budget and want to give Ledgr a real shot.

Ralph

---

## SEQUENCE 3: Re-engagement Sequence
### Inactive Users (7+ days no login) — 3 emails

**Trigger:** User has not logged in for 7 days
**Goal:** Return to active usage or surface what's blocking them

---

### Re-engagement Email 1 — Day 7

**Subject:** Your books are waiting for you.
**Preview text:** Nothing broke. Just checking in.

---

Hey {{first_name}},

You haven't logged in for a week. Quick check-in — everything okay on your end?

Sometimes people sign up, life gets busy, and the bookkeeping falls to the bottom of the list. That's normal.

If it's useful, here's the one thing that takes the least time and delivers the most value:

**Connect your bank account (if you haven't).**

Once it's connected, AI does the work automatically. You just review when you have 10 minutes.

**[Log in and connect →]**

If something isn't working or the setup felt confusing, reply here. I'll personally help you get it sorted.

Ralph

---

### Re-engagement Email 2 — Day 14 (if still inactive)

**Subject:** What's blocking you?
**Preview text:** Honest question. One-line reply welcome.
**Trigger condition:** Still no login since signup

---

Hey {{first_name}},

Straight question: what got in the way?

- Not enough time to set it up?
- Something didn't work as expected?
- You're still using your current software and don't want to switch yet?
- Something else?

A one-line reply would genuinely help me understand where Ledgr falls short.

And if it's just timing — the account stays active. You can come back whenever you're ready. Your plan doesn't expire between logins.

Ralph
Founder, Ledgr

---

### Re-engagement Email 3 — Day 21 (final)

**Subject:** Last one. I mean it.
**Preview text:** One offer, then I'll leave you alone.
**Trigger condition:** Still no login

---

Hey {{first_name}},

Last email. I don't believe in pestering people.

If you want to try Ledgr at any point, your account is there. No expiration. No credit card required to browse.

One offer before I close this loop: if you'd like a personal 20-minute onboarding call — I'll walk you through your specific business setup and make sure you're set up correctly. No sales pitch. Just a setup call.

Book one here if you want: **[Book 20-min onboarding call →]**

Otherwise — take care. If your circumstances change and you want to give it a real shot, come back any time.

Ralph

---

## SEQUENCE 4: QuickBooks Migration Sequence
### QuickBooks Users During Price Hike Events — 3 emails

**Trigger:** User submits "switching from QuickBooks" onboarding form field OR user from QuickBooks-targeted ad campaign
**Goal:** Drive import and activation

---

### Migration Email 1 — Immediate (after signup via QB campaign)

**Subject:** Your QuickBooks import is one click away.
**Preview text:** Here's exactly how it works.

---

Hey {{first_name}},

Welcome to Ledgr. Since you mentioned you're coming from QuickBooks, here's the fastest path forward:

**Step 1: Export from QuickBooks**
In QuickBooks Online: Reports → All Reports → Export → "Transaction List" CSV. Also export your Chart of Accounts (Lists → Chart of Accounts → Export).

Takes about 3 minutes.

**Step 2: Import to Ledgr**
Go to Settings → Import → QuickBooks Import. Upload both files. Ledgr does the rest.

Takes about 5 minutes plus processing time (usually under 10 minutes for most businesses).

**Step 3: You're done**
Your full transaction history, chart of accounts, and client list are in Ledgr. AI will re-categorize any uncategorized items automatically.

**[Start your QuickBooks import →]**

If anything goes wrong or you have questions at any step, reply to this email. I've helped dozens of businesses make this move.

Ralph

---

### Migration Email 2 — Day 3 (if import not completed)

**Subject:** Quick note on your QuickBooks import
**Preview text:** Takes less time than your last QB bill.
**Trigger condition:** Import not completed

---

Hey {{first_name}},

Haven't seen your QuickBooks import come through yet. No pressure — just wanted to make sure the process is clear.

Common questions I get:

**"Will I lose my history if I switch?"**
No. Your full transaction history imports. We recommend keeping your QuickBooks export file as a backup anyway.

**"What if I categorized things differently in QuickBooks?"**
Ledgr imports your categories. You can rename or reorganize them after import. AI will learn your preferences within a few transactions.

**"Do I need to cancel QuickBooks before I migrate?"**
No. Run both side-by-side for as long as you want before canceling. Most people cancel QuickBooks within 30 days of their first Ledgr month-end close.

If you want a personal walkthrough, I'm available: **[Book 15-min migration call →]**

Otherwise: **[Start the import →]**

Ralph

---

### Migration Email 3 — Day 7 (price comparison + urgency)

**Subject:** What you're saving by switching (the math)
**Preview text:** Quick calculation for your situation.
**Trigger condition:** Send to all in this sequence

---

Hey {{first_name}},

Let me give you the specific numbers for your situation.

If you're currently on QuickBooks Plus ($115/mo), here's what switching to Ledgr Professional looks like:

**What you had at $115/mo:**
- Budgeting
- Inventory
- 5 users
- NO AI features
- NO activity logs

**What you get at $59.99/mo with Ledgr Professional:**
- Budgeting
- Unlimited invoices
- 3 users
- FULL AI suite (chat, categorization, forecasting, receipt scanning)
- Activity logs
- Multi-currency
- Annual savings: $660

If you're on QuickBooks Simple Start ($50/mo):
- You're on a plan with no budgeting, no inventory, no AI
- Ledgr Starter at $29.99/mo includes AI features QuickBooks charges $275/mo for

If you're on QuickBooks Advanced ($275/mo):
- Ledgr Enterprise at $139.99/mo includes equivalent features: unlimited users, API access, activity logs, full AI suite, dedicated support
- Annual savings: $1,620

The math is just the math. It's not a pitch.

If you're ready to make the switch: **[Import my QuickBooks data →]**

If you want to talk through your specific situation first: **[Book a call →]**

Ralph

P.S. QuickBooks data export works best when you have your books current. If you've been a few weeks behind on reconciliation, get current first — it makes the import cleaner.
