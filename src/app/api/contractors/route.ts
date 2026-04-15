import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { addToStore, listFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, ValidationError } from '@/lib/validate';

const TAX_ID_TYPES = ['SSN', 'EIN'] as const;
const RATE_TYPES = ['hourly', 'project'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ?? String(new Date().getFullYear());

    const allContractors = await listFromStore('contractors');
    const contractors = allContractors.filter(c => c.company_id === companyId);
    contractors.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const threshold = 600;
    const activeContractors = contractors.filter(c => c.is_active);
    const totalPaidYtd = contractors.reduce((sum: number, c: any) => sum + parseFloat(c.total_paid_ytd ?? 0), 0);
    const overThreshold = contractors.filter(c => parseFloat(c.total_paid_ytd ?? 0) >= threshold);

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (pageParam !== null) {
      const page = Math.max(1, parseInt(pageParam, 10));
      const limit = Math.min(Math.max(1, parseInt(limitParam || '50', 10)), 200);
      const total = contractors.length;
      const offset = (page - 1) * limit;
      return NextResponse.json({
        data: contractors.slice(offset, offset + limit),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: {
          total_contractors: contractors.length,
          active_contractors: activeContractors.length,
          total_paid_ytd: totalPaidYtd,
          over_threshold_count: overThreshold.length,
          threshold,
          year,
        },
      });
    }

    return NextResponse.json({
      contractors,
      stats: {
        total_contractors: contractors.length,
        active_contractors: activeContractors.length,
        total_paid_ytd: totalPaidYtd,
        over_threshold_count: overThreshold.length,
        threshold,
        year,
      },
    });
  } catch (error) {
    console.error('contractors.GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const name = getString(body, 'name', { required: true, max: 200 })!;
    const email = getString(body, 'email', { max: 255 });
    const address = getString(body, 'address', { max: 500 });
    const tax_id_last4 = getString(body, 'tax_id_last4', { max: 4 });
    const tax_id_type = getEnum(body, 'tax_id_type', TAX_ID_TYPES) ?? 'SSN';
    const payment_terms = getString(body, 'payment_terms', { max: 50 }) ?? 'net30';
    const rate = getNumber(body, 'rate', { min: 0 });
    const rate_type = getEnum(body, 'rate_type', RATE_TYPES) ?? 'hourly';
    const notes = getString(body, 'notes', { max: 2000 });

    const contractor = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      email: email ?? null,
      address: address ?? null,
      tax_id_last4: tax_id_last4 ?? null,
      tax_id_type,
      payment_terms,
      rate: rate ?? null,
      rate_type,
      total_paid_ytd: 0,
      is_active: true,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('contractors', contractor);
    return NextResponse.json(contractor, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('contractors.POST error:', error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
