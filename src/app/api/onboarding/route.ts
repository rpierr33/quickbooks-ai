import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { findUserById } from "@/lib/users";
import { pool, query, updateInStore, findInStore } from "@/lib/db";

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

  const user = await findUserById((session.user?.id as string) ?? "");
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
    const existing = findInStore("companies", (c) => c.id === companyId);
    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    updateInStore("companies", companyId, updates);
  }

  return NextResponse.json({ ok: true, companyId });
}

export async function GET() {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const user = await findUserById((session.user?.id as string) ?? "");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (pool) {
    const res = await query(
      "SELECT id, name, email, phone, address, tax_id, industry, fiscal_year_start, coa_template, onboarded_at FROM companies WHERE id = $1",
      [user.company_id]
    );
    return NextResponse.json({ company: res.rows[0] ?? null });
  }
  const company = findInStore("companies", (c) => c.id === user.company_id);
  return NextResponse.json({ company });
}
