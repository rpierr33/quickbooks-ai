import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { addToStore, listFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, ValidationError } from '@/lib/validate';

const PROJECT_STATUSES = ['active', 'completed', 'on-hold'] as const;
const BILLING_TYPES = ['fixed', 'hourly', 'milestone'] as const;

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const allProjects = await listFromStore('projects');
    const projects = allProjects.filter(p => p.company_id === companyId);
    projects.sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());

    const activeProjects = projects.filter(p => p.status === 'active');
    const totalBudget = projects.filter(p => p.status !== 'completed').reduce((sum: number, p: any) => sum + parseFloat(p.budget ?? 0), 0);
    const totalSpent = projects.filter(p => p.status !== 'completed').reduce((sum: number, p: any) => sum + parseFloat(p.spent ?? 0), 0);
    const totalProfit = totalBudget - totalSpent;

    return NextResponse.json({
      projects,
      stats: {
        active_projects: activeProjects.length,
        total_projects: projects.length,
        total_budget: totalBudget,
        total_spent: totalSpent,
        total_profit: totalProfit,
      },
    });
  } catch (error) {
    console.error('projects.GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const name = getString(body, 'name', { required: true, max: 200 })!;
    const client_name = getString(body, 'client_name', { max: 200 });
    const client_id = getString(body, 'client_id', { max: 64 });
    const status = getEnum(body, 'status', PROJECT_STATUSES) ?? 'active';
    const budget = getNumber(body, 'budget', { min: 0 }) ?? 0;
    const billing_type = getEnum(body, 'billing_type', BILLING_TYPES) ?? 'fixed';
    const start_date = getString(body, 'start_date', { max: 20 });
    const end_date = getString(body, 'end_date', { max: 20 });
    const description = getString(body, 'description', { max: 2000 });
    const notes = getString(body, 'notes', { max: 2000 });

    const project = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      client_name: client_name ?? null,
      client_id: client_id ?? null,
      status,
      budget,
      spent: 0,
      billing_type,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      end_date: end_date ?? null,
      description: description ?? null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('projects', project);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('projects.POST error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
