"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileCheck, ArrowRight, Trash2, Clock, Send, CheckCircle2, XCircle, FileText, CalendarDays } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Estimate, EstimateItem } from "@/types";

const statusConfig: Record<string, { bg: string; color: string; border: string; borderLeft: string }> = {
  draft: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', borderLeft: '#94A3B8' },
  sent: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', borderLeft: '#F59E0B' },
  accepted: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', borderLeft: '#059669' },
  declined: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', borderLeft: '#EF4444' },
  converted: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', borderLeft: '#7C3AED' },
};

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const statusTabs = ['all', 'draft', 'sent', 'accepted', 'declined'] as const;

export default function EstimatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [viewEstimate, setViewEstimate] = useState<Estimate | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    client_name: "", client_email: "", valid_until: "", tax_rate: "0", notes: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] as EstimateItem[],
  });

  const { data: estimates, isLoading } = useQuery<Estimate[]>({
    queryKey: ["estimates"],
    queryFn: () => fetch("/api/estimates").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/estimates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, tax_rate: parseFloat(data.tax_rate) }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["estimates"] }); setShowCreate(false); resetForm(); toast("Estimate created successfully"); },
    onError: () => { toast("Failed to create estimate", "error"); },
  });

  const convertMutation = useMutation({
    mutationFn: async (est: Estimate) => {
      // Create invoice from estimate
      const invoiceData = {
        client_name: est.client_name,
        client_email: est.client_email,
        items: est.items,
        tax_rate: est.tax_rate,
        due_date: null,
        notes: est.notes ? `Converted from ${est.estimate_number}. ${est.notes}` : `Converted from ${est.estimate_number}`,
      };
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoiceData) });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Estimate converted to invoice");
    },
    onError: () => { toast("Failed to convert estimate", "error"); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/estimates/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["estimates"] }); toast("Estimate status updated"); },
    onError: () => { toast("Failed to update estimate", "error"); },
  });

  const resetForm = () => {
    setStep(1);
    setForm({ client_name: "", client_email: "", valid_until: "", tax_rate: "0", notes: "", items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] });
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: string | number) => {
    const items = [...form.items];
    (items[index] as any)[field] = value;
    items[index].amount = items[index].quantity * items[index].rate;
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, rate: 0, amount: 0 }] });
  const removeItem = (i: number) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) }); };

  const subtotal = form.items.reduce((s, item) => s + item.amount, 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) / 100);
  const total = subtotal + taxAmount;

  const filteredEstimates = useMemo(() => {
    if (!estimates) return [];
    if (activeTab === 'all') return estimates;
    return estimates.filter(e => e.status === activeTab);
  }, [estimates, activeTab]);

  const stats = useMemo(() => {
    if (!estimates) return { total: 0, accepted: 0, pending: 0, rate: 0 };
    const parseTotal = (e: Estimate) => typeof e.total === 'string' ? parseFloat(e.total as unknown as string) : e.total;
    const totalCount = estimates.length;
    const acceptedValue = estimates.filter(e => e.status === 'accepted' || e.status === 'converted').reduce((s, e) => s + parseTotal(e), 0);
    const pendingValue = estimates.filter(e => e.status === 'sent' || e.status === 'draft').reduce((s, e) => s + parseTotal(e), 0);
    const acceptedCount = estimates.filter(e => e.status === 'accepted' || e.status === 'converted').length;
    const decidedCount = acceptedCount + estimates.filter(e => e.status === 'declined').length;
    const rate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0;
    return { total: totalCount, accepted: acceptedValue, pending: pendingValue, rate };
  }, [estimates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p style={{ fontSize: 14, color: '#64748B' }}>{estimates?.length || 0} total estimates</p>
        <Button onClick={() => setShowCreate(true)} className="cursor-pointer shrink-0 whitespace-nowrap">
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Create Estimate
        </Button>
      </div>

      {/* Summary Stats */}
      {estimates && estimates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
          <div style={{ ...card, borderLeft: '4px solid #7C3AED', padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C3AED' }}>Total Estimates</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#0F172A', marginTop: 4 }}>{stats.total}</p>
          </div>
          <div style={{ ...card, borderLeft: '4px solid #059669', padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669' }}>Accepted Value</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#059669', marginTop: 4 }}>{formatCurrency(stats.accepted)}</p>
          </div>
          <div style={{ ...card, borderLeft: '4px solid #F59E0B', padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D97706' }}>Pending Value</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#0F172A', marginTop: 4 }}>{formatCurrency(stats.pending)}</p>
          </div>
          <div style={{ ...card, borderLeft: '4px solid #2563EB', padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563EB' }}>Conversion Rate</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#0F172A', marginTop: 4 }}>{stats.rate}%</p>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      {estimates && estimates.length > 0 && (
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {statusTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="cursor-pointer"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none',
                textTransform: 'capitalize', transition: 'all 0.15s',
                background: activeTab === tab ? '#FFFFFF' : 'transparent',
                color: activeTab === tab ? '#0F172A' : '#64748B',
                boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Estimate Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-2xl animate-shimmer" />)}
        </div>
      ) : !estimates || estimates.length === 0 ? (
        <EmptyState icon={FileCheck} title="No estimates yet" description="Create your first estimate to start quoting clients."
          action={<Button size="sm" onClick={() => setShowCreate(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Create</Button>} />
      ) : filteredEstimates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>No estimates with status &ldquo;{activeTab}&rdquo;</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {filteredEstimates.map((est) => {
            const sc = statusConfig[est.status] || statusConfig.draft;
            const items = typeof est.items === 'string' ? JSON.parse(est.items as unknown as string) : est.items;
            const itemCount = Array.isArray(items) ? items.length : 0;
            return (
              <div key={est.id} className="group" style={{ ...card, borderLeft: `4px solid ${sc.borderLeft}`, overflow: 'hidden' }}>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.06em', color: '#94A3B8' }}>{est.estimate_number}</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#64748B', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.client_name}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', flexShrink: 0, marginLeft: 8,
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    }}>
                      {est.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#0F172A', marginTop: 8 }}>{formatCurrency(est.total)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    {est.valid_until && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                        <CalendarDays style={{ width: 12, height: 12, color: '#94A3B8' }} />
                        Valid until {formatDate(est.valid_until)}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {/* Quick Actions on hover */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', flexWrap: 'wrap' }}
                >
                  {est.status === 'accepted' && (
                    <button
                      onClick={() => convertMutation.mutate(est)}
                      disabled={convertMutation.isPending}
                      className="cursor-pointer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', border: 'none' }}
                    >
                      <ArrowRight style={{ width: 12, height: 12 }} /> Convert to Invoice
                    </button>
                  )}
                  {est.status === 'draft' && (
                    <button onClick={() => updateStatusMutation.mutate({ id: est.id, status: 'sent' })} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#2563EB', background: '#EFF6FF', border: 'none' }}>
                      <Send style={{ width: 12, height: 12 }} /> Send
                    </button>
                  )}
                  {est.status === 'sent' && (
                    <>
                      <button onClick={() => updateStatusMutation.mutate({ id: est.id, status: 'accepted' })} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#059669', background: '#ECFDF5', border: 'none' }}>
                        <CheckCircle2 style={{ width: 12, height: 12 }} /> Accept
                      </button>
                      <button onClick={() => updateStatusMutation.mutate({ id: est.id, status: 'declined' })} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#DC2626', background: '#FEF2F2', border: 'none' }}>
                        <XCircle style={{ width: 12, height: 12 }} /> Decline
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setViewEstimate(est)}
                    className="cursor-pointer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#64748B', background: '#F1F5F9', border: 'none' }}
                  >
                    <FileText style={{ width: 12, height: 12 }} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Estimate Dialog */}
      <Dialog open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Client Information" : step === 2 ? "Line Items" : "Review & Create"}</DialogTitle>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? '#7C3AED' : '#E2E8F0' }} />)}
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Client Name</label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Acme Corp" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label><Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="billing@acme.com" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Valid Until</label><Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.items.map((item, i) => (
                <div key={i} style={{ borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" />
                  <div className="flex gap-3 items-end">
                    <div className="flex-1"><label style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', display: 'block', marginBottom: 6 }}>Qty</label><Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} /></div>
                    <div className="flex-1"><label style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', display: 'block', marginBottom: 6 }}>Rate</label><Input type="number" step="0.01" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} /></div>
                    <button onClick={() => removeItem(i)} className="cursor-pointer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#94A3B8', background: 'transparent', border: 'none' }} aria-label="Remove"><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </div>
                  {item.amount > 0 && <p style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatCurrency(item.amount)}</p>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full cursor-pointer border-dashed"><Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Line Item</Button>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Client</span><span style={{ fontWeight: 600, color: '#0F172A' }}>{form.client_name}</span></div>
                {form.valid_until && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Valid Until</span><span style={{ fontWeight: 500, color: '#0F172A' }}>{formatDate(form.valid_until)}</span></div>}
                {form.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm" style={{ color: '#475569' }}><span className="truncate mr-3">{item.description} &times;{item.quantity}</span><span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrency(item.amount)}</span></div>
                ))}
                <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid #E2E8F0' }}><div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrency(subtotal)}</span></div></div>
              </div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax Rate (%)</label><Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Notes</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, paddingTop: 8, color: '#0F172A' }}><span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span></div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 w-full cursor-pointer">Back</Button>}
          <Button onClick={() => { if (step < 3) { setStep(step + 1); return; } createMutation.mutate(form); }} disabled={createMutation.isPending} className="flex-1 w-full cursor-pointer">
            {step < 3 ? "Next" : createMutation.isPending ? "Creating..." : "Create Estimate"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* View Estimate Dialog */}
      {viewEstimate && (() => {
        const est = viewEstimate;
        const sc = statusConfig[est.status] || statusConfig.draft;
        const items = typeof est.items === 'string' ? JSON.parse(est.items as unknown as string) : est.items;
        const viewSubtotal = Array.isArray(items) ? items.reduce((s: number, it: EstimateItem) => s + it.amount, 0) : 0;
        const viewTaxRate = typeof est.tax_rate === 'string' ? parseFloat(est.tax_rate as unknown as string) : est.tax_rate;
        const viewTaxAmount = viewSubtotal * (viewTaxRate / 100);
        const viewTotal = typeof est.total === 'string' ? parseFloat(est.total as unknown as string) : est.total;
        return (
          <Dialog open={!!viewEstimate} onClose={() => setViewEstimate(null)}>
            <DialogHeader>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingRight: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.06em', color: '#94A3B8' }}>{est.estimate_number}</p>
                  <DialogTitle style={{ marginTop: 4 }}>{est.client_name}</DialogTitle>
                  {est.client_email && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{est.client_email}</p>}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                  textTransform: 'capitalize', flexShrink: 0,
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                }}>
                  {est.status}
                </span>
              </div>
            </DialogHeader>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Dates */}
                {(est.valid_until || est.created_at) && (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {est.created_at && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 2 }}>Created</p>
                        <p style={{ fontSize: 13, color: '#475569' }}>{formatDate(est.created_at)}</p>
                      </div>
                    )}
                    {est.valid_until && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 2 }}>Valid Until</p>
                        <p style={{ fontSize: 13, color: '#475569' }}>{formatDate(est.valid_until)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Line Items */}
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Description</span>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Amount</span>
                  </div>
                  {Array.isArray(items) && items.map((item: EstimateItem, i: number) => (
                    <div key={i} style={{ padding: '12px 14px', borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{item.description}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{item.quantity} &times; {formatCurrency(item.rate)}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A', flexShrink: 0, marginLeft: 12 }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                    <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(viewSubtotal)}</span>
                  </div>
                  {viewTaxRate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                      <span>Tax ({viewTaxRate}%)</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(viewTaxAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#0F172A', paddingTop: 8, borderTop: '1px solid #E2E8F0', marginTop: 4 }}>
                    <span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(viewTotal)}</span>
                  </div>
                </div>

                {/* Notes */}
                {est.notes && (
                  <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>Notes</p>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{est.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewEstimate(null)} className="cursor-pointer flex-1">Close</Button>
              {est.status === 'accepted' && (
                <Button
                  onClick={() => { convertMutation.mutate(est); setViewEstimate(null); }}
                  disabled={convertMutation.isPending}
                  className="cursor-pointer flex-1"
                >
                  <ArrowRight style={{ width: 14, height: 14, marginRight: 6 }} /> Convert to Invoice
                </Button>
              )}
            </DialogFooter>
          </Dialog>
        );
      })()}
    </div>
  );
}
