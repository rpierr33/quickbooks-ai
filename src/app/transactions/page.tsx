"use client";
import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getExchangeRate, convertAmount } from "@/lib/currency";
import { useToast } from "@/components/ui/toast";
import { exportTransactions } from "@/lib/export";
import type { Transaction } from "@/types";

const BASE_CURRENCY = "USD";
const PAGE_SIZE = 25;

function TransactionsPageInner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlType = searchParams.get("type") ?? "all";
  const urlMonth = searchParams.get("month") ?? "";
  const urlCategory = searchParams.get("category") ?? "";

  const [typeFilter, setTypeFilter] = useState(urlType !== "all" ? urlType : "all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(searchParams.get("action") === "new");
  const [step, setStep] = useState(0);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense" as string,
    notes: "",
    currency: "USD",
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", typeFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search) params.set("search", search);
      return fetch(`/api/transactions?${params}`).then((r) => r.json());
    },
  });

  React.useEffect(() => { setPage(1); }, [typeFilter, search, dateRangeFilter, categoryFilter]);

  const getDateRangeStart = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "3m": return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case "6m": return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      case "ytd": return new Date(now.getFullYear(), 0, 1);
      default: return null;
    }
  };

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const rangeStart = getDateRangeStart(dateRangeFilter);
    let rows = rangeStart ? transactions.filter((t) => new Date(t.date) >= rangeStart) : transactions;
    if (urlMonth) rows = rows.filter((t) => t.date.startsWith(urlMonth));
    if (categoryFilter) rows = rows.filter((t) => (t.category_name ?? "") === categoryFilter);
    return [...rows].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, dateRangeFilter, urlMonth, categoryFilter]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // Running balance (most recent on top, then going down)
  const withBalance = useMemo(() => {
    let running = 0;
    for (const t of filtered) {
      const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      running += t.type === "income" ? amt : -amt;
    }
    let running2 = running;
    return paginated.map((t) => {
      const bal = running2;
      const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      running2 -= t.type === "income" ? amt : -amt;
      return { t, bal };
    });
  }, [paginated, filtered]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => {
    const a = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount; return s + a;
  }, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => {
    const a = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount; return s + a;
  }, 0);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const exchangeRate = getExchangeRate(data.currency, BASE_CURRENCY);
      const baseAmount = data.currency !== BASE_CURRENCY
        ? convertAmount(parseFloat(data.amount) || 0, data.currency, BASE_CURRENCY)
        : parseFloat(data.amount) || 0;
      return fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, exchange_rate: exchangeRate, base_amount: baseAmount }),
      }).then((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeDialog();
      toast("Entry posted");
    },
    onError: () => toast("Couldn't post entry", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeDialog();
      toast("Entry updated");
    },
    onError: () => toast("Couldn't update entry", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/transactions/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeletingId(null);
      toast("Entry deleted");
    },
    onError: () => toast("Couldn't delete entry", "error"),
  });

  function openEdit(tx: Transaction) {
    setForm({
      date: tx.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      description: tx.description,
      amount: String(typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount),
      type: tx.type,
      notes: tx.notes ?? "",
      currency: tx.currency ?? "USD",
    });
    setEditingId(tx.id);
    setStep(0);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingId(null);
    setStep(0);
    setForm({ date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "expense", notes: "", currency: "USD" });
  }

  function submitDialog() {
    if (editingId) {
      if (!form.description || !form.amount) return;
      updateMutation.mutate({ id: editingId, ...form });
      return;
    }
    if (step === 0) {
      if (!form.description || !form.amount) return;
      setStep(1);
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div>
      <div className="dash-head">
        <div>
          <div className="eyebrow-stamp">Ledger</div>
          <h1 className="display-h1" style={{ marginTop: 10 }}>Transactions</h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-3)", maxWidth: "58ch", marginTop: 14, lineHeight: 1.5 }}>
            Every dollar in and out of your accounts, posted in the order it arrived.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {transactions && transactions.length > 0 && (
            <button type="button" className="btn" onClick={() => exportTransactions(transactions)}>Export CSV</button>
          )}
          <button type="button" className="btn stamp" onClick={() => setShowDialog(true)}>+ New transaction</button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="summary-strip">
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Credits · period</div>
          <div className="n" style={{ color: "var(--pencil)" }}>{formatCurrency(totalIncome)}</div>
          <div className="delta">{filtered.filter((t) => t.type === "income").length} entries</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Debits · period</div>
          <div className="n" style={{ color: "var(--stamp)" }}>{formatCurrency(totalExpense)}</div>
          <div className="delta">{filtered.filter((t) => t.type === "expense").length} entries</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Net · period</div>
          <div className="n">{formatCurrency(totalIncome - totalExpense)}</div>
          <div className="delta">{totalCount} total entries</div>
        </div>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Page</div>
          <div className="n">{page} <span style={{ fontSize: 22, color: "var(--ink-3)", fontStyle: "italic" }}>/ {totalPages}</span></div>
          <div className="delta">Showing {paginated.length} of {totalCount}</div>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ padding: "28px 0", borderBottom: "1px solid var(--ink)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "baseline", gap: 10, borderBottom: "1px solid var(--ink)", paddingBottom: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-3)" }}>Search</span>
          <input
            style={{ flex: 1, background: "transparent", border: 0, outline: "none", fontFamily: "var(--serif)", fontSize: 16 }}
            placeholder="description, vendor, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {[
            { key: "all", label: "All" },
            { key: "income", label: "Credit" },
            { key: "expense", label: "Debit" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypeFilter(f.key)}
              className={typeFilter === f.key ? "active" : ""}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="select"
          style={{ width: 160, borderBottom: "1px solid var(--ink)", paddingBottom: 6 }}
          value={dateRangeFilter}
          onChange={(e) => setDateRangeFilter(e.target.value)}
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="ytd">This year</option>
        </select>
      </div>

      {/* Active filter chips */}
      {(categoryFilter || urlMonth || urlType !== "all") && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {categoryFilter && (
            <button type="button" onClick={() => { setCategoryFilter(""); router.replace("/transactions"); }} className="pill" style={{ color: "var(--stamp)", cursor: "pointer" }}>
              Category: {categoryFilter} ✕
            </button>
          )}
          {urlMonth && (
            <button type="button" onClick={() => router.replace("/transactions")} className="pill" style={{ color: "var(--pencil)", cursor: "pointer" }}>
              Month: {urlMonth} ✕
            </button>
          )}
          {urlType !== "all" && (
            <button type="button" onClick={() => { setTypeFilter("all"); router.replace("/transactions"); }} className="pill" style={{ cursor: "pointer" }}>
              Type: {urlType} ✕
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px 110px 120px 90px", padding: "12px 0", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink)", borderTop: "1px solid var(--ink)", borderBottom: "2px solid var(--ink)", fontWeight: 600 }}>
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span style={{ textAlign: "right" }}>Debit</span>
          <span style={{ textAlign: "right" }}>Credit</span>
          <span style={{ textAlign: "right" }}>Balance</span>
          <span style={{ textAlign: "right" }}>&nbsp;</span>
        </div>

        {isLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="animate-shimmer" style={{ height: 14, width: 220, background: "var(--paper-2)", margin: "0 auto" }} />
          </div>
        ) : totalCount === 0 ? (
          <div className="empty">No entries match. Adjust your filters or post a new one.</div>
        ) : (
          withBalance.map(({ t, bal }) => {
            const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
            const isDebit = t.type === "expense";
            return (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px 110px 120px 90px", padding: "12px 0", borderBottom: "1px dotted var(--rule)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em" }}>
                  {formatDate(t.date).slice(0, 6)}
                </span>
                <span style={{ fontFamily: "var(--serif)", fontSize: 14.5 }}>
                  {t.description}
                  {t.ai_categorized && <em style={{ color: "var(--ink-3)", marginLeft: 8, fontSize: 12.5 }}>· ledgr'd</em>}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {t.category_name ?? "—"}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, textAlign: "right", color: isDebit ? "var(--stamp)" : "var(--ink-4)" }}>
                  {isDebit ? amt.toFixed(2) : "—"}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, textAlign: "right", color: !isDebit ? "var(--pencil)" : "var(--ink-4)" }}>
                  {!isDebit ? amt.toFixed(2) : "—"}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, textAlign: "right", color: "var(--ink-2)" }}>
                  {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    aria-label="Edit entry"
                    style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", color: "var(--ink-3)", textTransform: "uppercase" }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(t.id)}
                    aria-label="Delete entry"
                    style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", color: "var(--stamp)", textTransform: "uppercase" }}
                  >
                    Del
                  </button>
                </span>
              </div>
            );
          })
        )}

        {/* Totals row */}
        {totalCount > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 110px 110px 120px 90px", padding: "16px 0", borderTop: "1px solid var(--rule-strong)", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500 }}>
            <span></span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>Totals</span>
            <span></span>
            <span style={{ textAlign: "right", color: "var(--stamp)", fontFamily: "var(--mono)" }}>{totalExpense.toFixed(2)}</span>
            <span style={{ textAlign: "right", color: "var(--pencil)", fontFamily: "var(--mono)" }}>{totalIncome.toFixed(2)}</span>
            <span style={{ textAlign: "right", color: "var(--ink)", fontFamily: "var(--mono)" }}>{(totalIncome - totalExpense).toFixed(2)}</span>
            <span></span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 28 }} className="filter-tabs">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Prev</button>
          <button type="button" className="active" style={{ pointerEvents: "none" }}>{page} / {totalPages}</button>
          <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Entry dialog */}
      <Dialog open={showDialog} onClose={closeDialog}>
        <header>
          <div className="kicker">{editingId ? "Edit transaction" : "New transaction"}</div>
          <div className="dtitle">{editingId ? "Update " : "Add a "}<em>{editingId ? "entry" : "transaction"}</em></div>
          <div className="dsub">Ledgr will suggest a category after you save.</div>
          {!editingId && (
            <div className="steps">
              <div className={"step " + (step === 0 ? "active" : "done")}>Details</div>
              <div className="sep" />
              <div className={"step " + (step === 1 ? "active" : "")}>Notes</div>
            </div>
          )}
        </header>
        <div className="body">
          {(editingId || step === 0) && (
            <>
              <div className="field">
                <label className="field-label">Description</label>
                <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Stripe payout, AWS, Figma…" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label">Amount (USD)</label>
                  <input className="input mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </div>
                <div className="field">
                  <label className="field-label">Post to</label>
                  <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">Debit — expense</option>
                    <option value="income">Credit — income</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {(editingId || step === 1) && (
            <>
              <div className="field">
                <label className="field-label">Date</label>
                <input className="input mono" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">Notes</label>
                <textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Pin a receipt, add context…" />
              </div>
            </>
          )}
        </div>
        <div className="foot">
          <button type="button" className="btn ghost" onClick={() => (step === 0 || editingId) ? closeDialog() : setStep(0)}>
            {(step === 0 || editingId) ? "Cancel" : "← Back"}
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="btn stamp"
            onClick={submitDialog}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? "Save changes" : step === 1 ? "Post transaction" : "Continue →"}
          </button>
        </div>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} width={440}>
        <header>
          <div className="kicker">Confirm delete</div>
          <div className="dtitle">Delete this <em>transaction?</em></div>
          <div className="dsub">This can't be undone.</div>
        </header>
        <div className="body">
          <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", fontSize: 14, lineHeight: 1.5 }}>
            Once deleted, the entry is gone from the ledger. Double-check before you proceed.
          </p>
        </div>
        <div className="foot">
          <button type="button" className="btn ghost" onClick={() => setDeletingId(null)}>Keep it</button>
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="empty">Opening the day book…</div>}>
      <TransactionsPageInner />
    </Suspense>
  );
}
