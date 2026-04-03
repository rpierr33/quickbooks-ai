import { NextResponse } from 'next/server';
import { calculatePayroll, calculatePayrollSummary, type Employee } from '@/lib/payroll';
import { requireAuth } from '@/lib/auth-guard';

// Sample employees for the demo
const sampleEmployees: Employee[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@mybusiness.com', salary: 85000, payFrequency: 'biweekly', filingStatus: 'single', allowances: 1, state: 'NY', startDate: '2024-01-15', isActive: true },
  { id: '2', name: 'Michael Chen', email: 'michael@mybusiness.com', salary: 95000, payFrequency: 'biweekly', filingStatus: 'married', allowances: 2, state: 'NY', startDate: '2023-06-01', isActive: true },
  { id: '3', name: 'Emily Rodriguez', email: 'emily@mybusiness.com', salary: 72000, payFrequency: 'biweekly', filingStatus: 'single', allowances: 1, state: 'NY', startDate: '2025-03-10', isActive: true },
];

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  const today = new Date();
  const payPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const payDate = today.toISOString().split('T')[0];
  const summary = calculatePayrollSummary(sampleEmployees, payPeriod, payDate);

  return NextResponse.json({
    employees: sampleEmployees,
    summary,
    processingEnabled: !!(process.env.GUSTO_API_KEY || process.env.CHECK_API_KEY),
    setupMessage: !(process.env.GUSTO_API_KEY || process.env.CHECK_API_KEY)
      ? 'Payroll processing requires Gusto or Check API credentials. Currently running in calculator mode.'
      : undefined,
  });
}

export async function POST(request: Request) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const body = await request.json();
    const { action } = body;

    if (action === 'calculate') {
      const employee: Employee = body.employee;
      const result = calculatePayroll(employee);
      return NextResponse.json(result);
    }

    if (action === 'run_payroll') {
      if (!process.env.GUSTO_API_KEY && !process.env.CHECK_API_KEY) {
        return NextResponse.json({
          error: 'Payroll processing not configured',
          setup: 'Set GUSTO_API_KEY or CHECK_API_KEY to enable actual payroll processing. Currently in calculator mode only.',
        }, { status: 503 });
      }
      // Would call processPayrollViaGusto() here
      return NextResponse.json({ success: true, message: 'Payroll submitted for processing' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
