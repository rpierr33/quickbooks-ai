"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { formatCurrencyAmount, SUPPORTED_CURRENCIES, getExchangeRate, convertAmount } from "@/lib/currency";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Plus, Receipt, Trash2, CheckCircle2, Clock, AlertCircle, Search, X, Calendar, Building2 } from "lucide-react";
import type { Bill, BillItem } from "@/types";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const statusConfig: Record<string, { bg: string; color: string; border: string; borderLeft: string; label: string; Icon: React.ComponentType<any> }> = {
  draft: { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0", borderLeft: "#94A3B8", label: "Draft", Icon: Clock },
  pending: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", borderLeft: "#F59E0B", label: "Pending", Icon: Clock },
  paid: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", borderLeft: "#059669", label: "Paid", Icon: CheckCircle2 },
  overdue: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", borderLeft: "#EF4444", label: "Overdue", Icon: AlertCircle },
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  net15: "Net 15",
  net30: "Net 30",
  net60: "Net 60",
  net90: "Net 90",
  due_on_receipt: "Due on Receipt",
};

const BASE_CURRENCY = "USD"; // Company base currency — would come from settings in a full impl

type FormState = {
  vendor_name: string;
  vendor_email: string;
  bill_date: string;
  due_date: string;
  tax_rate: string;
  payment_terms: string;
  currency: string;
  notes: string;
  items: BillItem[];
};

const BLANK_FORM: FormState = {
  vendor_name: "",
  vendor_email: "",
  bill_date: new Date().toISOString().split("T")[0],
  due_date: "",
  tax_rate: "0",
  payment_terms: "net30",
  currency: "USD",
  notes: "",
  items: [{ description: "", category: "Office Supplies", quantity: 1, rate: 0, amount: 0 }],
};

function isOverdue(bill: Bill): boolean {
  if (bill.status === "paid") return false;
  if (!bill.due_date) return false;
  return new Date(bill.due_date) < new Date();
}

export default function BillsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: () => fetch("/api/bills").then(r => r.json()),
  });

  // Auto-mark overdue bills in display (purely visual)
  const displayBills = useMemo(() => {
    if (!bills) return [];
    return bills.map(b => ({
      ...b,
      status: isOverdue(b) && b.status !== "paid" ? "overdue" : b.status,
    }));
  }, [bills]);

  const filteredBills = useMemo(() => {
    let result = displayBills;
    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(b =>
        b.vendor_name.toLowerCase().includes(s) ||
        b.bill_number.toLowerCase().includes(s)
      );
    }
    return result;
  }, [displayBills, statusFilter, search]);

  const stats = useMemo(() => {
    if (!displayBills.length) return { outstanding: 0, dueThisWeek: 0, dueThisMonth: 0, overdue: 0 };
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const unpaid = displayBills.filter(b => b.status !== "paid");
    return {
      outstanding: unpaid.reduce((s, b) => s + (parseFloat(String(b.base_amount ?? b.total)) || 0), 0),
      dueThisWeek: unpaid.filter(b => b.due_date && new Date(b.due_date) <= weekEnd).reduce((s, b) => s + (parseFloat(String(b.base_amount ?? b.total)) || 0), 0),
      dueThisMonth: unpaid.filter(b => b.due_date && new Date(b.due_date) <= monthEnd).reduce((s, b) => s + (parseFloat(String(b.base_amount ?? b.total)) || 0), 0),
      overdue: displayBills.filter(b => b.status === "overdue").reduce((s, b) => s + (parseFloat(String(b.base_amount ?? b.total)) || 0), 0),
    };
  }, [displayBills]);

  const createMutation = useMutation({
    mutationFn: (data: FormState) => {
      const exchangeRate = getExchangeRate(data.currency, BASE_CURRENCY);
      return fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tax_rate: parseFloat(data.tax_rate) || 0,
          exchange_rate: exchangeRate,
        }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      closeDialog();
      toast("Bill created successfully");
    },
    onError: () => toast("Failed to create bill", "error"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast("Bill status updated");
    },
    onError: () => toast("Failed to update bill", "error"),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast("Bill marked as paid. Expense transaction created.");
    },
    onError: () => toast("Failed to pay bill", "error"),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_payment_date: date }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setScheduleId(null);
      setScheduleDate("");
      toast("Payment scheduled");
    },
    onError: () => toast("Failed to schedule payment", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/bills/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setDeletingId(null);
      toast("Bill deleted");
    },
    onError: () => toast("Failed to delete bill", "error"),
  });

  function closeDialog() {
    setShowCreate(false);
    setStep(1);
    setForm(BLANK_FORM);
  }

  function updateItem(index: number, field: keyof BillItem, value: string | number) {
    const items = [...form.items];
    (items[index] as unknown as Record<string, string | number>)[field] = value;
    if (field === "quantity" || field === "rate") {
      items[index].amount = (items[index].quantity || 0) * (items[index].rate || 0);
    }
    setForm({ ...form, items });
  }

  const addItem = () => setForm({
    ...form,
    items: [...form.items, { description: "", category: "Office Supplies", quantity: 1, rate: 0, amount: 0 }],
  });

  const removeItem = (i: number) => {
    if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  };

  const subtotal = form.items.reduce((s, it) => s + (it.amount || 0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) / 100);
  const total = subtotal + taxAmount;
  const exchangeRate = getExchangeRate(form.currency, BASE_CURRENCY);
  const baseAmount = form.currency !== BASE_CURRENCY ? convertAmount(total, form.currency, BASE_CURRENCY) : total;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p style={{ fontSize: 14, color: "#64748B" }}>{displayBills.length} total bills</p>
        <Button onClick={() => setShowCreate(true)} className="cursor-pointer shrink-0 whitespace-nowrap">
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Bill
        </Button>
      </div>

      {/* Summary Stats */}
      {displayBills.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
          <div style={{ ...card, borderLeft: "4px solid #64748B", padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B" }}>Outstanding</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A", marginTop: 4 }}>{formatCurrencyAmount(stats.outstanding, BASE_CURRENCY)}</p>
          </div>
          <div style={{ ...card, borderLeft: "4px solid #F59E0B", padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#D97706" }}>Due This Week</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A", marginTop: 4 }}>{formatCurrencyAmount(stats.dueThisWeek, BASE_CURRENCY)}</p>
          </div>
          <div style={{ ...card, borderLeft: "4px solid #6366F1", padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4F46E5" }}>Due This Month</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A", marginTop: 4 }}>{formatCurrencyAmount(stats.dueThisMonth, BASE_CURRENCY)}</p>
          </div>
          <div style={{ ...card, borderLeft: "4px solid #EF4444", padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444" }}>Overdue</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#DC2626", marginTop: 4 }}>{formatCurrencyAmount(stats.overdue, BASE_CURRENCY)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94A3B8", pointerEvents: "none" }} />
          <Input placeholder="Search by vendor or bill #..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      {/* Bills List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={displayBills.length === 0 ? "No bills yet" : "No bills match your filters"}
          description={displayBills.length === 0 ? "Track vendor bills and manage accounts payable." : "Try adjusting your search or filter."}
          action={displayBills.length === 0 ? (
            <Button size="sm" onClick={() => setShowCreate(true)} className="cursor-pointer">
              <Plus style={{ width: 16, height: 16, marginRight: 4 }} /> New Bill
            </Button>
          ) : undefined}
        />
      ) : (
        <div style={card}>
          {/* Desktop table */}
          <div className="hidden md:block" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                  {[
                    { label: "Bill #", w: 100 },
                    { label: "Vendor", w: undefined },
                    { label: "Bill Date", w: 110 },
                    { label: "Due Date", w: 110 },
                    { label: "Terms", w: 90 },
                    { label: "Amount", w: 130 },
                    { label: "Status", w: 100 },
                    { label: "", w: 180 },
                  ].map((col, i) => (
                    <th key={i} style={{ textAlign: i <= 4 ? "left" : i === 5 ? "right" : "center", padding: "12px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B", width: col.w }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, i) => {
                  const sc = statusConfig[bill.status] ?? statusConfig.draft;
                  const isPaid = bill.status === "paid";
                  const isOD = bill.status === "overdue";
                  return (
                    <tr
                      key={bill.id}
                      style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 1 ? "#FAFBFC" : "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? "#FAFBFC" : "transparent")}
                    >
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: 12, color: "#94A3B8" }}>{bill.bill_number}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Building2 style={{ width: 14, height: 14, color: "#7C3AED" }} />
                          </div>
                          <div>
                            <Link href="/clients" onClick={e => e.stopPropagation()} style={{ fontWeight: 500, color: "#2563EB", textDecoration: "none" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}>{bill.vendor_name}</Link>
                            {bill.vendor_email && <p style={{ fontSize: 11, color: "#94A3B8" }}>{bill.vendor_email}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748B" }}>{formatDate(bill.bill_date)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        {bill.due_date ? (
                          <span style={{ color: isOD ? "#DC2626" : isPaid ? "#94A3B8" : "#64748B", fontWeight: isOD ? 600 : 400, textDecoration: isPaid ? "line-through" : "none" }}>
                            {formatDate(bill.due_date)}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748B" }}>{PAYMENT_TERMS_LABELS[bill.payment_terms] ?? bill.payment_terms}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div>
                          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>
                            {formatCurrencyAmount(parseFloat(String(bill.total)) || 0, bill.currency ?? "USD")}
                          </span>
                          {bill.currency && bill.currency !== BASE_CURRENCY && (
                            <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>
                              {formatCurrencyAmount(parseFloat(String(bill.base_amount)) || 0, BASE_CURRENCY)} USD
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          <sc.Icon style={{ width: 11, height: 11 }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                          {!isPaid && (
                            <button
                              onClick={() => payMutation.mutate(bill.id)}
                              disabled={payMutation.isPending}
                              className="cursor-pointer disabled:opacity-60"
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "none" }}
                            >
                              <CheckCircle2 style={{ width: 11, height: 11 }} /> Pay
                            </button>
                          )}
                          {!isPaid && (
                            <button
                              onClick={() => { setScheduleId(bill.id); setScheduleDate(bill.scheduled_payment_date ?? ""); }}
                              className="cursor-pointer"
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "#7C3AED", background: "#EDE9FE", border: "none" }}
                            >
                              <Calendar style={{ width: 11, height: 11 }} />
                              {bill.scheduled_payment_date ? "Rescheduled" : "Schedule"}
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingId(bill.id)}
                            className="cursor-pointer"
                            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {filteredBills.map((bill, i) => {
              const sc = statusConfig[bill.status] ?? statusConfig.draft;
              const isPaid = bill.status === "paid";
              const isOD = bill.status === "overdue";
              return (
                <div
                  key={bill.id}
                  style={{
                    padding: "14px 16px",
                    borderBottom: i < filteredBills.length - 1 ? "1px solid #F1F5F9" : "none",
                    background: i % 2 === 1 ? "#FAFBFC" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Link href="/clients" style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", textDecoration: "none" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}>{bill.vendor_name}</Link>
                        <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{bill.bill_number}</span>
                      </div>
                      <p style={{ fontSize: 11, color: isOD ? "#DC2626" : "#64748B" }}>
                        Due {bill.due_date ? formatDate(bill.due_date) : "—"}
                        {isOD && " · Overdue"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>
                        {formatCurrencyAmount(parseFloat(String(bill.total)) || 0, bill.currency ?? "USD")}
                      </p>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, marginTop: 4 }}>
                        <sc.Icon style={{ width: 10, height: 10 }} />
                        {sc.label}
                      </span>
                    </div>
                  </div>
                  {!isPaid && (
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button
                        onClick={() => payMutation.mutate(bill.id)}
                        disabled={payMutation.isPending}
                        className="cursor-pointer disabled:opacity-60"
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0" }}
                      >
                        <CheckCircle2 style={{ width: 13, height: 13 }} /> Pay Bill
                      </button>
                      <button
                        onClick={() => setDeletingId(bill.id)}
                        className="cursor-pointer"
                        style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Bill Dialog — 3-step */}
      <Dialog open={showCreate} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Vendor Details" : step === 2 ? "Line Items" : "Review & Create"}
          </DialogTitle>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? "#7C3AED" : "#E2E8F0" }} />
            ))}
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Vendor Name</label>
                <Input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} placeholder="Office Depot, Adobe, etc." />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Vendor Email (optional)</label>
                <Input type="email" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} placeholder="billing@vendor.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Bill Date</label>
                  <Input type="date" value={form.bill_date} onChange={e => setForm({ ...form, bill_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Payment Terms</label>
                  <Select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                    <option value="due_on_receipt">Due on Receipt</option>
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                    <option value="net60">Net 60</option>
                    <option value="net90">Net 90</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Due Date</label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Currency</label>
                  <Select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              {form.currency !== BASE_CURRENCY && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p style={{ fontSize: 12, color: "#2563EB" }}>
                    Exchange rate: 1 {form.currency} = {getExchangeRate(form.currency, BASE_CURRENCY).toFixed(4)} {BASE_CURRENCY} (hardcoded MVP rates)
                  </p>
                </div>
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add any notes about this bill..." />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {form.items.map((item, i) => (
                <div key={i} style={{ borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Item description" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", display: "block", marginBottom: 6 }}>Category</label>
                      <Select value={item.category} onChange={e => updateItem(i, "category", e.target.value)}>
                        {["Office Supplies", "Software & SaaS", "Professional Services", "Marketing", "Utilities", "Travel", "Insurance", "Other"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </div>
                    <div />
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", display: "block", marginBottom: 6 }}>Qty</label>
                      <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", display: "block", marginBottom: 6 }}>Rate ({form.currency})</label>
                      <Input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {item.amount > 0 ? (
                      <p style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>
                        {formatCurrencyAmount(item.amount, form.currency)}
                      </p>
                    ) : <span />}
                    <button onClick={() => removeItem(i)} className="cursor-pointer" style={{ color: "#94A3B8", background: "transparent", border: "none", padding: 4 }} aria-label="Remove">
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full cursor-pointer border-dashed">
                <Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Line Item
              </Button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748B" }}>Vendor</span>
                  <span style={{ fontWeight: 600, color: "#0F172A" }}>{form.vendor_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748B" }}>Bill Date</span>
                  <span style={{ color: "#0F172A" }}>{form.bill_date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748B" }}>Terms</span>
                  <span style={{ color: "#0F172A" }}>{PAYMENT_TERMS_LABELS[form.payment_terms]}</span>
                </div>
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10, marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                  {form.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm" style={{ color: "#475569" }}>
                      <span className="truncate mr-3">{item.description} &times;{item.quantity}</span>
                      <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#0F172A" }}>
                        {formatCurrencyAmount(item.amount, form.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Tax Rate (%)</label>
                <Input type="number" step="0.01" min="0" max="100" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748B" }}>Subtotal</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>{formatCurrencyAmount(subtotal, form.currency)}</span>
                </div>
                {parseFloat(form.tax_rate) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#64748B" }}>Tax ({form.tax_rate}%)</span>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>{formatCurrencyAmount(taxAmount, form.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 18, paddingTop: 8, borderTop: "1px solid #E2E8F0", marginTop: 4 }}>
                  <span style={{ color: "#0F172A" }}>Total</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "#0F172A" }}>{formatCurrencyAmount(total, form.currency)}</span>
                </div>
                {form.currency !== BASE_CURRENCY && (
                  <p style={{ fontSize: 12, color: "#64748B", textAlign: "right" }}>
                    Equivalent to {formatCurrencyAmount(baseAmount, BASE_CURRENCY)} {BASE_CURRENCY} at current rate
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 w-full cursor-pointer">Back</Button>
          )}
          <Button
            onClick={() => {
              if (step < 3) { setStep(step + 1); return; }
              if (!form.vendor_name.trim()) { toast("Vendor name is required", "error"); return; }
              if (form.items.every(it => !it.description.trim())) { toast("At least one line item is required", "error"); return; }
              createMutation.mutate(form);
            }}
            disabled={createMutation.isPending}
            className="flex-1 w-full cursor-pointer"
          >
            {step < 3 ? "Next" : createMutation.isPending ? "Creating..." : "Create Bill"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Schedule Payment Dialog */}
      <Dialog open={!!scheduleId} onClose={() => { setScheduleId(null); setScheduleDate(""); }}>
        <DialogHeader>
          <DialogTitle>Schedule Payment</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "#475569" }}>
              Set a reminder date for when this bill should be paid.
            </p>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Payment Date</label>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => { setScheduleId(null); setScheduleDate(""); }} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => {
              if (scheduleId && scheduleDate) {
                scheduleMutation.mutate({ id: scheduleId, date: scheduleDate });
              }
            }}
            disabled={scheduleMutation.isPending || !scheduleDate}
            className="flex-1 w-full cursor-pointer"
          >
            {scheduleMutation.isPending ? "Saving..." : "Schedule"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Bill</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            Are you sure you want to delete this bill? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 w-full cursor-pointer"
            style={{ background: "#EF4444", borderColor: "#EF4444" }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
