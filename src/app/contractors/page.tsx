"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  UserSquare2, Plus, Pencil, AlertTriangle, FileText,
  DollarSign, Users, CheckCircle2, Search,
} from "lucide-react";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const THRESHOLD = 600;

const EMPTY_FORM = {
  name: '',
  email: '',
  address: '',
  tax_id_last4: '',
  tax_id_type: 'SSN' as 'SSN' | 'EIN',
  payment_terms: 'net30',
  rate: '',
  rate_type: 'hourly' as 'hourly' | 'project',
  notes: '',
};

type Contractor = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  tax_id_last4: string | null;
  tax_id_type: 'SSN' | 'EIN';
  payment_terms: string;
  rate: number | null;
  rate_type: 'hourly' | 'project';
  total_paid_ytd: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

export default function ContractorsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [showing1099Id, setShowing1099Id] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery<{
    contractors: Contractor[];
    stats: { total_contractors: number; active_contractors: number; total_paid_ytd: number; over_threshold_count: number; threshold: number; year: string };
  }>({
    queryKey: ['contractors', yearFilter],
    queryFn: () => fetch(`/api/contractors?year=${yearFilter}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/contractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      closeDialog();
      toast('Contractor added');
    },
    onError: () => toast('Failed to add contractor', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      fetch(`/api/contractors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      closeDialog();
      setDeactivatingId(null);
      toast('Contractor updated');
    },
    onError: () => toast('Failed to update contractor', 'error'),
  });

  const contractors = data?.contractors ?? [];
  const stats = data?.stats;

  const filtered = contractors.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.email ?? '').toLowerCase().includes(s);
  });

  const contractor1099 = showing1099Id ? contractors.find(c => c.id === showing1099Id) : null;

  function openEdit(c: Contractor) {
    setForm({
      name: c.name,
      email: c.email ?? '',
      address: c.address ?? '',
      tax_id_last4: c.tax_id_last4 ?? '',
      tax_id_type: c.tax_id_type,
      payment_terms: c.payment_terms,
      rate: c.rate != null ? String(c.rate) : '',
      rate_type: c.rate_type,
      notes: c.notes ?? '',
    });
    setEditingId(c.id);
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
      rate: form.rate ? parseFloat(form.rate) : null,
      tax_id_last4: form.tax_id_last4 || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDeactivate(id: string, currentStatus: boolean) {
    updateMutation.mutate({ id, is_active: !currentStatus });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(y => String(y));

  const statCards = [
    { label: 'Total Contractors', value: String(stats?.total_contractors ?? 0), icon: Users, color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Total Paid YTD', value: formatCurrency(stats?.total_paid_ytd ?? 0), icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
    { label: 'Over $600 Threshold', value: String(stats?.over_threshold_count ?? 0), icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB' },
    { label: '1099s to File', value: String(stats?.over_threshold_count ?? 0), icon: FileText, color: '#2563EB', bg: '#EFF6FF' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>1099 Contractors</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Track contractor payments and 1099-NEC filings</p>
        </div>
        <div className="flex gap-2">
          <Select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{ width: 100 }}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer" style={{ padding: '0 16px' }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Contractor
          </Button>
        </div>
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

      {/* $600 alert banner */}
      {(stats?.over_threshold_count ?? 0) > 0 && (
        <div style={{ borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <AlertTriangle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
            <strong>{stats?.over_threshold_count}</strong> contractor{(stats?.over_threshold_count ?? 0) > 1 ? 's have' : ' has'} exceeded the ${THRESHOLD} 1099-NEC reporting threshold for {yearFilter}. Review and generate forms below.
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 384 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8', pointerEvents: 'none' }} />
        <Input placeholder="Search contractors..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {/* Contractor list */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UserSquare2}
            title={search ? 'No contractors match your search' : 'No contractors yet'}
            description={search ? 'Try a different search term.' : 'Add your first contractor to track 1099 payments.'}
            action={!search ? <Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} />Add Contractor</Button> : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    {['Contractor', 'Tax ID', 'Rate', 'YTD Paid', '1099 Status', 'Status', ''].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: i > 2 ? 'center' : 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const ytd = parseFloat(String(c.total_paid_ytd ?? 0));
                    const over = ytd >= THRESHOLD;
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 1 ? '#FAFBFC' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? '#FAFBFC' : 'transparent')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 500, color: '#0F172A' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.email ?? '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontFamily: 'monospace', fontSize: 12 }}>
                          {c.tax_id_last4 ? `***-**-${c.tax_id_last4}` : '—'}
                          {c.tax_id_last4 && <span style={{ marginLeft: 6, fontSize: 10, color: '#94A3B8' }}>({c.tax_id_type})</span>}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                          {c.rate != null ? `${formatCurrency(c.rate)}/${c.rate_type === 'hourly' ? 'hr' : 'project'}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: over ? '#D97706' : '#0F172A' }}>
                          {formatCurrency(ytd)}
                          {over && <div style={{ fontSize: 10, color: '#D97706', fontWeight: 500 }}>Over threshold</div>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {over ? (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#FFFBEB', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle style={{ width: 10, height: 10 }} /> Required
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#F1F5F9', color: '#64748B' }}>
                              Under ${THRESHOLD}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.is_active ? '#ECFDF5' : '#F1F5F9', color: c.is_active ? '#059669' : '#64748B' }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {over && (
                              <button
                                onClick={() => setShowing1099Id(c.id)}
                                className="cursor-pointer"
                                style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <FileText style={{ width: 11, height: 11 }} /> 1099
                              </button>
                            )}
                            <button onClick={() => openEdit(c)} className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                              <Pencil style={{ width: 13, height: 13 }} />
                            </button>
                            <button
                              onClick={() => setDeactivatingId(c.id)}
                              className="cursor-pointer"
                              style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: c.is_active ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${c.is_active ? '#FECACA' : '#BBF7D0'}`, color: c.is_active ? '#EF4444' : '#059669' }}
                            >
                              {c.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden">
              {filtered.map((c, i) => {
                const ytd = parseFloat(String(c.total_paid_ytd ?? 0));
                const over = ytd >= THRESHOLD;
                return (
                  <div key={c.id} style={{ padding: '14px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ fontWeight: 500, color: '#0F172A', fontSize: 13, margin: 0 }}>{c.name}</p>
                          {over && <AlertTriangle style={{ width: 13, height: 13, color: '#D97706' }} />}
                        </div>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0' }}>{c.email ?? '—'}</p>
                        <p style={{ fontSize: 12, color: over ? '#D97706' : '#64748B', fontWeight: over ? 600 : 400, margin: '4px 0 0' }}>
                          YTD: {formatCurrency(ytd)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(c)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Contractor' : 'Add Contractor'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Full Name / Business Name</label>
              <Input placeholder="e.g., Alex Torres" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
              <Input type="email" placeholder="contractor@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Business Address</label>
              <Input placeholder="123 Main St, City, State ZIP" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax ID Type</label>
                <Select value={form.tax_id_type} onChange={e => setForm({ ...form, tax_id_type: e.target.value as 'SSN' | 'EIN' })}>
                  <option value="SSN">SSN</option>
                  <option value="EIN">EIN</option>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Last 4 Digits</label>
                <Input placeholder="1234" maxLength={4} value={form.tax_id_last4} onChange={e => setForm({ ...form, tax_id_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Rate Type</label>
                <Select value={form.rate_type} onChange={e => setForm({ ...form, rate_type: e.target.value as 'hourly' | 'project' })}>
                  <option value="hourly">Hourly</option>
                  <option value="project">Per Project</option>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  {form.rate_type === 'hourly' ? 'Hourly Rate' : 'Project Rate'}
                </label>
                <Input type="number" step="0.01" placeholder={form.rate_type === 'hourly' ? '125.00' : '5000.00'} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Payment Terms</label>
              <Select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                <option value="immediate">Immediate</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net60">Net 60</option>
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
              <Input placeholder="Specialization, project notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name} className="flex-1 cursor-pointer">
            {isSaving ? 'Saving...' : editingId ? 'Update Contractor' : 'Add Contractor'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={!!deactivatingId} onClose={() => setDeactivatingId(null)}>
        <DialogHeader>
          <DialogTitle>
            {(() => {
              const c = contractors.find(x => x.id === deactivatingId);
              return c?.is_active ? 'Deactivate Contractor' : 'Reactivate Contractor';
            })()}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            {(() => {
              const c = contractors.find(x => x.id === deactivatingId);
              return c?.is_active
                ? `Deactivate ${c?.name}? They will no longer appear in active contractor workflows.`
                : `Reactivate ${c?.name}? They will be visible in active contractor workflows.`;
            })()}
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeactivatingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => {
              if (deactivatingId) {
                const c = contractors.find(x => x.id === deactivatingId);
                if (c) handleDeactivate(deactivatingId, c.is_active);
              }
            }}
            disabled={updateMutation.isPending}
            className="flex-1 cursor-pointer"
          >
            {updateMutation.isPending ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 1099 Preview Dialog */}
      <Dialog open={!!showing1099Id} onClose={() => setShowing1099Id(null)}>
        <DialogHeader>
          <DialogTitle>1099-NEC Form Preview</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {contractor1099 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderRadius: 10, border: '2px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Form 1099-NEC — Nonemployee Compensation</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Tax Year {yearFilter}</p>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px' }}>Recipient Name</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>{contractor1099.name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px' }}>Taxpayer ID Number</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0, fontFamily: 'monospace' }}>
                        {contractor1099.tax_id_last4
                          ? (contractor1099.tax_id_type === 'SSN'
                            ? `***-**-${contractor1099.tax_id_last4}`
                            : `**-***${contractor1099.tax_id_last4}`)
                          : 'Not on file'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px' }}>Address</p>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{contractor1099.address ?? 'Not on file'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px' }}>Box 1 — Nonemployee Compensation</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#D97706', margin: 0 }}>{formatCurrency(parseFloat(String(contractor1099.total_paid_ytd ?? 0)))}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderRadius: 10, padding: 14, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', gap: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                  This is a preview only. You must file the actual 1099-NEC with the IRS by January 31st following the tax year. Use your payroll software or the IRS FIRE system to submit.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setShowing1099Id(null)} className="w-full cursor-pointer">Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
