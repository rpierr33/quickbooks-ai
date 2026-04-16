"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCurrencyAmount, SUPPORTED_CURRENCIES, getExchangeRate, convertAmount } from "@/lib/currency";
import { Plus, FileText, Trash2, Mail, CheckCircle2, Download, CreditCard, Send, Loader2, Pencil } from "lucide-react";
import { ProductTour } from "@/components/ui/product-tour";
import { exportInvoices } from "@/lib/export";
import { downloadInvoicePDF, settingsToWhiteLabel } from "@/lib/invoice-pdf";
import { useToast } from "@/components/ui/toast";
import type { Invoice, InvoiceItem } from "@/types";

const BASE_CURRENCY = "USD";

const statusConfig: Record<string, { bg: string; color: string; border: string; borderLeft: string }> = {
  draft: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', borderLeft: '#94A3B8' },
  sent: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', borderLeft: '#F59E0B' },
  paid: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', borderLeft: '#059669' },
  overdue: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', borderLeft: '#EF4444' },
};

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

type FormState = {
  client_name: string;
  client_email: string;
  due_date: string;
  tax_rate: string;
  notes: string;
  currency: string;
  items: InvoiceItem[];
};

const BLANK_FORM: FormState = {
  client_name: "", client_email: "", due_date: "", tax_rate: "0", notes: "", currency: "USD",
  items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => fetch("/api/invoices").then(r => r.json()),
  });

  const { data: companySettings } = useQuery<Record<string, unknown>>({
    queryKey: ["company-settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const exchangeRate = getExchangeRate(data.currency, BASE_CURRENCY);
      return fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tax_rate: parseFloat(data.tax_rate), exchange_rate: exchangeRate }),
      }).then(r => r.json());
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); closeDialog(); toast("Invoice created successfully"); },
    onError: () => { toast("Failed to create invoice", "error"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<typeof form>) =>
      fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, tax_rate: data.tax_rate !== undefined ? parseFloat(data.tax_rate) : undefined }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); closeEdit(); toast("Invoice updated successfully"); },
    onError: () => { toast("Failed to update invoice", "error"); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); toast("Invoice status updated"); },
    onError: () => { toast("Failed to update invoice", "error"); },
  });

  const closeDialog = () => {
    setShowCreate(false);
    resetForm();
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditingId(null);
    setForm(BLANK_FORM);
    setStep(1);
  };

  const openEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setForm({
      client_name: inv.client_name,
      client_email: inv.client_email || "",
      due_date: inv.due_date || "",
      tax_rate: String(inv.tax_rate ?? 0),
      notes: inv.notes || "",
      currency: inv.currency ?? "USD",
      items: Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items.map(it => ({ ...it }))
        : [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    });
    setStep(1);
    setShowEdit(true);
  };

  const resetForm = () => {
    setStep(1);
    setForm(BLANK_FORM);
  };

  const handleSendReminder = async (inv: Invoice) => {
    if (!inv.client_email) return;
    setSendingReminderId(inv.id);
    try {
      const now = new Date();
      const dueDate = inv.due_date ? new Date(inv.due_date) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const total = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_reminder",
          clientName: inv.client_name,
          clientEmail: inv.client_email,
          invoiceNumber: inv.invoice_number,
          amount: total,
          dueDate: inv.due_date || "",
          daysOverdue,
          paymentUrl: `${window.location.origin}/pay/${inv.id}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 503) {
          toast(`Email not configured. Open: mailto:${inv.client_email}`, "error");
        } else {
          toast(err.error || "Failed to send reminder", "error");
        }
        return;
      }

      toast(`Reminder sent to ${inv.client_email}`);
    } catch {
      toast("Failed to send reminder", "error");
    } finally {
      setSendingReminderId(null);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...form.items];
    (items[index] as unknown as Record<string, string | number>)[field] = value;
    items[index].amount = items[index].quantity * items[index].rate;
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, rate: 0, amount: 0 }] });
  const removeItem = (i: number) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) }); };

  const subtotal = form.items.reduce((s, item) => s + item.amount, 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) / 100);
  const total = subtotal + taxAmount;

  const stats = useMemo(() => {
    if (!invoices) return { overdue: 0, paid: 0, outstanding: 0 };
    const parseTotal = (i: Invoice) => typeof i.total === 'string' ? parseFloat(i.total) : i.total;
    return {
      overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + parseTotal(i), 0),
      paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseTotal(i), 0),
      outstanding: invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + parseTotal(i), 0),
    };
  }, [invoices]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p style={{ fontSize: 14, color: '#64748B' }}>{invoices?.length || 0} total invoices</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {invoices && invoices.length > 0 && (
            <button
              onClick={() => exportInvoices(invoices)}
              className="cursor-pointer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569' }}
            >
              <Download style={{ width: 14, height: 14 }} /> Export
            </button>
          )}
          <Button data-tour="create-invoice-btn" onClick={() => setShowCreate(true)} className="cursor-pointer shrink-0 whitespace-nowrap">
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Stats — each card filters the list below */}
      {invoices && invoices.length > 0 && (
        <div data-tour="invoice-stats" className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
          {[
            { label: 'Overdue', amount: stats.overdue, color: '#EF4444', textColor: '#DC2626', filter: 'overdue' },
            { label: 'Outstanding', amount: stats.outstanding, color: '#F59E0B', textColor: '#0F172A', filter: 'outstanding' },
            { label: 'Paid', amount: stats.paid, color: '#059669', textColor: '#059669', filter: 'paid' },
          ].map(({ label, amount, color, textColor }) => (
            <div
              key={label}
              style={{
                ...card,
                borderLeft: `4px solid ${color}`,
                padding: 20,
                cursor: 'pointer',
                transition: 'box-shadow 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ''}
            >
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: textColor, marginTop: 4 }}>{formatCurrency(amount)}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-2xl animate-shimmer" />)}
        </div>
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Create your first invoice to start billing."
          action={<Button size="sm" onClick={() => setShowCreate(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Create</Button>} />
      ) : (
        <div data-tour="invoice-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {invoices.map((inv) => {
            const sc = statusConfig[inv.status] || statusConfig.draft;
            const isOverdue = inv.status === 'overdue';
            const isPaid = inv.status === 'paid';
            const canEdit = inv.status === 'draft' || inv.status === 'sent';
            return (
              <div key={inv.id} className="group" style={{ ...card, borderLeft: `4px solid ${sc.borderLeft}`, overflow: 'hidden' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => canEdit && openEdit(inv)}
                  onKeyDown={e => e.key === 'Enter' && canEdit && openEdit(inv)}
                  style={{
                    padding: 20, display: 'flex', flexDirection: 'column', gap: 4,
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => { if (canEdit) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.06em', color: '#94A3B8' }}>{inv.invoice_number}</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#64748B', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.client_name}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', flexShrink: 0, marginLeft: 8,
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    }}>
                      {inv.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A', marginTop: 8 }}>{formatCurrency(inv.total)}</p>
                  {inv.due_date && (
                    <p style={{
                      fontSize: 13, marginTop: 4,
                      color: isOverdue ? '#DC2626' : isPaid ? '#94A3B8' : '#64748B',
                      fontWeight: isOverdue ? 600 : 400,
                      textDecoration: isPaid ? 'line-through' : 'none',
                    }}>
                      Due {formatDate(inv.due_date)}
                    </p>
                  )}
                  {canEdit && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Click to edit</p>}
                </div>
                {/* Quick Actions on hover */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', flexWrap: 'wrap' }}
                >
                  {/* Edit button — only for draft/sent */}
                  {canEdit ? (
                    <button
                      onClick={() => openEdit(inv)}
                      className="cursor-pointer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#475569', background: '#F1F5F9', border: 'none' }}
                    >
                      <Pencil style={{ width: 12, height: 12 }} /> Edit
                    </button>
                  ) : (
                    <button
                      disabled
                      title="Paid invoices cannot be edited"
                      className="cursor-not-allowed opacity-40"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#475569', background: '#F1F5F9', border: 'none' }}
                    >
                      <Pencil style={{ width: 12, height: 12 }} /> Edit
                    </button>
                  )}
                  {isOverdue && inv.client_email && (
                    <button
                      onClick={() => handleSendReminder(inv)}
                      disabled={sendingReminderId === inv.id}
                      className="cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: 'none' }}
                    >
                      {sendingReminderId === inv.id
                        ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                        : <Send style={{ width: 12, height: 12 }} />
                      }
                      {sendingReminderId === inv.id ? 'Sending...' : 'Send Reminder'}
                    </button>
                  )}
                  {isOverdue && !inv.client_email && (
                    <button disabled className="cursor-not-allowed opacity-50" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: 'none' }}>
                      <Mail style={{ width: 12, height: 12 }} /> No Email
                    </button>
                  )}
                  {!isPaid && (
                    <button onClick={() => window.open(`/pay/${inv.id}`, '_blank')} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#7C3AED', background: '#EDE9FE', border: 'none' }}>
                      <CreditCard style={{ width: 12, height: 12 }} /> Pay Link
                    </button>
                  )}
                  {!isPaid && (
                    <button onClick={() => updateStatusMutation.mutate({ id: inv.id, status: 'paid' })} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#059669', background: '#ECFDF5', border: 'none' }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> Mark Paid
                    </button>
                  )}
                  <button onClick={() => downloadInvoicePDF(inv, undefined, companySettings ? settingsToWhiteLabel(companySettings as any) : undefined)} className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#64748B', background: '#F1F5F9', border: 'none' }}>
                    <Download style={{ width: 12, height: 12 }} /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Invoice Dialog */}
      <Dialog open={showEdit} onClose={closeEdit}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Edit — Client Info" : step === 2 ? "Edit — Line Items" : "Edit — Review"}
          </DialogTitle>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? '#7C3AED' : '#E2E8F0' }} />)}
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Client Name</label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Acme Corp" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label><Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="billing@acme.com" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Due Date</label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Notes</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
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
                {form.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm" style={{ color: '#475569' }}><span className="truncate mr-3">{item.description} &times;{item.quantity}</span><span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrency(item.amount)}</span></div>
                ))}
                <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid #E2E8F0' }}><div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrency(subtotal)}</span></div></div>
              </div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax Rate (%)</label><Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, paddingTop: 8, color: '#0F172A' }}><span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span></div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 w-full cursor-pointer">Back</Button>}
          <Button
            onClick={() => {
              if (step < 3) { setStep(step + 1); return; }
              if (!editingId) return;
              updateMutation.mutate({ id: editingId, ...form });
            }}
            disabled={isSaving}
            className="flex-1 w-full cursor-pointer"
          >
            {step < 3 ? "Next" : isSaving ? "Saving..." : "Update Invoice"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onClose={closeDialog}>
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
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Due Date</label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Currency</label>
                <Select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.items.map((item, i) => (
                <div key={i} style={{ borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" />
                  <div className="flex gap-3 items-end">
                    <div className="flex-1"><label style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', display: 'block', marginBottom: 6 }}>Qty</label><Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} /></div>
                    <div className="flex-1"><label style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', display: 'block', marginBottom: 6 }}>Rate ({form.currency})</label><Input type="number" step="0.01" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} /></div>
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
                <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Currency</span><span style={{ fontWeight: 600, color: '#0F172A' }}>{form.currency}</span></div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm" style={{ color: '#475569' }}><span className="truncate mr-3">{item.description} &times;{item.quantity}</span><span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrencyAmount(item.amount, form.currency)}</span></div>
                ))}
                <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid #E2E8F0' }}><div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0F172A' }}>{formatCurrencyAmount(subtotal, form.currency)}</span></div></div>
              </div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax Rate (%)</label><Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, paddingTop: 8, color: '#0F172A' }}>
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyAmount(total, form.currency)}</span>
              </div>
              {form.currency !== BASE_CURRENCY && (
                <p style={{ fontSize: 12, color: '#64748B', textAlign: 'right' }}>
                  Equivalent to {formatCurrencyAmount(convertAmount(total, form.currency, BASE_CURRENCY), BASE_CURRENCY)} {BASE_CURRENCY} at current rate
                </p>
              )}
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 w-full cursor-pointer">Back</Button>}
          <Button onClick={() => { if (step < 3) { setStep(step + 1); return; } createMutation.mutate(form); }} disabled={createMutation.isPending} className="flex-1 w-full cursor-pointer">
            {step < 3 ? "Next" : createMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Invoices product tour */}
      <ProductTour
        tourId="invoices"
        delay={800}
        steps={[
          {
            element: '[data-tour="create-invoice-btn"]',
            popover: {
              title: 'Create Your First Invoice',
              description: 'Use this button to build a professional invoice. Add line items, set a due date, and send it directly to your client.',
              side: 'bottom',
            },
          },
          {
            element: '[data-tour="invoice-stats"]',
            popover: {
              title: 'Invoice Summary',
              description: 'Track overdue, outstanding, and paid invoices at a glance. Click any card to filter the list below.',
              side: 'bottom',
            },
          },
          {
            element: '[data-tour="invoice-grid"]',
            popover: {
              title: 'Your Invoices',
              description: 'Hover over any card to reveal quick actions: edit, send a payment reminder, copy the pay link, or download as PDF.',
              side: 'top',
            },
          },
        ]}
      />
    </div>
  );
}
