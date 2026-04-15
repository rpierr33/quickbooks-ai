"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Repeat, Calendar, DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Play, Pause, Clock, Zap } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_run: string;
  last_run: string | null;
  is_active: boolean;
  created_at: string;
}

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#64748B',
};

const bigNumber: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
};

const FREQUENCY_OPTIONS = ["all", "daily", "weekly", "monthly", "yearly"] as const;

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  monthly: 1,
  yearly: 1 / 12,
};

function toMonthly(amount: number, frequency: string): number {
  return amount * (FREQUENCY_MULTIPLIER[frequency] ?? 1);
}

function frequencyBadgeColor(frequency: string): { bg: string; color: string } {
  switch (frequency) {
    case "daily": return { bg: '#FEF3C7', color: '#D97706' };
    case "weekly": return { bg: '#DBEAFE', color: '#2563EB' };
    case "monthly": return { bg: '#EDE9FE', color: '#7C3AED' };
    case "yearly": return { bg: '#ECFDF5', color: '#059669' };
    default: return { bg: '#F1F5F9', color: '#64748B' };
  }
}

const emptyForm = {
  description: "",
  amount: "",
  type: "expense" as string,
  frequency: "monthly" as string,
  next_run: new Date().toISOString().split("T")[0],
};

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [freqFilter, setFreqFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isRunning, setIsRunning] = useState(false);

  const { data: recurring, isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ["recurring"],
    queryFn: () => fetch("/api/recurring").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      closeDialog();
      toast("Recurring transaction created");
    },
    onError: () => { toast("Failed to create recurring transaction", "error"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      closeDialog();
      toast("Recurring transaction updated");
    },
    onError: () => { toast("Failed to update", "error"); },
  });

  function closeDialog() {
    setShowAddDialog(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openEdit(tx: RecurringTransaction) {
    setForm({
      description: tx.description,
      amount: String(typeof tx.amount === "string" ? parseFloat(tx.amount as unknown as string) : tx.amount),
      type: tx.type,
      frequency: tx.frequency,
      next_run: tx.next_run?.split("T")[0] ?? "",
    });
    setEditingId(tx.id);
    setShowAddDialog(true);
  }

  function handleSubmit() {
    if (!form.description || !form.amount || !form.next_run) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form, amount: parseFloat(form.amount) });
    } else {
      createMutation.mutate(form);
    }
  }

  function toggleActive(tx: RecurringTransaction) {
    updateMutation.mutate({ id: tx.id, is_active: !tx.is_active });
  }

  async function handleRunDue() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/recurring/execute");
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to run due transactions", "error");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      if (data.executed === 0) {
        toast("No due transactions to run");
      } else {
        toast(`${data.executed} transaction${data.executed !== 1 ? "s" : ""} created`);
      }
    } catch {
      toast("Failed to run due transactions", "error");
    } finally {
      setIsRunning(false);
    }
  }

  // Filter and sort
  const filtered = useMemo(() => {
    if (!recurring) return [];
    let list = [...recurring];
    if (freqFilter !== "all") list = list.filter((t) => t.frequency === freqFilter);
    list.sort((a, b) => new Date(a.next_run).getTime() - new Date(b.next_run).getTime());
    return list;
  }, [recurring, freqFilter]);

  // Summary computations
  const summary = useMemo(() => {
    if (!recurring) return { monthlyExpense: 0, monthlyIncome: 0, net: 0, nextDue: null as string | null };
    const active = recurring.filter((t) => t.is_active);
    const monthlyExpense = active
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + toMonthly(typeof t.amount === "string" ? parseFloat(t.amount as unknown as string) : t.amount, t.frequency), 0);
    const monthlyIncome = active
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + toMonthly(typeof t.amount === "string" ? parseFloat(t.amount as unknown as string) : t.amount, t.frequency), 0);
    const sorted = active.filter((t) => t.next_run).sort((a, b) => new Date(a.next_run).getTime() - new Date(b.next_run).getTime());
    return {
      monthlyExpense,
      monthlyIncome,
      net: monthlyIncome - monthlyExpense,
      nextDue: sorted[0]?.next_run ?? null,
    };
  }, [recurring]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Monthly Expenses */}
        <div style={card}>
          <div style={{ padding: '20px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={sectionLabel}>Monthly Expenses</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown style={{ width: 16, height: 16, color: '#EF4444' }} />
              </div>
            </div>
            <p style={{ ...bigNumber, color: '#EF4444' }}>
              {isLoading ? "..." : formatCurrency(summary.monthlyExpense)}
            </p>
          </div>
        </div>

        {/* Monthly Income */}
        <div style={card}>
          <div style={{ padding: '20px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={sectionLabel}>Monthly Income</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#059669' }} />
              </div>
            </div>
            <p style={{ ...bigNumber, color: '#059669' }}>
              {isLoading ? "..." : formatCurrency(summary.monthlyIncome)}
            </p>
          </div>
        </div>

        {/* Net Monthly */}
        <div style={card}>
          <div style={{ padding: '20px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={sectionLabel}>Net Monthly</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign style={{ width: 16, height: 16, color: '#64748B' }} />
              </div>
            </div>
            <p style={{ ...bigNumber, color: summary.net >= 0 ? '#059669' : '#EF4444' }}>
              {isLoading ? "..." : formatCurrency(summary.net)}
            </p>
          </div>
        </div>

        {/* Next Due */}
        <div style={card}>
          <div style={{ padding: '20px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={sectionLabel}>Next Due</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar style={{ width: 16, height: 16, color: '#7C3AED' }} />
              </div>
            </div>
            <p style={{ ...bigNumber, color: '#0F172A', fontSize: 20 }}>
              {isLoading ? "..." : summary.nextDue ? formatDate(summary.nextDue) : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FREQUENCY_OPTIONS.map((freq) => (
            <button
              key={freq}
              onClick={() => setFreqFilter(freq)}
              className="cursor-pointer"
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: freqFilter === freq ? '#7C3AED' : '#E2E8F0',
                background: freqFilter === freq ? '#7C3AED' : '#FFFFFF',
                color: freqFilter === freq ? '#FFFFFF' : '#64748B',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {freq === "all" ? "All" : freq}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="outline"
            onClick={handleRunDue}
            disabled={isRunning}
            className="cursor-pointer shrink-0 whitespace-nowrap"
            style={{ padding: '0 14px' }}
            title="Execute all recurring transactions that are due today or earlier"
          >
            <Zap style={{ width: 15, height: 15, marginRight: 6 }} />
            {isRunning ? "Running..." : "Run Due"}
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer shrink-0 whitespace-nowrap" style={{ padding: '0 16px' }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Recurring
          </Button>
        </div>
      </div>

      {/* Recurring List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <div style={card}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-shimmer" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={card}>
            <EmptyState
              icon={Repeat}
              title="No recurring transactions"
              description={freqFilter !== "all" ? `No ${freqFilter} recurring transactions found.` : "Set up recurring transactions to automate your bookkeeping."}
              action={
                <Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer">
                  <Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Add Recurring
                </Button>
              }
            />
          </div>
        ) : (
          filtered.map((tx) => {
            const amt = typeof tx.amount === "string" ? parseFloat(tx.amount as unknown as string) : tx.amount;
            const badge = frequencyBadgeColor(tx.frequency);
            const isExpense = tx.type === "expense";
            const isIncome = tx.type === "income";

            return (
              <div
                key={tx.id}
                style={{
                  ...card,
                  opacity: tx.is_active ? 1 : 0.6,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isExpense ? '#FEF2F2' : isIncome ? '#ECFDF5' : '#F1F5F9',
                    flexShrink: 0,
                  }}>
                    <Repeat style={{
                      width: 18,
                      height: 18,
                      color: isExpense ? '#EF4444' : isIncome ? '#059669' : '#64748B',
                    }} />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description}
                      </p>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        textTransform: 'capitalize',
                        background: badge.bg,
                        color: badge.color,
                        letterSpacing: '0.04em',
                      }}>
                        {tx.frequency}
                      </span>
                      {!tx.is_active && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: '#F1F5F9',
                          color: '#94A3B8',
                        }}>
                          Paused
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                        <Clock style={{ width: 12, height: 12 }} />
                        Next: {formatDate(tx.next_run)}
                      </span>
                      {tx.last_run && (
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          Last: {formatDate(tx.last_run)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: isExpense ? '#EF4444' : isIncome ? '#059669' : '#0F172A',
                    flexShrink: 0,
                  }}>
                    {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(amt)}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleActive(tx)}
                      className="cursor-pointer"
                      title={tx.is_active ? "Pause" : "Resume"}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        background: tx.is_active ? '#FFFFFF' : '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        color: tx.is_active ? '#059669' : '#94A3B8',
                      }}
                    >
                      {tx.is_active ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
                    </button>
                    <button
                      onClick={() => openEdit(tx)}
                      className="cursor-pointer"
                      title="Edit"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        color: '#64748B',
                      }}
                    >
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Recurring Transaction" : "New Recurring Transaction"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Description</label>
              <Input
                placeholder="e.g., Netflix Subscription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Frequency</label>
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Next Run Date</label>
                <Input
                  type="date"
                  value={form.next_run}
                  onChange={(e) => setForm({ ...form, next_run: e.target.value })}
                />
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1 w-full cursor-pointer">
            {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
