import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { findUserById } from "@/lib/users";
import { pool, query, updateInStore, findInStore, addToStore, listFromStore } from "@/lib/db";
import { getTemplateData } from "@/lib/coa-templates";

export const dynamic = "force-dynamic";

interface OnboardingBody {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  industry?: string;
  fiscalYearStart?: string;
  coaTemplate?: string;
}

const ALLOWED_FISCAL = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const ALLOWED_COA = ["standard", "service", "retail", "nonprofit", "custom"];

function str(x: unknown, max: number): string | null {
  if (typeof x !== "string") return null;
  const t = x.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  let body: OnboardingBody;
  try {
    body = (await req.json()) as OnboardingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const user = await findUserById(((session as any)?.user?.id as string) ?? "");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const companyId = user.company_id;

  const companyName = str(body.companyName, 200);
  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is required" },
      { status: 400 }
    );
  }

  const fy = (body.fiscalYearStart ?? "january").toLowerCase();
  if (!ALLOWED_FISCAL.includes(fy)) {
    return NextResponse.json(
      { error: "fiscalYearStart must be a month name" },
      { status: 400 }
    );
  }
  const coa = (body.coaTemplate ?? "standard").toLowerCase();
  if (!ALLOWED_COA.includes(coa)) {
    return NextResponse.json(
      { error: `coaTemplate must be one of ${ALLOWED_COA.join(", ")}` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const updates = {
    name: companyName,
    email: str(body.email, 255),
    phone: str(body.phone, 40),
    address: str(body.address, 500),
    tax_id: str(body.taxId, 40),
    industry: str(body.industry, 100),
    fiscal_year_start: fy,
    coa_template: coa,
    onboarded_at: now,
    updated_at: now,
  };

  if (pool) {
    await query(
      `UPDATE companies
         SET name = $1, email = $2, phone = $3, address = $4, tax_id = $5,
             industry = $6, fiscal_year_start = $7, coa_template = $8,
             onboarded_at = $9, updated_at = $9
       WHERE id = $10`,
      [
        updates.name,
        updates.email,
        updates.phone,
        updates.address,
        updates.tax_id,
        updates.industry,
        updates.fiscal_year_start,
        updates.coa_template,
        now,
        companyId,
      ]
    );
  } else {
    const existing = await findInStore("companies", (c) => c.id === companyId);
    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    await updateInStore("companies", companyId, updates);
  }

  // Bootstrap Chart of Accounts + categories (idempotent — skip if already exists)
  await bootstrapCoA(companyId, coa);

  return NextResponse.json({ ok: true, companyId });
}

/**
 * Create accounts and categories from the selected CoA template.
 * Checks for existing data first so re-running onboarding is safe.
 */
async function bootstrapCoA(companyId: string, templateId: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    if (pool) {
      // Check if this company already has accounts
      const existing = await query(
        "SELECT id FROM accounts WHERE company_id = $1 LIMIT 1",
        [companyId]
      );
      if (existing.rows.length > 0) return; // Already bootstrapped

      const { accounts, categories } = getTemplateData(templateId);

      // Insert accounts
      for (const acct of accounts) {
        await query(
          `INSERT INTO accounts (id, company_id, name, type, sub_type, balance, currency, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 0, 'USD', true, $6, $6)`,
          [
            crypto.randomUUID(),
            companyId,
            acct.name,
            acct.type,
            acct.sub_type,
            now,
          ]
        );
      }

      // Insert categories
      for (const cat of categories) {
        await query(
          `INSERT INTO categories (id, company_id, name, type, parent_id, icon, color, is_system, created_at)
           VALUES ($1, $2, $3, $4, NULL, $5, $6, true, $7)`,
          [
            crypto.randomUUID(),
            companyId,
            cat.name,
            cat.type,
            cat.icon,
            cat.color,
            now,
          ]
        );
      }
    } else {
      // Mock store path — check by company_id
      const allAccounts = await listFromStore("accounts");
      const hasAccounts = allAccounts.some((a: any) => a.company_id === companyId);
      if (hasAccounts) return;

      const { accounts, categories } = getTemplateData(templateId);

      for (const acct of accounts) {
        await addToStore("accounts", {
          id: crypto.randomUUID(),
          company_id: companyId,
          name: acct.name,
          type: acct.type,
          sub_type: acct.sub_type,
          balance: "0.00",
          currency: "USD",
          is_active: true,
          created_at: now,
          updated_at: now,
        });
      }

      for (const cat of categories) {
        await addToStore("categories", {
          id: crypto.randomUUID(),
          company_id: companyId,
          name: cat.name,
          type: cat.type,
          parent_id: null,
          icon: cat.icon,
          color: cat.color,
          is_system: true,
          created_at: now,
        });
      }
    }
  } catch (err) {
    // Non-fatal: log but don't fail the onboarding POST
    console.error("[onboarding] bootstrapCoA failed:", err);
  }
}

export async function GET() {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const user = await findUserById(((session as any)?.user?.id as string) ?? "");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (pool) {
    const res = await query(
      "SELECT id, name, email, phone, address, tax_id, industry, fiscal_year_start, coa_template, onboarded_at FROM companies WHERE id = $1",
      [user.company_id]
    );
    return NextResponse.json({ company: res.rows[0] ?? null });
  }
  const company = await findInStore("companies", (c) => c.id === user.company_id);
  return NextResponse.json({ company });
}
