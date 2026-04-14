"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Briefcase, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  DollarSign, TrendingUp, CheckCircle2, Clock, Search,
} from "lucide-react";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const EMPTY_FORM = {
  name: '',
  client_name: '',
  status: 'active' as 'active' | 'completed' | 'on-hold',
  budget: '',
  billing_type: 'fixed' as 'fixed' | 'hourly' | 'milestone',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  description: '',
  notes: '',
};

type Project = {
  id: string;
  name: string;
  client_name: string | null;
  status: 'active' | 'completed' | 'on-hold';
  budget: number;
  spent: number;
  billing_type: 'fixed' | 'hourly' | 'milestone';
  start_date: string;
  end_date: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function getProfitabilityColor(budget: number, spent: number): { bg: string; color: string; label: string } {
  if (budget === 0) return { bg: '#F1F5F9', color: '#64748B', label: 'No budget' };
  const pct = (spent / budget) * 100;
  if (pct > 100) return { bg: '#FEF2F2', color: '#DC2626', label: 'Over budget' };
  if (pct >= 80) return { bg: '#FFFBEB', color: '#D97706', label: `${pct.toFixed(0)}% used` };
  return { bg: '#ECFDF5', color: '#059669', label: `${pct.toFixed(0)}% used` };
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery<{
    projects: Project[];
    stats: { active_projects: number; total_projects: number; total_budget: number; total_spent: number; total_profit: number };
  }>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeDialog();
      toast('Project created');
    },
    onError: () => toast('Failed to create project', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      fetch(`/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeDialog();
      toast('Project updated');
    },
    onError: () => toast('Failed to update project', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeletingId(null);
      toast('Project deleted');
    },
    onError: () => toast('Failed to delete project', 'error'),
  });

  const projects = data?.projects ?? [];
  const stats = data?.stats;

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return p.name.toLowerCase().includes(s) || (p.client_name ?? '').toLowerCase().includes(s);
      }
      return true;
    });
  }, [projects, statusFilter, search]);

  function openEdit(p: Project) {
    setForm({
      name: p.name,
      client_name: p.client_name ?? '',
      status: p.status,
      budget: String(p.budget ?? ''),
      billing_type: p.billing_type,
      start_date: p.start_date ?? '',
      end_date: p.end_date ?? '',
      description: p.description ?? '',
      notes: p.notes ?? '',
    });
    setEditingId(p.id);
    setShowAddDialog(true);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleSubmit() {
    if (!form.name) return;
    const payload = {
      ...form,
      budget: form.budget ? parseFloat(form.budget) : 0,
      end_date: form.end_date || null,
      client_name: form.client_name || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const statCards = [
    { label: 'Active Projects', value: String(stats?.active_projects ?? 0), icon: Briefcase, color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Total Budget', value: formatCurrency(stats?.total_budget ?? 0), icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
    { label: 'Total Spent', value: formatCurrency(stats?.total_spent ?? 0), icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Remaining', value: formatCurrency(Math.max(0, (stats?.total_profit ?? 0))), icon: CheckCircle2, color: '#D97706', bg: '#FFFBEB' },
  ];

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: '#ECFDF5', color: '#059669' },
    completed: { bg: '#EFF6FF', color: '#2563EB' },
    'on-hold': { bg: '#FEF9C3', color: '#A16207' },
  };

  const billingLabels: Record<string, string> = {
    fixed: 'Fixed Price', hourly: 'Time & Materials', milestone: 'Milestone',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Projects</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Track budgets, time, and profitability per project</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer" style={{ padding: '0 16px' }}>
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} style={{ ...card, padding: 20, overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{s.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 16, height: 16, color: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>{isLoading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div style={{ position: 'relative', flex: 1, maxWidth: 384 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8', pointerEvents: 'none' }} />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </Select>
      </div>

      {/* Project list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)
        ) : filtered.length === 0 ? (
          <div style={{ ...card, padding: 48 }}>
            <EmptyState
              icon={Briefcase}
              title={search || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
              description={search || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first project to track budget and profitability.'}
              action={!search && statusFilter === 'all' ? <Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} />New Project</Button> : undefined}
            />
          </div>
        ) : (
          filtered.map(p => {
            const budget = parseFloat(String(p.budget ?? 0));
            const spent = parseFloat(String(p.spent ?? 0));
            const remaining = budget - spent;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const profitability = getProfitabilityColor(budget, spent);
            const isExpanded = expandedId === p.id;
            const sc = statusColors[p.status] ?? { bg: '#F1F5F9', color: '#64748B' };

            return (
              <div key={p.id} style={card}>
                {/* Project header */}
                <div
                  style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0 }}>{p.name}</h3>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: sc.bg, color: sc.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {p.status.replace('-', ' ')}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: profitability.bg, color: profitability.color, whiteSpace: 'nowrap' }}>
                        {profitability.label}
                      </span>
                    </div>
                    {p.client_name && (
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{p.client_name} &middot; {billingLabels[p.billing_type] ?? p.billing_type}</p>
                    )}
                  </div>

                  {/* Budget progress — desktop */}
                  <div className="hidden md:flex" style={{ alignItems: 'center', gap: 20, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 2px' }}>Budget</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{formatCurrency(budget)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 2px' }}>Spent</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: spent > budget ? '#DC2626' : '#0F172A', margin: 0 }}>{formatCurrency(spent)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 2px' }}>Remaining</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: remaining < 0 ? '#DC2626' : '#059669', margin: 0 }}>{formatCurrency(Math.abs(remaining))}{remaining < 0 ? ' over' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(p); }}
                        className="cursor-pointer"
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
                      >
                        <Pencil style={{ width: 13, height: 13 }} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingId(p.id); }}
                        className="cursor-pointer"
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                    {isExpanded ? <ChevronUp style={{ width: 16, height: 16, color: '#94A3B8' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#94A3B8' }} />}
                  </div>

                  {/* Mobile chevron */}
                  <div className="md:hidden">
                    {isExpanded ? <ChevronUp style={{ width: 16, height: 16, color: '#94A3B8' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#94A3B8' }} />}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{ height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 99,
                      background: pct > 100 ? '#DC2626' : pct >= 80 ? '#D97706' : '#7C3AED',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div className="flex justify-between" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{pct.toFixed(0)}% used</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {p.start_date && <>{formatDate(p.start_date)}{p.end_date ? ` — ${formatDate(p.end_date)}` : ''}</>}
                    </span>
                  </div>
                </div>

                {/* Mobile budget row */}
                <div className="md:hidden flex gap-4 px-5 pb-4">
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 2px' }}>Budget</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>{formatCurrency(budget)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 2px' }}>Spent</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: spent > budget ? '#DC2626' : '#0F172A', margin: 0 }}>{formatCurrency(spent)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 2px' }}>Remaining</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: remaining < 0 ? '#DC2626' : '#059669', margin: 0 }}>{formatCurrency(Math.abs(remaining))}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 20px' }}>
                    {p.description && (
                      <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>{p.description}</p>
                    )}
                    {p.notes && (
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16, fontStyle: 'italic' }}>{p.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEdit(p)}
                        className="cursor-pointer"
                        style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Pencil style={{ width: 12, height: 12 }} /> Edit Project
                      </button>
                      {p.status !== 'completed' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: p.id, status: 'completed' })}
                          className="cursor-pointer"
                          style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <CheckCircle2 style={{ width: 12, height: 12 }} /> Mark Complete
                        </button>
                      )}
                      {p.status === 'active' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: p.id, status: 'on-hold' })}
                          className="cursor-pointer"
                          style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #FDE68A', background: '#FFF9C4', color: '#A16207', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Clock style={{ width: 12, height: 12 }} /> Put On Hold
                        </button>
                      )}
                      {p.status === 'on-hold' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: p.id, status: 'active' })}
                          className="cursor-pointer"
                          style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Briefcase style={{ width: 12, height: 12 }} /> Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="cursor-pointer"
                        style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Project Name</label>
              <Input placeholder="e.g., Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Client</label>
                <Input placeholder="Acme Corp" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Status</label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'completed' | 'on-hold' })}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Budget</label>
                <Input type="number" step="100" placeholder="10000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Billing Type</label>
                <Select value={form.billing_type} onChange={e => setForm({ ...form, billing_type: e.target.value as 'fixed' | 'hourly' | 'milestone' })}>
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Time & Materials</option>
                  <option value="milestone">Milestone</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>End Date (optional)</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Description (optional)</label>
              <Input placeholder="Brief project description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Internal Notes (optional)</label>
              <Input placeholder="Notes for your team..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name} className="flex-1 cursor-pointer">
            {isSaving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader><DialogTitle>Delete Project</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer"
            style={{ background: '#EF4444', borderColor: '#EF4444' }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
