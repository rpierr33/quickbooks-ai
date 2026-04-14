"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ShoppingCart, Pencil, Trash2, ArrowRight, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Draft",     bg: "#F1F5F9", color: "#475569" },
  sent:      { label: "Sent",      bg: "#EFF6FF", color: "#1D4ED8" },
  received:  { label: "Received",  bg: "#ECFDF5", color: "#065F46" },
  partial:   { label: "Partial",   bg: "#FFF7ED", color: "#9A3412" },
  closed:    { label: "Closed",    bg: "#F0FDF4", color: "#166534" },
};

const STATUS_FLOW: Record<string, string> = {
  draft: "sent",
  sent: "received",
  received: "closed",
  partial: "closed",
};

interface POItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  vendor_email?: string | null;
  items: POItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  shipping_address?: string | null;
  expected_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const emptyItem = () => ({ description: "", quantity: "1", unit_price: "", amount: 0 });

function calcItemAmount(qty: string, price: string) {
  const q = parseFloat(qty || "0");
  const p = parseFloat(price || "0");
  return isNaN(q) || isNaN(p) ? 0 : parseFloat((q * p).toFixed(2));
}

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    vendor_name: "",
    vendor_email: "",
    tax_rate: "0",
    shipping_address: "",
    expected_date: "",
    notes: "",
    items: [emptyItem()],
  });

  const { data: orders, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase_orders", statusFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter !== "all") p.set("status", statusFilter);
      return fetch(`/api/purchase-orders?${p}`).then(r => r.json());
    },
  });

  const stats = useMemo(() => {
    if (!orders) return { total: 0, draft: 0, open: 0, totalValue: 0 };
    return {
      total: orders.length,
      draft: orders.filter(o => o.status === "draft").length,
      open: orders.filter(o => ["sent", "received", "partial"].includes(o.status)).length,
      totalValue: orders.reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  // Live totals for form
  const formSubtotal = form.items.reduce((s, item) => s + calcItemAmount(item.quantity, item.unit_price), 0);
  const formTaxAmt = parseFloat((formSubtotal * (parseFloat(form.tax_rate || "0") / 100)).toFixed(2));
  const formTotal = parseFloat((formSubtotal + formTaxAmt).toFixed(2));

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tax_rate: parseFloat(data.tax_rate || "0"),
          items: data.items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity || "0"),
            unit_price: parseFloat(item.unit_price || "0"),
            amount: calcItemAmount(item.quantity, item.unit_price),
          })),
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      closeDialog();
      toast("Purchase order created");
    },
    onError: () => toast("Failed to create purchase order", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tax_rate: parseFloat(data.tax_rate || "0"),
          items: data.items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity || "0"),
            unit_price: parseFloat(item.unit_price || "0"),
            amount: calcItemAmount(item.quantity, item.unit_price),
          })),
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      closeDialog();
      toast("Purchase order updated");
    },
    onError: () => toast("Failed to update purchase order", "error"),
  });

  const advanceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast("Status updated");
    },
    onError: () => toast("Failed to update status", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/purchase-orders/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast(data.error, "error"); setDeletingId(null); return; }
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      setDeletingId(null);
      toast("Purchase order deleted");
    },
    onError: () => toast("Failed to delete", "error"),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/purchase-orders/${id}/convert-to-bill`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setConvertingId(null);
      toast("Converted to bill — check Transactions");
    },
    onError: () => toast("Failed to convert", "error"),
  });

  function openEdit(po: PurchaseOrder) {
    setForm({
      vendor_name: po.vendor_name,
      vendor_email: po.vendor_email ?? "",
      tax_rate: String(po.tax_rate ?? 0),
      shipping_address: po.shipping_address ?? "",
      expected_date: po.expected_date ?? "",
      notes: po.notes ?? "",
      items: po.items.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        amount: item.amount,
      })),
    });
    setEditingId(po.id);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingId(null);
    setForm({ vendor_name: "", vendor_email: "", tax_rate: "0", shipping_address: "", expected_date: "", notes: "", items: [emptyItem()] });
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  }

  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  function updateItem(i: number, key: string, val: string) {
    setForm(f => ({
      ...f,
      items: f.items.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [key]: val };
        updated.amount = calcItemAmount(updated.quantity, updated.unit_price);
        return updated;
      }),
    }));
  }

  const handleSubmit = () => {
    if (!form.vendor_name || form.items.every(i => !i.description)) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const statCards = [
    { label: "Total POs", value: String(stats.total), sub: "All time" },
    { label: "Drafts", value: String(stats.draft), sub: "Pending send" },
    { label: "Open Orders", value: String(stats.open), sub: "Sent / Received" },
    { label: "Total Value", value: formatCurrency(stats.totalValue), sub: "All purchase orders" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Purchase Orders</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Create and track purchase orders from vendors.</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="cursor-pointer shrink-0" style={{ padding: "0 18px" }}>
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Purchase Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} style={{ ...card, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "sent", "received", "partial", "closed"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="cursor-pointer"
            style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 500, border: "1px solid",
              borderColor: statusFilter === s ? "#7C3AED" : "#E2E8F0",
              background: statusFilter === s ? "#7C3AED" : "#FFFFFF",
              color: statusFilter === s ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s",
            }}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-shimmer" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchase orders yet"
            description="Create your first purchase order to start tracking vendor purchases."
            action={<Button size="sm" onClick={() => setShowDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> New PO</Button>}
          />
        ) : (
          orders.map((po, i) => {
            const isExpanded = expandedId === po.id;
            const status = STATUS_CONFIG[po.status] ?? { label: po.status, bg: "#F1F5F9", color: "#475569" };
            const nextStatus = STATUS_FLOW[po.status];
            return (
              <div key={po.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                {/* PO Row */}
                <div
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : po.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", whiteSpace: "nowrap" }}>{po.po_number}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{po.vendor_name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>Created {formatDate(po.created_at)}</span>
                      {po.expected_date && <span style={{ fontSize: 12, color: "#94A3B8" }}>Expected {formatDate(po.expected_date)}</span>}
                      <span style={{ fontSize: 12, color: "#64748B" }}>{po.items.length} item{po.items.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{formatCurrency(po.total)}</span>
                    {isExpanded ? <ChevronUp style={{ width: 16, height: 16, color: "#94A3B8" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "#94A3B8" }} />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F1F5F9" }}>
                    {/* Items table */}
                    <div style={{ marginTop: 12, borderRadius: 8, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10 }}>Description</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10 }}>Qty</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10 }}>Unit Price</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10 }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((item, ii) => (
                            <tr key={ii} style={{ borderBottom: ii < po.items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                              <td style={{ padding: "10px 12px", color: "#0F172A" }}>{item.description}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>{item.quantity}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>{formatCurrency(item.unit_price)}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#0F172A" }}>{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: "2px solid #E2E8F0", background: "#F8FAFC" }}>
                            <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", color: "#64748B", fontSize: 11 }}>Subtotal</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#0F172A" }}>{formatCurrency(po.subtotal)}</td>
                          </tr>
                          {po.tax_rate > 0 && (
                            <tr style={{ background: "#F8FAFC" }}>
                              <td colSpan={3} style={{ padding: "4px 12px", textAlign: "right", color: "#64748B", fontSize: 11 }}>Tax ({po.tax_rate}%)</td>
                              <td style={{ padding: "4px 12px", textAlign: "right", color: "#64748B" }}>{formatCurrency(po.tax_amount)}</td>
                            </tr>
                          )}
                          <tr style={{ background: "#F8FAFC" }}>
                            <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>Total</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{formatCurrency(po.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Actions row */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {nextStatus && (
                        <button
                          onClick={() => advanceStatusMutation.mutate({ id: po.id, status: nextStatus })}
                          disabled={advanceStatusMutation.isPending}
                          className="cursor-pointer"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#EDE9FE", color: "#5B21B6", border: "none", transition: "all 0.15s" }}
                        >
                          <ArrowRight style={{ width: 13, height: 13 }} />
                          Mark as {STATUS_CONFIG[nextStatus]?.label ?? nextStatus}
                        </button>
                      )}
                      {["received", "partial", "sent"].includes(po.status) && (
                        <button
                          onClick={() => setConvertingId(po.id)}
                          className="cursor-pointer"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}
                        >
                          <FileText style={{ width: 13, height: 13 }} /> Convert to Bill
                        </button>
                      )}
                      {po.status === "draft" && (
                        <button
                          onClick={() => openEdit(po)}
                          className="cursor-pointer"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "#FFFFFF", color: "#475569", border: "1px solid #E2E8F0" }}
                        >
                          <Pencil style={{ width: 13, height: 13 }} /> Edit
                        </button>
                      )}
                      {po.status === "draft" && (
                        <button
                          onClick={() => setDeletingId(po.id)}
                          className="cursor-pointer"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} /> Delete
                        </button>
                      )}
                    </div>

                    {po.notes && (
                      <p style={{ fontSize: 12, color: "#64748B", marginTop: 10, fontStyle: "italic" }}>Note: {po.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New / Edit Dialog */}
      <Dialog open={showDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Vendor Name</label>
                <Input placeholder="e.g., Dell Technologies" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Vendor Email (optional)</label>
                <Input type="email" placeholder="orders@vendor.com" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 8 }}>Line Items</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.items.map((item, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 90px 32px", gap: 6, alignItems: "center" }}>
                    <Input placeholder="Description" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} style={{ fontSize: 12 }} />
                    <Input type="number" min="0" step="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} style={{ fontSize: 12 }} />
                    <Input type="number" min="0" step="0.01" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)} style={{ fontSize: 12 }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", textAlign: "right", padding: "8px 4px" }}>
                      {formatCurrency(item.amount)}
                    </div>
                    {form.items.length > 1 ? (
                      <button onClick={() => removeItem(idx)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                        ×
                      </button>
                    ) : <div />}
                  </div>
                ))}
                <button onClick={addItem} className="cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#7C3AED", background: "#F5F3FF", border: "1px solid #DDD6FE", fontWeight: 500 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add Line Item
                </button>
              </div>
            </div>

            {/* Totals preview */}
            <div style={{ borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                <span>Subtotal</span><span>{formatCurrency(formSubtotal)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#64748B", flex: 1 }}>Tax Rate (%)</span>
                <Input type="number" min="0" max="100" step="0.1" placeholder="0" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} style={{ width: 80, fontSize: 12, textAlign: "right" }} />
                <span style={{ fontSize: 12, color: "#64748B", width: 80, textAlign: "right" }}>{formatCurrency(formTaxAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#0F172A", borderTop: "1px solid #E2E8F0", paddingTop: 6, marginTop: 4 }}>
                <span>Total</span><span>{formatCurrency(formTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Expected Delivery</label>
                <Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Shipping Address</label>
                <Input placeholder="Street, City, State ZIP" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Notes (optional)</label>
              <Input placeholder="Any special instructions..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.vendor_name} className="flex-1 cursor-pointer">
            {isSaving ? "Saving..." : editingId ? "Update PO" : "Create PO"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Convert to Bill confirm */}
      <Dialog open={!!convertingId} onClose={() => setConvertingId(null)}>
        <DialogHeader><DialogTitle>Convert to Bill</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            This will create an expense transaction from this purchase order and mark it as closed. Continue?
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setConvertingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (convertingId) convertMutation.mutate(convertingId); }}
            disabled={convertMutation.isPending}
            className="flex-1 cursor-pointer"
          >
            {convertMutation.isPending ? "Converting..." : "Convert to Bill"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader><DialogTitle>Delete Purchase Order</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>Are you sure? Only draft purchase orders can be deleted. This cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer"
            style={{ background: "#EF4444", borderColor: "#EF4444" }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
