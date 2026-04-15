import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { addToStore, listFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, ValidationError } from '@/lib/validate';

const PAY_TYPES = ['salary', 'hourly'] as const;
const EMP_STATUSES = ['active', 'inactive'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource') ?? 'employees';

    if (resource === 'payroll_runs') {
      const runs = await listFromStore('payroll_runs');
      const companyRuns = runs.filter(r => r.company_id === companyId);
      companyRuns.sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime());
      return NextResponse.json(companyRuns);
    }

    // Default: employees
    const allEmployees = await listFromStore('employees');
    const employees = allEmployees.filter(e => e.company_id === companyId);
    employees.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const now = new Date();
    const activeEmployees = employees.filter(e => e.status === 'active');

    const allRuns = await listFromStore('payroll_runs');
    const runs = allRuns.filter(r => r.company_id === companyId);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);
    const monthlyRuns = runs.filter(r => r.run_date.startsWith(thisMonthStart));
    const totalPayrollThisMonth = monthlyRuns.reduce((sum: number, r: any) => sum + parseFloat(r.total_gross ?? 0), 0);

    const ytdStart = `${now.getFullYear()}-`;
    const ytdRuns = runs.filter(r => r.run_date.startsWith(ytdStart));
    const ytdPayroll = ytdRuns.reduce((sum: number, r: any) => sum + parseFloat(r.total_gross ?? 0), 0);

    const today = now.getDate();
    let nextPayDate: Date;
    if (today < 15) {
      nextPayDate = new Date(now.getFullYear(), now.getMonth(), 15);
    } else if (today < 28) {
      nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextPayDate.setDate(0);
    } else {
      nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    }

    return NextResponse.json({
      employees,
      stats: {
        total_employees: employees.length,
        active_employees: activeEmployees.length,
        payroll_this_month: totalPayrollThisMonth,
        ytd_payroll: ytdPayroll,
        next_pay_date: nextPayDate.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    console.error('payroll.GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const action = getString(body, 'action', { max: 50 });

    if (action === 'run_payroll') {
      const periodStart = getString(body, 'pay_period_start', { required: true, max: 20 })!;
      const periodEnd = getString(body, 'pay_period_end', { required: true, max: 20 })!;
      const entriesRaw = body.entries;
      if (!Array.isArray(entriesRaw) || entriesRaw.length === 0) {
        return NextResponse.json({ error: 'entries array is required' }, { status: 400 });
      }

      const entries = (entriesRaw as any[]).map((e: any) => ({
        employee_id: String(e.employee_id ?? ''),
        employee_name: String(e.employee_name ?? ''),
        gross: parseFloat(e.gross ?? 0),
        taxes: parseFloat(e.taxes ?? 0),
        deductions: parseFloat(e.deductions ?? 0),
        net: parseFloat(e.net ?? 0),
      }));

      const total_gross = entries.reduce((s, e) => s + e.gross, 0);
      const total_taxes = entries.reduce((s, e) => s + e.taxes, 0);
      const total_net = entries.reduce((s, e) => s + e.net, 0);

      const run = {
        id: crypto.randomUUID(),
        company_id: companyId,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        run_date: new Date().toISOString().slice(0, 10),
        entries: JSON.stringify(entries),
        total_gross,
        total_taxes,
        total_net,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      await addToStore('payroll_runs', run);
      return NextResponse.json({ ...run, entries }, { status: 201 });
    }

    // Default: create employee
    const name = getString(body, 'name', { required: true, max: 200 })!;
    const email = getString(body, 'email', { max: 255 });
    const role = getString(body, 'role', { max: 200 });
    const pay_type = getEnum(body, 'pay_type', PAY_TYPES, { required: true })!;
    const rate = getNumber(body, 'rate', { required: true, min: 0 })!;
    const tax_withholding_pct = getNumber(body, 'tax_withholding_pct', { min: 0, max: 100 }) ?? 22;
    const status = getEnum(body, 'status', EMP_STATUSES) ?? 'active';
    const start_date = getString(body, 'start_date', { max: 20 });

    const employee = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      email: email ?? null,
      role: role ?? null,
      pay_type,
      rate,
      tax_withholding_pct,
      status,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await addToStore('employees', employee);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('payroll.POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
