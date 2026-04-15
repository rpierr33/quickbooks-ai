import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getEnum,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

const CLIENT_TYPES = ['client', 'vendor', 'both'] as const;

// Mass-assignment allowlist — see CLAUDE.md §Hard rules
const CLIENT_WRITE_FIELDS = [
  'name',
  'email',
  'phone',
  'company',
  'address',
  'tax_id',
  'type',
  'notes',
  'is_active',
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;
    const result = await query(
      'SELECT * FROM clients WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('clients[id].GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    // Verify ownership
    const existing = await query(
      'SELECT * FROM clients WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, CLIENT_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('name' in allowed) patch.name = getString(body, 'name', { required: true, max: 200 });
    if ('email' in allowed) patch.email = getString(body, 'email', { max: 255 });
    if ('phone' in allowed) patch.phone = getString(body, 'phone', { max: 40 });
    if ('company' in allowed) patch.company = getString(body, 'company', { max: 200 });
    if ('address' in allowed) patch.address = getString(body, 'address', { max: 500 });
    if ('tax_id' in allowed) patch.tax_id = getString(body, 'tax_id', { max: 40 });
    if ('type' in allowed) patch.type = getEnum(body, 'type', CLIENT_TYPES);
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });
    if ('is_active' in allowed) patch.is_active = body.is_active;

    const updates = { ...patch, updated_at: new Date().toISOString() };
    await updateInStore('clients', id, updates);

    return NextResponse.json({ id, ...updates });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('clients[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireDelete();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;
    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if ((result as any).rowCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('clients[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
