/**
 * POST /api/onboarding/seed-demo
 *
 * Creates realistic sample data for a new company so they can explore
 * Ledgr's features immediately after onboarding.
 *
 * Idempotent: if the company already has transactions, the endpoint
 * returns 200 immediately without creating duplicates.
 *
 * Creates:
 *  - 3 sample clients
 *  - 3 sample invoices (1 paid, 1 sent/outstanding, 1 draft)
 *  - ~20 sample transactions spanning the last 3 months
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { findUserById } from "@/lib/users";
import { pool, query, addToStore, listFromStore } from "@/lib/db";

export const dynamic = "force-dynamic";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const user = await findUserById(((session as any)?.user?.id as string) ?? "");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const companyId = user.company_id;
  const now = new Date().toISOString();

  // Guard: only seed once per company
  if (pool) {
    const existing = await query(
      "SELECT id FROM transactions WHERE company_id = $1 LIMIT 1",
      [companyId]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  } else {
    const allTx = await listFromStore("transactions");
    const hasTx = allTx.some((t: any) => t.company_id === companyId);
    if (hasTx) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  }

  // ── Sample clients ───────────────────────────────────────────────────────
  const client1Id = crypto.randomUUID();
  const client2Id = crypto.randomUUID();
  const client3Id = crypto.randomUUID();

  const sampleClients = [
    {
      id: client1Id,
      company_id: companyId,
      name: "Acme Corp",
      email: "billing@acme.example.com",
      phone: "(555) 234-5678",
      company: "Acme Corp",
      address: "100 Enterprise Blvd, San Francisco, CA 94105",
      tax_id: null,
      type: "client",
      total_invoiced: "18000.00",
      total_paid: "12000.00",
      outstanding_balance: "6000.00",
      notes: "Primary enterprise client",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: client2Id,
      company_id: companyId,
      name: "Bright Ideas LLC",
      email: "accounts@brightideas.example.com",
      phone: "(555) 876-5432",
      company: "Bright Ideas LLC",
      address: "45 Creative Ave, Austin, TX 78701",
      tax_id: null,
      type: "client",
      total_invoiced: "8500.00",
      total_paid: "8500.00",
      outstanding_balance: "0.00",
      notes: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: client3Id,
      company_id: companyId,
      name: "GreenLeaf Co",
      email: "finance@greenleaf.example.com",
      phone: "(555) 321-0987",
      company: "GreenLeaf Co",
      address: "22 Park Street, Portland, OR 97201",
      tax_id: null,
      type: "client",
      total_invoiced: "7500.00",
      total_paid: "7500.00",
      outstanding_balance: "0.00",
      notes: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  // ── Sample invoices ──────────────────────────────────────────────────────
  const inv1Id = crypto.randomUUID();
  const inv2Id = crypto.randomUUID();
  const inv3Id = crypto.randomUUID();

  const invoiceItems1 = JSON.stringify([
    { description: "Website Redesign — Phase 1", quantity: 1, rate: 8000, amount: 8000 },
    { description: "SEO Audit", quantity: 1, rate: 2000, amount: 2000 },
    { description: "Ongoing Maintenance (2 months)", quantity: 2, rate: 1000, amount: 2000 },
  ]);
  const invoiceItems2 = JSON.stringify([
    { description: "Mobile App Development — MVP", quantity: 1, rate: 12000, amount: 12000 },
    { description: "UI/UX Design", quantity: 1, rate: 3500, amount: 3500 },
    { description: "QA Testing", quantity: 1, rate: 2500, amount: 2500 },
  ]);
  const invoiceItems3 = JSON.stringify([
    { description: "Brand Strategy Workshop", quantity: 1, rate: 3500, amount: 3500 },
    { description: "Logo & Identity Design", quantity: 1, rate: 2500, amount: 2500 },
    { description: "Brand Guidelines Document", quantity: 1, rate: 1500, amount: 1500 },
  ]);

  const sampleInvoices = [
    {
      id: inv1Id,
      company_id: companyId,
      invoice_number: "INV-0001",
      client_name: "Acme Corp",
      client_email: "billing@acme.example.com",
      items: invoiceItems1,
      subtotal: "12000.00",
      tax_rate: "0",
      tax_amount: "0.00",
      total: "12000.00",
      status: "paid",
      due_date: daysAgo(45),
      paid_date: daysAgo(42),
      notes: "Payment received on time. Thank you!",
      currency: "USD",
      exchange_rate: "1",
      base_amount: "12000.00",
      created_at: now,
      updated_at: now,
    },
    {
      id: inv2Id,
      company_id: companyId,
      invoice_number: "INV-0002",
      client_name: "Bright Ideas LLC",
      client_email: "accounts@brightideas.example.com",
      items: invoiceItems2,
      subtotal: "18000.00",
      tax_rate: "0",
      tax_amount: "0.00",
      total: "18000.00",
      status: "sent",
      due_date: daysAgo(-15), // due in 15 days
      paid_date: null,
      notes: "Net 30 terms apply.",
      currency: "USD",
      exchange_rate: "1",
      base_amount: "18000.00",
      created_at: now,
      updated_at: now,
    },
    {
      id: inv3Id,
      company_id: companyId,
      invoice_number: "INV-0003",
      client_name: "GreenLeaf Co",
      client_email: "finance@greenleaf.example.com",
      items: invoiceItems3,
      subtotal: "7500.00",
      tax_rate: "0",
      tax_amount: "0.00",
      total: "7500.00",
      status: "draft",
      due_date: null,
      paid_date: null,
      notes: null,
      currency: "USD",
      exchange_rate: "1",
      base_amount: "7500.00",
      created_at: now,
      updated_at: now,
    },
  ];

  // ── Sample transactions (last ~90 days) ──────────────────────────────────
  // We reference placeholder category/account names; in real DB these would
  // resolve via the bootstrapped CoA. For mock store they carry the names.
  const sampleTransactions = [
    // Income
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(82), description: "Payment from Acme Corp — Website Redesign", amount: "12000.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: "Invoice INV-0001", attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "12000.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(67), description: "Monthly Retainer — TechStart Inc", amount: "5000.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "5000.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(54), description: "Payment from Bright Ideas LLC — App Milestone 1", amount: "9000.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: "Milestone 1 of 2", attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "9000.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(37), description: "Monthly Retainer — TechStart Inc", amount: "5000.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "5000.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(21), description: "Payment from GreenLeaf Co — Brand Strategy", amount: "7500.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: "Final payment", attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "7500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(7), description: "Monthly Retainer — TechStart Inc", amount: "5000.00", type: "income", account_id: null, category_id: null, category_name: "Service Revenue", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "5000.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(25), description: "Interest — Business Savings", amount: "42.15", type: "income", account_id: null, category_id: null, category_name: "Interest Income", account_name: "Business Savings", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "42.15", created_at: now, updated_at: now },

    // Expenses
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(87), description: "Office Rent — Month 1", amount: "3500.00", type: "expense", account_id: null, category_id: null, category_name: "Rent", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "3500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(87), description: "Payroll — Period 1", amount: "8500.00", type: "expense", account_id: null, category_id: null, category_name: "Payroll", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "8500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(82), description: "AWS — Cloud Hosting", amount: "487.32", type: "expense", account_id: null, category_id: null, category_name: "Software & SaaS", account_name: "Credit Card", is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.92", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "487.32", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(80), description: "State Farm — Business Insurance", amount: "475.00", type: "expense", account_id: null, category_id: null, category_name: "Insurance", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: "Monthly premium", attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "475.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(79), description: "Google Ads — Campaign", amount: "1200.00", type: "expense", account_id: null, category_id: null, category_name: "Marketing", account_name: "Credit Card", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.95", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "1200.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(75), description: "Slack Business+ Subscription", amount: "125.00", type: "expense", account_id: null, category_id: null, category_name: "Software & SaaS", account_name: "Credit Card", is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.91", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "125.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(57), description: "Office Rent — Month 2", amount: "3500.00", type: "expense", account_id: null, category_id: null, category_name: "Rent", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "3500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(55), description: "Payroll — Period 2", amount: "8500.00", type: "expense", account_id: null, category_id: null, category_name: "Payroll", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "8500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(52), description: "AWS — Cloud Hosting", amount: "512.18", type: "expense", account_id: null, category_id: null, category_name: "Software & SaaS", account_name: "Credit Card", is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.92", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "512.18", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(50), description: "Uber — Client Meeting", amount: "28.45", type: "expense", account_id: null, category_id: null, category_name: "Travel", account_name: "Credit Card", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.85", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "28.45", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(47), description: "Facebook Ads — Retargeting", amount: "800.00", type: "expense", account_id: null, category_id: null, category_name: "Marketing", account_name: "Credit Card", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.93", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "800.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(27), description: "Office Rent — Month 3", amount: "3500.00", type: "expense", account_id: null, category_id: null, category_name: "Rent", account_name: "Business Checking", is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "3500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(25), description: "Payroll — Period 3", amount: "8500.00", type: "expense", account_id: null, category_id: null, category_name: "Payroll", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "8500.00", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(22), description: "AWS — Cloud Hosting", amount: "534.90", type: "expense", account_id: null, category_id: null, category_name: "Software & SaaS", account_name: "Credit Card", is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.92", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "534.90", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(18), description: "Amazon — Office Supplies", amount: "189.99", type: "expense", account_id: null, category_id: null, category_name: "Office Supplies", account_name: "Credit Card", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.78", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "189.99", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(12), description: "ConEd — Electric Bill", amount: "245.80", type: "expense", account_id: null, category_id: null, category_name: "Utilities", account_name: "Business Checking", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.90", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "245.80", created_at: now, updated_at: now },
    { id: crypto.randomUUID(), company_id: companyId, date: daysAgo(5), description: "Team Lunch — Strategy Session", amount: "127.40", type: "expense", account_id: null, category_id: null, category_name: "Meals & Entertainment", account_name: "Credit Card", is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: "0.82", notes: null, attachments: "[]", currency: "USD", exchange_rate: "1", base_amount: "127.40", created_at: now, updated_at: now },
  ];

  try {
    if (pool) {
      // Clients
      for (const c of sampleClients) {
        await query(
          `INSERT INTO clients (id, company_id, name, email, phone, company, address, tax_id, type, total_invoiced, total_paid, outstanding_balance, notes, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [c.id, c.company_id, c.name, c.email, c.phone, c.company, c.address, c.tax_id, c.type, c.total_invoiced, c.total_paid, c.outstanding_balance, c.notes, c.is_active, c.created_at, c.updated_at]
        );
      }

      // Invoices
      for (const inv of sampleInvoices) {
        await query(
          `INSERT INTO invoices (id, company_id, invoice_number, client_name, client_email, items, subtotal, tax_rate, tax_amount, total, status, due_date, paid_date, notes, currency, exchange_rate, base_amount, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [inv.id, inv.company_id, inv.invoice_number, inv.client_name, inv.client_email, inv.items, inv.subtotal, inv.tax_rate, inv.tax_amount, inv.total, inv.status, inv.due_date, inv.paid_date, inv.notes, inv.currency, inv.exchange_rate, inv.base_amount, inv.created_at, inv.updated_at]
        );
      }

      // Transactions
      for (const tx of sampleTransactions) {
        await query(
          `INSERT INTO transactions (id, company_id, date, description, amount, type, account_id, category_id, category_name, account_name, is_recurring, recurring_rule_id, ai_categorized, ai_confidence, notes, attachments, currency, exchange_rate, base_amount, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [tx.id, tx.company_id, tx.date, tx.description, tx.amount, tx.type, tx.account_id, tx.category_id, tx.category_name, tx.account_name, tx.is_recurring, tx.recurring_rule_id, tx.ai_categorized, tx.ai_confidence, tx.notes, tx.attachments, tx.currency, tx.exchange_rate, tx.base_amount, tx.created_at, tx.updated_at]
        );
      }
    } else {
      // Mock store
      for (const c of sampleClients) await addToStore("clients", c);
      for (const inv of sampleInvoices) await addToStore("invoices", { ...inv, items: JSON.parse(inv.items) });
      for (const tx of sampleTransactions) await addToStore("transactions", tx);
    }

    return NextResponse.json({ ok: true, created: { clients: sampleClients.length, invoices: sampleInvoices.length, transactions: sampleTransactions.length } });
  } catch (err) {
    console.error("[seed-demo] failed:", err);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}
