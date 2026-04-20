"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { getExchangeRate } from "@/lib/currency";
import { exportInvoices } from "@/lib/export";
import { downloadInvoicePDF, settingsToWhiteLabel } from "@/lib/invoice-pdf";
import { useToast } from "@/components/ui/toast";
import type { Invoice, InvoiceItem } from "@/types";

const BASE_CURRENCY = "USD";

type FormState = {
  client_name: string;
  client_email: string;
  due_date: string;
  tax_rate: string;
  notes: string;
  currency: string;
  items: InvoiceItem[];
};

const BLANK: FormState = {
  client_name: "",
  client_email: "",
  due_date: "",
  tax_rate: "0",
  notes: "",
  currency: "USD",
  items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => fetch("/api/invoices").then((r) => r.json()),
  });

  const { data: companySettings } = useQuery<Record<string, unknown>>({
    queryKey: ["company-settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => {
      const exchangeRate = getExchangeRate(data.currency, BASE_CURRENCY);
      return fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tax_rate: parseFloat(data.tax_rate), exchange_rate: exchangeRate }),
      }).then((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeDialog();
      toast("Invoice drawn");
    },
    onError: () => toast("Couldn't create invoice", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & FormState) =>
      fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tax_rate: parseFloat(data.tax_rate) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      closeDialog();
      toast("Invoice updated");
    },
    onError: () => toast("Couldn't update invoice", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/invoices/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeletingId(null);
      toast("Invoice struck");
    },
    onError: () => toast("Couldn't delete invoice", "error"),
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const outstanding = (invoices ?? [])
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);
  const overdue = (invoices ?? [])
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);
  const paid30 = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);
  const overdueCount = (invoices ?? []).filter((i) => i.status === "overdue").length;
  const outCount = (invoices ?? []).filter((i) => i.status === "sent").length;

  function closeDialog() {
    setShowDialog(false);
    setEditingId(null);
    setStep(0);
    setForm(BLANK);
  }

  function openCreate() {
    setEditingId(null);
    setForm(BLANK);
    setStep(0);
    setShowDialog(true);
  }

  function openEdit(inv: Invoice) {
    setEditingId(inv.id);
    setForm({
      client_name: inv.client_name,
      client_email: inv.client_email ?? "",
      due_date: inv.due_date ?? "",
      tax_rate: String(inv.tax_rate ?? 0),
      notes: inv.notes ?? "",
      currency: inv.currency ?? "USD",
      items: inv.items.length > 0 ? inv.items : BLANK.items,
    });
    setStep(0);
    setShowDialog(true);
  }

  function submitForm() {
    if (editingId) {
      if (!form.client_name || form.items.length === 0) return;
      updateMutation.mutate({ id: editingId, ...form });
      return;
    }
    if (step < 2) {
      if (step === 0 && !form.client_name) return;
      if (step === 1 && form.items.every((it) => !it.description)) return;
      setStep(step + 1);
      return;
    }
    createMutation.mutate(form);
  }

  const subtotal = form.items.reduce((s, it) => s + (it.quantity || 0) * (it.rate || 0), 0);
  const taxAmt = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + taxAmt;

  async function sendReminder(inv: Invoice) {
    setSendingReminderId(inv.id);
    try {
      await fetch(`/api/invoices/${inv.id}/reminder`, { method: "POST" });
      toast("Reminder sent");
    } catch {
      toast("Couldn't send reminder", "error");
    } finally {
      setSendingReminderId(null);
    }
  }

  async function downloadPdf(inv: Invoice) {
    try {
      await downloadInvoicePDF(inv, undefined, settingsToWhiteLabel(companySettings ?? {}));
    } catch {
      toast("Couldn't generate PDF", "error");
    }
  }

  return (
    <div>
      <div className="dash-head">
        <div>
          <div className="eyebrow-stamp">Receivables</div>
          <h1 className="display-h1" style={{ marginTop: 10 }}>Invoices</h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-3)", maxWidth: "58ch", marginTop: 14, lineHeight: 1.5 }}>
            {invoices && invoices.length > 0
              ? `${invoices.length} invoices on the books.${overdueCount > 0 ? ` ${overdueCount} late — follow up below.` : ""}`
              : "No invoices yet. Draw your first one below."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {invoices && invoices.length > 0 && (
            <button type="button" className="btn" onClick={() => exportInvoices(invoices)}>Export CSV</button>
          )}
          <button type="button" className="btn stamp" onClick={openCreate}>+ New invoice</button>
        </div>
      </div>

      <div className="summary-strip">
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Overdue</div>
          <div className="n" style={{ color: overdue > 0 ? "var(--stamp)" : "var(--ink)" }}>{formatCurrency(overdue)}</div>
          <div className="delta">{overdueCount} invoice{overdueCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Outstanding</div>
          <div className="n">{formatCurrency(outstanding - overdue)}</div>
          <div className="delta">{outCount} invoice{outCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Paid · 30 d.</div>
          <div className="n" style={{ color: paid30 > 0 ? "var(--pencil)" : "var(--ink)" }}>{formatCurrency(paid30)}</div>
          <div className="delta">{(invoices ?? []).filter(i => i.status === "paid").length} paid</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Total · life</div>
          <div className="n">{formatCurrency((invoices ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0))}</div>
          <div className="delta">{invoices?.length ?? 0} drawn</div>
        </div>
      </div>

      <div className="filter-tabs" style={{ margin: "32px 0 0" }}>
        {["all", "draft", "sent", "overdue", "paid"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={filter === s ? "active" : ""}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="empty">Opening the receivables book…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          {filter === "all" ? "No invoices drawn yet. Start with the first." : `No ${filter} invoices right now.`}
        </div>
      ) : (
        <div className="inv-grid" style={{ marginTop: 24 }}>
          {filtered.map((inv) => (
            <div key={inv.id} className={"inv-cell " + inv.status}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div className="inv-id">{inv.invoice_number}</div>
                    <div className="client">{inv.client_name}</div>
                  </div>
                  {inv.status === "overdue" && (
                    <div className="stamp-block">
                      Overdue
                    </div>
                  )}
                  {inv.status === "paid" && (
                    <div className="stamp-block" style={{ borderColor: "var(--pencil)", color: "var(--pencil)" }}>
                      Paid<span className="sub" style={{ color: "var(--pencil)" }}>in full</span>
                    </div>
                  )}
                  {inv.status === "sent" && <span className="pill sent">· Sent</span>}
                  {inv.status === "draft" && <span className="pill draft">· Draft</span>}
                </div>
              </div>
              <div>
                <div className="amount">
                  <span className="c">$</span>
                  {Number(inv.total).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="due">Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {inv.status !== "paid" && (
                    <button type="button" className="btn sm" onClick={() => sendReminder(inv)} disabled={sendingReminderId === inv.id}>
                      {sendingReminderId === inv.id ? "Sending…" : "Send reminder"}
                    </button>
                  )}
                  <button type="button" className="btn ghost sm" onClick={() => downloadPdf(inv)}>PDF</button>
                  <button type="button" className="btn ghost sm" onClick={() => openEdit(inv)}>Edit</button>
                  <button type="button" className="btn ghost sm" onClick={() => setDeletingId(inv.id)} style={{ color: "var(--stamp)" }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={showDialog} onClose={closeDialog} width={720}>
        <header>
          <div className="kicker">{editingId ? "Edit invoice" : "New invoice"}</div>
          <div className="dtitle">{editingId ? "Update " : "Draft an "}<em>invoice</em></div>
          {!editingId && (
            <div className="steps">
              <div className={"step " + (step === 0 ? "active" : step > 0 ? "done" : "")}>Recipient</div>
              <div className="sep" />
              <div className={"step " + (step === 1 ? "active" : step > 1 ? "done" : "")}>Line items</div>
              <div className="sep" />
              <div className={"step " + (step === 2 ? "active" : "")}>Review</div>
            </div>
          )}
        </header>
        <div className="body">
          {(editingId || step === 0) && (
            <>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label">Client</label>
                  <input className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Acme Studio" />
                </div>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input className="input" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="billing@…" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label">Due date</label>
                  <input className="input mono" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Currency</label>
                  <select className="select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>CAD</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {(editingId || step === 1) && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 32px", gap: 12, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)", borderBottom: "1px solid var(--ink)", paddingBottom: 6 }}>
                <span>Description</span>
                <span style={{ textAlign: "right" }}>Qty</span>
                <span style={{ textAlign: "right" }}>Rate</span>
                <span></span>
              </div>
              {form.items.map((it, i) => (
                <div key={i} className="line-row">
                  <input
                    className="input"
                    value={it.description}
                    onChange={(e) => setForm({ ...form, items: form.items.map((x, ix) => ix === i ? { ...x, description: e.target.value } : x) })}
                    placeholder="Service rendered…"
                  />
                  <input
                    className="input mono"
                    style={{ textAlign: "right" }}
                    value={it.quantity}
                    onChange={(e) => setForm({ ...form, items: form.items.map((x, ix) => ix === i ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x) })}
                  />
                  <input
                    className="input mono"
                    style={{ textAlign: "right" }}
                    value={it.rate}
                    onChange={(e) => setForm({ ...form, items: form.items.map((x, ix) => ix === i ? { ...x, rate: parseFloat(e.target.value) || 0 } : x) })}
                  />
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, ix) => ix !== i) })}
                    aria-label="Remove line"
                    style={{ padding: "4px 6px" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn"
                style={{ alignSelf: "flex-start" }}
                onClick={() => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, rate: 0, amount: 0 }] })}
              >
                + Add line
              </button>
              <div className="field" style={{ marginTop: 10, maxWidth: 200 }}>
                <label className="field-label">Tax (%)</label>
                <input
                  className="input mono"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                />
              </div>
            </>
          )}
          {!editingId && step === 2 && (
            <div style={{ background: "var(--paper-2)", padding: 24, border: "1px solid var(--ink)", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div className="field-label">Invoice to</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 24, marginTop: 4 }}>{form.client_name || "—"}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{form.client_email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="field-label">Due</div>
                  <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>{form.due_date || "—"}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)" }}>
                {form.items.map((it, i) => (
                  <div key={i} className="field-row">
                    <span style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}>
                      {it.description || "—"} <em style={{ color: "var(--ink-3)" }}>× {it.quantity}</em>
                    </span>
                    <span className="mono">${((it.quantity || 0) * (it.rate || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="field-row"><span className="k">Subtotal</span><span className="mono">${subtotal.toFixed(2)}</span></div>
              <div className="field-row"><span className="k">Tax ({form.tax_rate || 0}%)</span><span className="mono">${taxAmt.toFixed(2)}</span></div>
              <div className="field-row total"><span className="k">Total due</span><span className="v">${total.toFixed(2)}</span></div>
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" className="btn ghost" onClick={() => (step === 0 || editingId) ? closeDialog() : setStep(step - 1)}>
            {(step === 0 || editingId) ? "Cancel" : "← Back"}
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="btn stamp"
            onClick={submitForm}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? "Save changes" : step === 2 ? "Send invoice" : "Continue →"}
          </button>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} width={440}>
        <header>
          <div className="kicker">Confirm delete</div>
          <div className="dtitle">Delete this <em>invoice?</em></div>
        </header>
        <div className="body">
          <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", lineHeight: 1.5 }}>
            This removes the invoice from your records. Can't be undone.
          </p>
        </div>
        <div className="foot">
          <button type="button" className="btn ghost" onClick={() => setDeletingId(null)}>Keep</button>
          <span className="spacer" />
          <button
            type="button"
            className="btn stamp"
            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            disabled={deleteMutation.isPending}
          >
            Delete →
          </button>
        </div>
      </Dialog>
    </div>
  );
}
