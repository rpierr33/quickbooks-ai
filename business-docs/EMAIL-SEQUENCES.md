# Ledgr — Email Sequences

**Version:** 1.0 | **Date:** April 2026
**Platform notes:** All sequences are written for Loops, HubSpot, or equivalent behavioral email tool. Trigger logic noted per email.
**Tone:** Direct, personal, founder voice. Never corporate. Subject lines under 50 characters.

---

## SEQUENCE 1: Welcome Sequence
### New Free-Tier Signups — 5 emails over 14 days

**Trigger:** User completes signup (email confirmed)
**Goal:** Drive activation (first bank connection or first invoice sent)

---

### Email 1 — Immediate (0 minutes after signup)

**Subject:** You're in. Here's what to do first.
**Preview text:** Takes 5 minutes. Worth it.

---

Hey {{first_name}},

You just signed up for Ledgr. Here's the single most useful thing you can do in the next 5 minutes:

Connect your business bank account.

Once you do that, Ledgr will import your transaction history and AI will pre-categorize everything. You'll have a working P&L before you finish your coffee.

**[Connect my bank account →]**

If you prefer to start by sending an invoice instead, that's fine too:

**[Create my first invoice →]**

Either way — you're set up. The AI features activate automatically once you have data. No setup wizard. No 45-minute onboarding.

If you have any questions, reply to this email. I read every reply.

— Ralph
Ledgr Founder

P.S. The free tier doesn't expire. You didn't start a trial. This is just your account.

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

None of these require an upgrade. They're all in the free tier.

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

She switched from QuickBooks Plus ($115/mo). She's on our Pro plan ($19/mo). Annual savings: $1,152.

This is not an unusual story. If you haven't gotten to this point with Ledgr yet, here's the fastest way to get there:

1. Connect your bank (if you haven't)
2. Turn on AI categorization auto-approval for transactions under $50 (Settings → AI → Auto-Approve)
3. Check the AI chat once a week: "What needs my attention this week?"

That's it. The 45-minute month is achievable in week 2.

**[Set this up now →]**

Ralph

---

### Email 5 — Day 14 (soft upgrade prompt)

**Subject:** Week 2 check-in — how's it going?
**Preview text:** Honest question. Real offer if you want it.
**Trigger condition:** Send to all

---

Hey {{first_name}},

It's been two weeks. How's Ledgr working for you?

If everything's working well and you're on the free tier, you're in good shape. No action needed — the free tier doesn't expire.

If you've hit any of these, Pro might be worth it:

— You have more than 5 active clients
— You want invoices to send from your own domain (invoices.yourdomain.com)
— You want to track time by project and bill it to clients

Pro is $19/mo. No contract. Cancel anytime.

**[See what Pro includes →]**

If something isn't working or you have a question that I can help with personally — reply to this email. I read every one.

Ralph

---

## SEQUENCE 2: Upgrade Sequence
### Free Users Hitting Limits — 3 emails

**Trigger:** User attempts to add a 6th client (hits free tier limit)
**Goal:** Convert to Pro ($19/mo)

---

### Upgrade Email 1 — Immediate (triggered at limit hit)

**Subject:** You've hit the 5-client limit.
**Preview text:** Here's what happens next.

---

Hey {{first_name}},

You tried to add a client but you've reached the 5-client limit on the free tier.

Here's the situation:

**Free tier:** 5 clients, everything else unlimited.
**Pro tier ($19/mo):** Unlimited clients + custom invoice domain + recurring invoices + 1099 tracking.

That's the only difference between where you are and unlimited clients.

At $19/mo, Pro pays for itself if you're saving any time on bookkeeping versus your previous setup. And if you came from QuickBooks, you're already saving at least $19/mo.

**[Upgrade to Pro — $19/mo →]**

If you want to stay on free, you can archive a client to free up a slot. Instructions here: [link]

Either way, this is your account and your call.

Ralph

---

### Upgrade Email 2 — Day 3 after limit hit (if still not upgraded)

**Subject:** Quick note on the 5-client situation
**Preview text:** One-click if you're ready.
**Trigger condition:** User still has not upgraded

---

Hey {{first_name}},

Just a quick follow-up.

If the 5-client limit is blocking real work, Pro is $19/mo and takes about 30 seconds to activate.

If it's not blocking anything right now — no worries, the free tier is yours. Come back to this when it matters.

**[Upgrade to Pro when you're ready →]**

That's it. Short email.

Ralph

---

### Upgrade Email 3 — Day 7 after limit hit (final)

**Subject:** Last note on the Pro upgrade
**Preview text:** No more emails about this after today.
**Trigger condition:** User still has not upgraded

---

Hey {{first_name}},

Last email about this — I promise.

If you're ready to move past the 5-client limit, here's the link: **[Upgrade to Pro →]**

If not, no problem. You'll have unlimited AI features, reporting, and bank reconciliation on free forever.

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

And if it's just timing — the account stays active. You can come back whenever you're ready. The free tier doesn't expire.

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

If you want to try Ledgr at any point, your account is there. No expiration. No credit card required.

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

If you're currently on QuickBooks Plus ($115/mo), here's what switching to Ledgr Business looks like:

**What you had at $115/mo:**
- Budgeting
- Inventory
- 5 users
- NO AI features
- NO activity logs

**What you get at $39/mo with Ledgr Business:**
- Budgeting
- Inventory
- 10 users
- FULL AI suite (chat, categorization, forecasting, receipt scanning)
- Activity logs
- Annual savings: $912

If you're on QuickBooks Simple Start ($50/mo):
- You're on a plan with no budgeting, no inventory, no AI
- Ledgr Free is $0 and includes all three

The math is just the math. It's not a pitch.

If you're ready to make the switch: **[Import my QuickBooks data →]**

If you want to talk through your specific situation first: **[Book a call →]**

Ralph

P.S. QuickBooks data export works best when you have your books current. If you've been a few weeks behind on reconciliation, get current first — it makes the import cleaner.
