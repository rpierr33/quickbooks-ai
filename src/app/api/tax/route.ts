import { NextResponse } from 'next/server';
import { identifyContractorsNeedingForms, export1099sAsCSV, generate1099NEC } from '@/lib/tax-forms';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  try {
    const result = await query('SELECT * FROM transactions ORDER BY date DESC');
    const transactions = result.rows.map((r: Record<string, unknown>) => ({
      description: r.description as string,
      amount: typeof r.amount === 'string' ? parseFloat(r.amount as string) : r.amount as number,
      type: r.type as string,
      date: r.date as string,
      category_name: r.category_name as string | null,
    }));

    const contractors = identifyContractorsNeedingForms(transactions, year);

    return NextResponse.json({
      taxYear: year,
      contractors,
      threshold: 600,
      totalContractors: contractors.length,
      totalPayments: contractors.reduce((s, c) => s + c.totalPaid, 0),
      eFilingEnabled: !!process.env.TAX1099_API_KEY,
      setupMessage: !process.env.TAX1099_API_KEY
        ? 'E-filing requires Tax1099.com API credentials. You can still generate and export 1099 data as CSV.'
        : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate tax data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const { action, year, payer, contractors } = await request.json();

    if (action === 'export_csv') {
      const forms = (contractors || []).map((c: Record<string, unknown>) =>
        generate1099NEC(
          payer || { name: 'My Business', tin: '', address: '', city: '', state: '', zip: '', phone: '' },
          { contractorName: c.name as string, contractorTIN: '', contractorAddress: '', contractorCity: '', contractorState: '', contractorZip: '', totalPaid: c.totalPaid as number },
          year || new Date().getFullYear()
        )
      );
      const csv = export1099sAsCSV(forms);
      return new Response(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="1099-nec-${year}.csv"` },
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
