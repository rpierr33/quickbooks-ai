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
  Users, Plus, Pencil, Trash2, Play, ChevronDown, ChevronUp,
  DollarSign, Calendar, TrendingUp, UserCheck,
} from "lucide-react";

const card: React.CSSProperties = {
  background: 'var(--paper-2)',
  border: '1px solid var(--rule)',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};

const PAY_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'semimonthly', label: 'Semi-monthly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const EMPTY_FORM = {
  name: '',
  email: '',
  role: '',
  pay_type: 'salary' as 'salary' | 'hourly',
  rate: '',
  tax_withholding_pct: '22',
  status: 'active' as 'active' | 'inactive',
  start_date: new Date().toISOString().slice(0, 10),
};

function computeGross(rate: number, payType: string, payPeriod: string): number {
  if (payType === 'salary') {
    const periods: Record<string, number> = {
      weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12,
    };
    return rate / (periods[payPeriod] ?? 26);
  }
  // hourly: assume 40h/week
  const hoursPerPeriod: Record<string, number> = {
    weekly: 40, biweekly: 80, semimonthly: 86.67, monthly: 173.33,
  };
  return rate * (hoursPerPeriod[payPeriod] ?? 80);
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [payPeriod, setPayPeriod] = useState('biweekly');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [activeTab, setActiveTab] = useState<'employees' | 'history'>('employees');

  // Payroll run form state
  const [runPeriodStart, setRunPeriodStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [runPeriodEnd, setRunPeriodEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  const { data, isLoading } = useQuery<{
    employees: any[];
    stats: { total_employees: number; active_employees: number; payroll_this_month: number; ytd_payroll: number; next_pay_date: string };
  }>({
    queryKey: ['payroll'],
    queryFn: () => fetch('/api/payroll').then(r => r.json()),
  });

  const { data: runsData, isLoading: runsLoading } = useQuery<any[]>({
    queryKey: ['payroll_runs'],
    queryFn: () => fetch('/api/payroll?resource=payroll_runs').then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      closeDialog();
      toast(editingId ? 'Employee updated' : 'Employee added');
    },
    onError: () => toast('Failed to save employee', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      fetch(`/api/payroll/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      closeDialog();
      toast('Employee updated');
    },
    onError: () => toast('Failed to update employee', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/payroll/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setDeletingId(null);
      toast('Employee removed');
    },
    onError: () => toast('Failed to remove employee', 'error'),
  });

  const runPayrollMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run_payroll', ...body }) }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast(res.error, 'error'); return; }
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] });
      setShowRunDialog(false);
      toast('Payroll run completed');
    },
    onError: () => toast('Failed to run payroll', 'error'),
  });

  const employees = data?.employees ?? [];
  const stats = data?.stats;
  const runs = Array.isArray(runsData) ? runsData : [];

  // Preview entries for run payroll dialog
  const previewEntries = useMemo(() => {
    return employees
      .filter(e => e.status === 'active')
      .map(e => {
        const rate = parseFloat(e.rate ?? 0);
        const gross = parseFloat(computeGross(rate, e.pay_type, payPeriod).toFixed(2));
        const taxes = parseFloat((gross * (parseFloat(e.tax_withholding_pct ?? 22) / 100)).toFixed(2));
        const deductions = 0;
        const net = parseFloat((gross - taxes - deductions).toFixed(2));
        return { employee_id: e.id, employee_name: e.name, gross, taxes, deductions, net };
      });
  }, [employees, payPeriod]);

  function openEdit(emp: any) {
    setForm({
      name: emp.name ?? '',
      email: emp.email ?? '',
      role: emp.role ?? '',
      pay_type: emp.pay_type ?? 'salary',
      rate: String(emp.rate ?? ''),
      tax_withholding_pct: String(emp.tax_withholding_pct ?? 22),
      status: emp.status ?? 'active',
      start_date: emp.start_date ?? new Date().toISOString().slice(0, 10),
    });
    setEditingId(emp.id);
    setShowAddDialog(true);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleSubmit() {
    const payload = {
      ...form,
      rate: parseFloat(form.rate),
      tax_withholding_pct: parseFloat(form.tax_withholding_pct),
    };
    if (!form.name || !form.rate) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleRunPayroll() {
    if (previewEntries.length === 0) {
      toast('No active employees to pay', 'error');
      return;
    }
    runPayrollMutation.mutate({
      pay_period_start: runPeriodStart,
      pay_period_end: runPeriodEnd,
      entries: previewEntries,
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const statCards = [
    {
      label: 'Payroll This Month',
      value: formatCurrency(stats?.payroll_this_month ?? 0),
      icon: DollarSign,
      color: 'var(--stamp)',
      bg: '#F5E0D9',
    },
    {
      label: 'YTD Payroll Expense',
      value: formatCurrency(stats?.ytd_payroll ?? 0),
      icon: TrendingUp,
      color: 'var(--pencil)',
      bg: '#DDE4EC',
    },
    {
      label: 'Active Employees',
      value: String(stats?.active_employees ?? 0),
      icon: UserCheck,
      color: 'var(--stamp)',
      bg: '#DDE4EC',
    },
    {
      label: 'Next Pay Date',
      value: stats?.next_pay_date ? formatDate(stats.next_pay_date) : '—',
      icon: Calendar,
      color: 'var(--ai)',
      bg: '#F2E7D0',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Payroll</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Manage employees and run payroll</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={payPeriod}
            onChange={e => setPayPeriod(e.target.value)}
            style={{ width: 140 }}
          >
            {PAY_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowRunDialog(true)}
            className="cursor-pointer flex items-center gap-2"
            style={{ padding: '0 14px' }}
          >
            <Play style={{ width: 14, height: 14 }} /> Run Payroll
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer" style={{ padding: '0 16px' }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} style={{ ...card, padding: 20, overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>{s.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 16, height: 16, color: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{isLoading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)' }}>
        {(['employees', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="cursor-pointer"
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#B33A1F' : '#64748B',
              borderBottom: activeTab === tab ? '2px solid #B33A1F' : '2px solid transparent',
              background: 'transparent',
              border: 'none',
              textTransform: 'capitalize',
              cursor: 'pointer',
            } as React.CSSProperties}
          >
            {tab === 'employees' ? 'Employees' : 'Payroll History'}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div style={card}>
          {isLoading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-shimmer" />)}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No employees yet"
              description="Add your first employee to start managing payroll."
              action={<Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} />Add Employee</Button>}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                      {['Employee', 'Role', 'Pay Type', 'Rate', 'Tax W/H', 'Status', ''].map((h, i) => (
                        <th key={i} style={{ padding: '12px 16px', textAlign: i > 3 ? 'center' : 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => {
                      const rate = parseFloat(emp.rate ?? 0);
                      const gross = computeGross(rate, emp.pay_type, payPeriod);
                      return (
                        <tr
                          key={emp.id}
                          style={{ borderBottom: '1px solid var(--rule-soft)', background: i % 2 === 1 ? '#EFE7D5' : 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? '#EFE7D5' : 'transparent')}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{emp.email}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--ink-3)' }}>{emp.role ?? '—'}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: emp.pay_type === 'salary' ? '#DDE4EC' : '#DDE4EC', color: emp.pay_type === 'salary' ? '#171510' : '#1C3A5B', textTransform: 'capitalize' }}>
                              {emp.pay_type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                            <div style={{ fontWeight: 600 }}>{formatCurrency(gross)}<span style={{ fontWeight: 400, color: 'var(--ink-4)', fontSize: 11 }}>/{payPeriod === 'weekly' ? 'wk' : payPeriod === 'biweekly' ? '2wk' : payPeriod === 'semimonthly' ? 'sm' : 'mo'}</span></div>
                            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                              {emp.pay_type === 'salary' ? `${formatCurrency(rate)}/yr` : `${formatCurrency(rate)}/hr`}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--ink-3)' }}>{parseFloat(emp.tax_withholding_pct ?? 22)}%</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: emp.status === 'active' ? '#DDE4EC' : '#F1F5F9', color: emp.status === 'active' ? '#1C3A5B' : '#64748B', textTransform: 'capitalize' }}>
                              {emp.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button onClick={() => openEdit(emp)} className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                                <Pencil style={{ width: 13, height: 13 }} />
                              </button>
                              <button onClick={() => setDeletingId(emp.id)} className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--stamp-soft)', background: 'var(--stamp-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stamp)' }}>
                                <Trash2 style={{ width: 13, height: 13 }} />
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
                {employees.map((emp, i) => {
                  const gross = computeGross(parseFloat(emp.rate ?? 0), emp.pay_type, payPeriod);
                  return (
                    <div key={emp.id} style={{ padding: '14px 16px', borderBottom: i < employees.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13 }}>{emp.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{emp.role ?? emp.pay_type}</p>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{formatCurrency(gross)}/{payPeriod === 'biweekly' ? '2wk' : payPeriod.slice(0, 2)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: emp.status === 'active' ? '#DDE4EC' : '#F1F5F9', color: emp.status === 'active' ? '#1C3A5B' : '#64748B' }}>{emp.status}</span>
                        <button onClick={() => openEdit(emp)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={() => setDeletingId(emp.id)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--stamp-soft)', background: 'var(--stamp-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stamp)' }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={card}>
          {runsLoading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-shimmer" />)}
            </div>
          ) : runs.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No payroll runs yet"
              description="Run your first payroll to see history here."
              action={<Button size="sm" onClick={() => setShowRunDialog(true)} className="cursor-pointer"><Play style={{ width: 16, height: 16, marginRight: 4 }} />Run Payroll</Button>}
            />
          ) : (
            <div>
              {runs.map((run, i) => (
                <div key={run.id} style={{ borderBottom: i < runs.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}
                    onClick={() => setShowHistoryId(showHistoryId === run.id ? null : run.id)}
                  >
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
                        {formatDate(run.pay_period_start)} – {formatDate(run.pay_period_end)}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                        Ran {formatDate(run.run_date)} &middot; {run.entries?.length ?? 0} employees
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{formatCurrency(parseFloat(run.total_gross ?? 0))}</p>
                        <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>Gross</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pencil)' }}>{formatCurrency(parseFloat(run.total_net ?? 0))}</p>
                        <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>Net</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--pencil-soft)', color: 'var(--pencil)' }}>
                        {run.status ?? 'completed'}
                      </span>
                      {showHistoryId === run.id
                        ? <ChevronUp style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
                        : <ChevronDown style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
                      }
                    </div>
                  </div>
                  {showHistoryId === run.id && (
                    <div style={{ padding: '0 20px 16px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                            {['Employee', 'Gross', 'Taxes', 'Deductions', 'Net'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Employee' ? 'left' : 'right', color: 'var(--ink-3)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(run.entries ?? []).map((entry: any, ei: number) => (
                            <tr key={ei} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--ink)', fontWeight: 500 }}>{entry.employee_name}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--ink)' }}>{formatCurrency(parseFloat(entry.gross ?? 0))}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--stamp)' }}>{formatCurrency(parseFloat(entry.taxes ?? 0))}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--ink-3)' }}>{formatCurrency(parseFloat(entry.deductions ?? 0))}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--pencil)', fontWeight: 600 }}>{formatCurrency(parseFloat(entry.net ?? 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Employee Dialog */}
      <Dialog open={showAddDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Full Name</label>
              <Input placeholder="e.g., Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Email</label>
              <Input type="email" placeholder="jane@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Job Title / Role</label>
              <Input placeholder="e.g., Senior Developer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Pay Type</label>
                <Select value={form.pay_type} onChange={e => setForm({ ...form, pay_type: e.target.value as 'salary' | 'hourly' })}>
                  <option value="salary">Salary</option>
                  <option value="hourly">Hourly</option>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
                  {form.pay_type === 'salary' ? 'Annual Salary' : 'Hourly Rate'}
                </label>
                <Input type="number" step="0.01" placeholder={form.pay_type === 'salary' ? '75000' : '35.00'} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Tax Withholding %</label>
                <Input type="number" step="0.1" min="0" max="50" placeholder="22" value={form.tax_withholding_pct} onChange={e => setForm({ ...form, tax_withholding_pct: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Status</label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name || !form.rate} className="flex-1 cursor-pointer">
            {isSaving ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Run Payroll Dialog */}
      <Dialog open={showRunDialog} onClose={() => setShowRunDialog(false)}>
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Period Start</label>
                <Input type="date" value={runPeriodStart} onChange={e => setRunPeriodStart(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Period End</label>
                <Input type="date" value={runPeriodEnd} onChange={e => setRunPeriodEnd(e.target.value)} />
              </div>
            </div>

            {previewEntries.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '16px 0' }}>No active employees to pay.</p>
            ) : (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--rule)' }}>
                <div style={{ padding: '10px 16px', background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Pay Preview</p>
                </div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                      {['Employee', 'Gross', 'Taxes', 'Net'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Employee' ? 'left' : 'right', color: 'var(--ink-3)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewEntries.map((e, i) => (
                      <tr key={i} style={{ borderBottom: i < previewEntries.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--ink)' }}>{e.employee_name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--ink)' }}>{formatCurrency(e.gross)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--stamp)' }}>{formatCurrency(e.taxes)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--pencil)', fontWeight: 600 }}>{formatCurrency(e.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #E2E8F0', background: 'var(--paper)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ink)', fontSize: 12 }}>Total</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>{formatCurrency(previewEntries.reduce((s, e) => s + e.gross, 0))}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--stamp)' }}>{formatCurrency(previewEntries.reduce((s, e) => s + e.taxes, 0))}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--pencil)' }}>{formatCurrency(previewEntries.reduce((s, e) => s + e.net, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setShowRunDialog(false)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={handleRunPayroll}
            disabled={runPayrollMutation.isPending || previewEntries.length === 0}
            className="flex-1 cursor-pointer"
          >
            {runPayrollMutation.isPending ? 'Processing...' : `Confirm & Pay ${previewEntries.length} Employee${previewEntries.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader><DialogTitle>Remove Employee</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Are you sure you want to remove this employee? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer"
            style={{ background: 'var(--stamp)', borderColor: '#B33A1F' }}
          >
            {deleteMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
