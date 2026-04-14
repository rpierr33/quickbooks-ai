import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, pickAllowed, ValidationError } from '@/lib/validate';

const PROJECT_WRITE_FIELDS = [
  'name', 'client_name', 'client_id', 'status', 'budget', 'spent',
  'billing_type', 'start_date', 'end_date', 'description', 'notes',
] as const;
const PROJECT_STATUSES = ['active', 'completed', 'on-hold'] as const;
const BILLING_TYPES = ['fixed', 'hourly', 'milestone'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const projects = await listFromStore('projects');
    const existing = projects.find(p => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, PROJECT_WRITE_FIELDS);
    const patch: Record<string, unknown> = {};

    if ('name' in allowed) patch.name = getString(body, 'name', { required: true, max: 200 });
    if ('client_name' in allowed) patch.client_name = getString(body, 'client_name', { max: 200 });
    if ('client_id' in allowed) patch.client_id = getString(body, 'client_id', { max: 64 });
    if ('status' in allowed) patch.status = getEnum(body, 'status', PROJECT_STATUSES);
    if ('budget' in allowed) patch.budget = getNumber(body, 'budget', { min: 0 });
    if ('spent' in allowed) patch.spent = getNumber(body, 'spent', { min: 0 });
    if ('billing_type' in allowed) patch.billing_type = getEnum(body, 'billing_type', BILLING_TYPES);
    if ('start_date' in allowed) patch.start_date = getString(body, 'start_date', { max: 20 });
    if ('end_date' in allowed) patch.end_date = getString(body, 'end_date', { max: 20 });
    if ('description' in allowed) patch.description = getString(body, 'description', { max: 2000 });
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    const updated = await updateInStore('projects', id, { ...patch, updated_at: new Date().toISOString() });
    return NextResponse.json(updated ?? { ...existing, ...patch });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('projects[id].PUT error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const deleted = await deleteFromStore('projects', id);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('projects[id].DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
