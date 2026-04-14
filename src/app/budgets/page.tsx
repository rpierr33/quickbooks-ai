"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Budget, Transaction, Category } from "@/types";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#64748B",
};

const bigNumber: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  color: "#0F172A",
};

function getProgressColor(pct: number): string {
  if (pct > 100) return "#EF4444";
  if (pct >= 80) return "#F59E0B";
  return "#059669";
}

function getProgressBg(pct: number): string {
  if (pct > 100) return "#FEE2E2";
  if (pct >= 80) return "#FEF3C7";
  return "#D1FAE5";
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showSetBudgetDialog, setShowSetBudgetDialog] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: "",
    category_name: "",
    monthly_amount: "",
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => fetch("/api/budgets").then((r) => r.json()),
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>(
    {
      queryKey: ["transactions"],
      queryFn: () => fetch("/api/transactions").then((r) => r.json()),
    }
  );

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      category_id: string;
      category_name: string;
      monthly_amount: string;
      period: string;
    }) =>
      fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setShowSetBudgetDialog(false);
      setForm({ category_id: "", category_name: "", monthly_amount: "" });
      toast("Budget saved successfully");
    },
    onError: () => {
      toast("Failed to save budget", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; category_id: string; category_name: string; monthly_amount: string; period: string }) =>
      fetch(`/api/budgets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, monthly_amount: parseFloat(data.monthly_amount) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      closeBudgetDialog();
      toast("Budget updated successfully");
    },
    onError: () => {
      toast("Failed to update budget", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/budgets/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setDeletingBudgetId(null);
      toast("Budget deleted");
    },
    onError: () => {
      toast("Failed to delete budget", "error");
    },
  });

  // Filter budgets for selected period
  const periodBudgets = useMemo(() => {
    if (!budgets) return [];
    return budgets.filter((b) => b.period === selectedPeriod);
  }, [budgets, selectedPeriod]);

  // Calculate actual spending per category for selected month
  const actualByCategory = useMemo(() => {
    if (!transactions) return new Map<string, number>();
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      const txMonth = tx.date.slice(0, 7); // '2026-03'
      if (txMonth !== selectedPeriod) return;
      const catName = tx.category_name || "Uncategorized";
      const amount =
        typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
      map.set(catName, (map.get(catName) || 0) + amount);
    });
    return map;
  }, [transactions, selectedPeriod]);

  // Build rows with variance, sorted by biggest overspend first
  const budgetRows = useMemo(() => {
    return periodBudgets
      .map((b) => {
        const budgetAmt =
          typeof b.monthly_amount === "string"
            ? parseFloat(b.monthly_amount)
            : b.monthly_amount;
        const actual = actualByCategory.get(b.category_name) || 0;
        const variance = budgetAmt - actual;
        const pctUsed = budgetAmt > 0 ? (actual / budgetAmt) * 100 : 0;
        return { ...b, monthly_amount: budgetAmt, actual, variance, pctUsed };
      })
      .sort((a, b) => a.variance - b.variance); // biggest overspend first
  }, [periodBudgets, actualByCategory]);

  // Summary totals
  const totalBudget = budgetRows.reduce((s, r) => s + r.monthly_amount, 0);
  const totalSpent = budgetRows.reduce((s, r) => s + r.actual, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Month navigation
  function shiftMonth(dir: number) {
    const [y, m] = selectedPeriod.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, "0");
    setSelectedPeriod(`${newY}-${newM}`);
  }

  function formatPeriodLabel(period: string) {
    const [y, m] = period.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Expense categories for the "Set Budget" dropdown
  const expenseCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => c.type === "expense");
  }, [categories]);

  const isLoading = budgetsLoading || txLoading;

  const closeBudgetDialog = () => {
    setShowSetBudgetDialog(false);
    setEditingBudgetId(null);
    setForm({ category_id: "", category_name: "", monthly_amount: "" });
  };

  const openEditBudget = (row: { id: string; category_id: string; category_name: string; monthly_amount: number; period?: string }) => {
    setEditingBudgetId(row.id);
    setForm({
      category_id: row.category_id,
      category_name: row.category_name,
      monthly_amount: String(row.monthly_amount),
    });
    setShowSetBudgetDialog(true);
  };

  const handleSubmit = () => {
    if (!form.category_id || !form.monthly_amount) return;
    if (editingBudgetId) {
      updateMutation.mutate({ id: editingBudgetId, ...form, period: selectedPeriod });
    } else {
      createMutation.mutate({ ...form, period: selectedPeriod });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      className="animate-fade-in"
    >
      {/* Header with month selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => shiftMonth(-1)}
            className="cursor-pointer"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#475569",
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0F172A",
              minWidth: 180,
              textAlign: "center",
            }}
          >
            {formatPeriodLabel(selectedPeriod)}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="cursor-pointer"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#475569",
            }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <Button
          onClick={() => setShowSetBudgetDialog(true)}
          className="cursor-pointer shrink-0"
          style={{ padding: "0 16px" }}
        >
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Set Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* Total Budget */}
        <div style={{ ...card, padding: "20px 20px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target style={{ width: 16, height: 16, color: "#7C3AED" }} />
            </div>
            <span style={sectionLabel}>Total Budget</span>
          </div>
          <p style={bigNumber}>{formatCurrency(totalBudget)}</p>
        </div>

        {/* Total Spent */}
        <div style={{ ...card, padding: "20px 20px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet style={{ width: 16, height: 16, color: "#EF4444" }} />
            </div>
            <span style={sectionLabel}>Total Spent</span>
          </div>
          <p style={bigNumber}>{formatCurrency(totalSpent)}</p>
        </div>

        {/* Remaining */}
        <div style={{ ...card, padding: "20px 20px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  totalRemaining >= 0 ? "#D1FAE5" : "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {totalRemaining >= 0 ? (
                <TrendingDown
                  style={{ width: 16, height: 16, color: "#059669" }}
                />
              ) : (
                <TrendingUp
                  style={{ width: 16, height: 16, color: "#EF4444" }}
                />
              )}
            </div>
            <span style={sectionLabel}>Remaining</span>
          </div>
          <p
            style={{
              ...bigNumber,
              color: totalRemaining >= 0 ? "#059669" : "#EF4444",
            }}
          >
            {formatCurrency(Math.abs(totalRemaining))}
            {totalRemaining < 0 && (
              <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
                over
              </span>
            )}
          </p>
        </div>

        {/* % Used with progress bar */}
        <div style={{ ...card, padding: "20px 20px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: getProgressBg(totalPctUsed),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target
                style={{
                  width: 16,
                  height: 16,
                  color: getProgressColor(totalPctUsed),
                }}
              />
            </div>
            <span style={sectionLabel}>% Used</span>
          </div>
          <p
            style={{
              ...bigNumber,
              color: getProgressColor(totalPctUsed),
            }}
          >
            {totalPctUsed.toFixed(1)}%
          </p>
          <div
            style={{
              marginTop: 8,
              height: 6,
              borderRadius: 99,
              background: "#F1F5F9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(totalPctUsed, 100)}%`,
                borderRadius: 99,
                background: getProgressColor(totalPctUsed),
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div>
        <p
          style={{
            ...sectionLabel,
            marginBottom: 12,
            padding: "0 2px",
          }}
        >
          Budget by Category
        </p>

        {isLoading ? (
          <div style={{ ...card, padding: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg animate-shimmer" />
              ))}
            </div>
          </div>
        ) : budgetRows.length === 0 ? (
          <div
            style={{
              ...card,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <Target
              style={{
                width: 40,
                height: 40,
                color: "#CBD5E1",
                margin: "0 auto 12px",
              }}
            />
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#0F172A",
                marginBottom: 4,
              }}
            >
              No budgets for this month
            </p>
            <p
              style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}
            >
              Set a budget to start tracking your spending.
            </p>
            <Button
              size="sm"
              onClick={() => setShowSetBudgetDialog(true)}
              className="cursor-pointer"
            >
              <Plus style={{ width: 16, height: 16, marginRight: 4 }} />{" "}
              Set Budget
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {budgetRows.map((row) => {
              const pctClamped = Math.min(row.pctUsed, 100);
              const progressColor = getProgressColor(row.pctUsed);
              const progressBg = getProgressBg(row.pctUsed);
              const isOver = row.variance < 0;
              return (
                <div key={row.id} className="group" style={{ ...card, padding: "18px 20px" }}>
                  {/* Top: Category name + percentage + actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0F172A",
                      }}
                    >
                      {row.category_name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: progressColor,
                        }}
                      >
                        {row.pctUsed.toFixed(1)}%
                      </span>
                      <button
                        onClick={() => openEditBudget(row)}
                        className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#F1F5F9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Edit budget"
                      >
                        <Pencil style={{ width: 13, height: 13 }} />
                      </button>
                      <button
                        onClick={() => setDeletingBudgetId(row.id)}
                        className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Delete budget"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: progressBg,
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pctClamped}%`,
                        borderRadius: 99,
                        background: progressColor,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>

                  {/* Bottom: Budget / Actual / Variance */}
                  <div
                    className="grid grid-cols-3 gap-2"
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94A3B8",
                          marginBottom: 2,
                        }}
                      >
                        Budget
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: "#0F172A",
                        }}
                      >
                        {formatCurrency(row.monthly_amount)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94A3B8",
                          marginBottom: 2,
                        }}
                      >
                        Actual
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: "#0F172A",
                        }}
                      >
                        {formatCurrency(row.actual)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94A3B8",
                          marginBottom: 2,
                        }}
                      >
                        Variance
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: isOver ? "#EF4444" : "#059669",
                        }}
                      >
                        {isOver ? "-" : "+"}
                        {formatCurrency(Math.abs(row.variance))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingBudgetId} onClose={() => setDeletingBudgetId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Budget</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569" }}>
            Are you sure you want to delete this budget? This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingBudgetId(null)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingBudgetId) deleteMutation.mutate(deletingBudgetId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 w-full cursor-pointer"
            style={{ background: "#EF4444", color: "#FFFFFF" }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Set / Edit Budget Dialog */}
      <Dialog
        open={showSetBudgetDialog}
        onClose={closeBudgetDialog}
      >
        <DialogHeader>
          <DialogTitle>{editingBudgetId ? "Edit Budget" : "Set Budget"}</DialogTitle>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            {editingBudgetId ? "Update monthly budget" : `Set a monthly budget for ${formatPeriodLabel(selectedPeriod)}`}
          </p>
        </DialogHeader>
        <DialogContent>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Category
              </label>
              <Select
                value={form.category_id}
                onChange={(e) => {
                  const cat = expenseCategories.find(
                    (c) => c.id === e.target.value
                  );
                  setForm({
                    ...form,
                    category_id: e.target.value,
                    category_name: cat?.name || "",
                  });
                }}
              >
                <option value="">Select a category</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Monthly Amount
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.monthly_amount}
                onChange={(e) =>
                  setForm({ ...form, monthly_amount: e.target.value })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeBudgetDialog}
            className="flex-1 w-full cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSaving ||
              !form.category_id ||
              !form.monthly_amount
            }
            className="flex-1 w-full cursor-pointer"
          >
            {isSaving ? "Saving..." : editingBudgetId ? "Update Budget" : "Save Budget"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
