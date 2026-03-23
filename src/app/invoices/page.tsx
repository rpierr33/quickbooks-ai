"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileText, Trash2 } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/types";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  draft: "secondary",
  sent: "default" as "secondary",
  paid: "success",
  overdue: "destructive",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-600",
  paid: "bg-emerald-50 text-emerald-600",
  overdue: "bg-red-50 text-red-600",
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    due_date: "",
    tax_rate: "0",
    notes: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
  });

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => fetch("/api/invoices").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tax_rate: parseFloat(data.tax_rate) }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowCreate(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setStep(1);
    setForm({
      client_name: "", client_email: "", due_date: "", tax_rate: "0", notes: "",
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
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

  return (
    <div className="space-y-3 md:space-y-4 animate-fade-in font-[family-name:var(--font-plus-jakarta)]">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="h-11 px-5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start billing."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)} className="cursor-pointer rounded-md bg-emerald-500 hover:bg-emerald-600 text-white">
              <Plus className="h-4 w-4 mr-1" /> Create
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 md:p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wide">{inv.invoice_number}</p>
                  <p className="font-semibold text-gray-900 text-[13px] mt-0.5">{inv.client_name}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                  {inv.status}
                </span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <p className="text-xl tabular-nums font-extrabold text-gray-900">{formatCurrency(inv.total)}</p>
                {inv.due_date && <p className="text-[11px] text-gray-400">Due {formatDate(inv.due_date)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }}>
        <DialogHeader>
          <DialogTitle className="text-gray-900">{step === 1 ? "Client Info" : step === 2 ? "Line Items" : "Review"}</DialogTitle>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Client Name</label>
                <Input
                  value={form.client_name}
                  onChange={e => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={form.client_email}
                  onChange={e => setForm({ ...form, client_email: e.target.value })}
                  placeholder="billing@acme.com"
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-2.5">
                  <Input
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Qty</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Rate</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)}
                        className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col items-center pt-4">
                      <button onClick={() => removeItem(i)} className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {item.amount > 0 && (
                    <p className="text-right text-[11px] font-extrabold text-gray-900 tabular-nums">{formatCurrency(item.amount)}</p>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full cursor-pointer rounded-md h-10 border-dashed border-gray-300 text-[13px] text-gray-700">
                <Plus className="h-3 w-3 mr-1" /> Add Line
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2.5 border border-gray-200">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Client</span>
                  <span className="font-semibold text-gray-900">{form.client_name}</span>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[13px] text-gray-700">
                    <span className="truncate mr-2">{item.description} x{item.quantity}</span>
                    <span className="shrink-0 tabular-nums font-extrabold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2.5 mt-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="tabular-nums font-extrabold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.tax_rate}
                  onChange={e => setForm({ ...form, tax_rate: e.target.value })}
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-between font-extrabold text-xl pt-2 text-gray-900">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 w-full cursor-pointer rounded-md h-11 border border-gray-300">
              Back
            </Button>
          )}
          <Button
            onClick={() => { if (step < 3) { setStep(step + 1); return; } createMutation.mutate(form); }}
            disabled={createMutation.isPending}
            className="flex-1 w-full cursor-pointer rounded-md h-11 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {step < 3 ? "Next" : createMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
