"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowLeftRight, Sparkles, Search, ChevronLeft, ChevronRight, Download, Paperclip, X, Image } from "lucide-react";
import { exportTransactions } from "@/lib/export";
import { useToast } from "@/components/ui/toast";
import type { Transaction } from "@/types";

const PAGE_SIZE = 25;

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<'date' | 'description' | 'amount' | 'type'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [receipt, setReceipt] = useState<{ name: string; size: string } | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense" as string,
    notes: "",
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", typeFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search) params.set("search", search);
      return fetch(`/api/transactions?${params}`).then(r => r.json());
    },
  });

  React.useEffect(() => { setPage(1); }, [typeFilter, search]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir(col === 'date' ? 'desc' : 'asc'); }
    setPage(1);
  };

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'description': cmp = a.description.localeCompare(b.description); break;
        case 'amount': {
          const aAmt = typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount;
          const bAmt = typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount;
          cmp = aAmt - bAmt; break;
        }
        case 'type': cmp = a.type.localeCompare(b.type); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, sortCol, sortDir]);

  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedTransactions.slice(start, start + PAGE_SIZE);
  }, [sortedTransactions, page]);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowAddDialog(false);
      setStep(1);
      setForm({ date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "expense", notes: "" });
      toast("Transaction created successfully");
    },
    onError: () => {
      toast("Failed to create transaction", "error");
    },
  });

  const handleSubmit = () => {
    if (step === 1) {
      if (!form.description || !form.amount) return;
      setStep(2);
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div style={{ position: 'relative', flex: 1, maxWidth: 384 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8', pointerEvents: 'none' }} />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-28">
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          {transactions && transactions.length > 0 && (
            <button
              onClick={() => exportTransactions(transactions)}
              className="cursor-pointer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569' }}
            >
              <Download style={{ width: 14, height: 14 }} /> CSV
            </button>
          )}
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer shrink-0 whitespace-nowrap" style={{ padding: '0 16px' }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Transaction
          </Button>
        </div>
      </div>

      {/* AI legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
        <Sparkles style={{ width: 12, height: 12, color: '#7C3AED' }} />
        <span>= AI auto-categorized</span>
      </div>

      {/* Transaction List */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 rounded-lg animate-shimmer" />)}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first transaction to get started."
            action={<Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Add</Button>}
          />
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden">
              {paginatedTransactions.map((tx, i) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '14px 16px',
                    borderBottom: i < paginatedTransactions.length - 1 ? '1px solid #F1F5F9' : 'none',
                    background: i % 2 === 1 ? '#FAFBFC' : 'transparent',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                      {tx.ai_categorized && <Sparkles style={{ width: 12, height: 12, color: '#7C3AED', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {formatDate(tx.date)}
                      {tx.category_name && <span> &middot; {tx.category_name}</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600, flexShrink: 0, color: tx.type === 'income' ? '#059669' : '#EF4444' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    {([
                      { key: 'date' as const, label: 'Date', align: 'left', w: 120 },
                      { key: 'description' as const, label: 'Description', align: 'left', w: undefined },
                      { key: null, label: 'Category', align: 'left', w: 160 },
                      { key: 'amount' as const, label: 'Amount', align: 'right', w: 140 },
                      { key: 'type' as const, label: 'Type', align: 'center', w: 100 },
                    ] as const).map((col, ci) => (
                      <th
                        key={ci}
                        onClick={col.key ? () => toggleSort(col.key!) : undefined}
                        style={{
                          textAlign: col.align as React.CSSProperties['textAlign'], padding: '12px 16px', fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: sortCol === col.key ? '#7C3AED' : '#64748B',
                          width: col.w, cursor: col.key ? 'pointer' : 'default', userSelect: 'none',
                        }}
                      >
                        {col.label}
                        {col.key && sortCol === col.key && (
                          <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className="cursor-pointer"
                      style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 1 ? '#FAFBFC' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? '#FAFBFC' : 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 13 }}>{formatDate(tx.date)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500, color: '#0F172A' }}>{tx.description}</span>
                          {tx.ai_categorized && (
                            <span title="AI auto-categorized">
                              <Sparkles style={{ width: 12, height: 12, color: '#7C3AED', flexShrink: 0 }} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 13 }}>{tx.category_name || "—"}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: tx.type === 'income' ? '#059669' : '#EF4444' }}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, minWidth: 72, textTransform: 'capitalize',
                          background: tx.type === 'income' ? '#ECFDF5' : tx.type === 'expense' ? '#FEF2F2' : '#F1F5F9',
                          color: tx.type === 'income' ? '#059669' : tx.type === 'expense' ? '#DC2626' : '#64748B',
                        }}>
                          {tx.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <p style={{ fontSize: 13, color: '#64748B' }}>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} transactions
              </p>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                  >
                    <ChevronLeft style={{ width: 16, height: 16 }} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 500,
                          background: page === pageNum ? '#7C3AED' : '#FFFFFF',
                          color: page === pageNum ? '#FFFFFF' : '#475569',
                          border: page === pageNum ? 'none' : '1px solid #E2E8F0',
                          transition: 'all 0.15s',
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                  >
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onClose={() => { setShowAddDialog(false); setStep(1); }}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? "New Transaction" : "Additional Details"}</DialogTitle>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ height: 4, flex: 1, borderRadius: 99, background: step >= 1 ? '#7C3AED' : '#E2E8F0' }} />
            <div style={{ height: 4, flex: 1, borderRadius: 99, background: step >= 2 ? '#7C3AED' : '#E2E8F0' }} />
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Description</label>
                <Input placeholder="e.g., AWS Monthly Bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Amount</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Type</label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                <Input placeholder="Add any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {/* Receipt Upload */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Receipt (optional)</label>
                {receipt ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <Image style={{ width: 16, height: 16, color: '#7C3AED', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receipt.name}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{receipt.size}</p>
                    </div>
                    <button onClick={() => setReceipt(null)} className="cursor-pointer" style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: 2 }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="cursor-pointer"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '20px 16px', borderRadius: 8, border: '2px dashed #E2E8F0', background: '#FAFBFC',
                      transition: 'border-color 0.15s',
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#7C3AED'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      const file = e.dataTransfer.files[0];
                      if (file) setReceipt({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
                    }}
                  >
                    <Paperclip style={{ width: 20, height: 20, color: '#94A3B8', marginBottom: 6 }} />
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Drop receipt or <span style={{ color: '#7C3AED' }}>browse</span></p>
                    <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>PNG, JPG, PDF up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReceipt({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
                      }}
                    />
                  </label>
                )}
              </div>
              <div style={{ borderRadius: 8, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10, background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
                <Sparkles style={{ width: 16, height: 16, marginTop: 2, color: '#7C3AED', flexShrink: 0 }} />
                <p style={{ fontSize: 12, lineHeight: 1.5, color: '#5B21B6' }}>AI will automatically categorize this transaction based on the description.</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-3">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 w-full cursor-pointer">Back</Button>
          )}
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 w-full cursor-pointer">
            {step === 1 ? "Next" : createMutation.isPending ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
