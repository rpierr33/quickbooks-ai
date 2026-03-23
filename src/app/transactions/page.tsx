"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowLeftRight, Sparkles, Search } from "lucide-react";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [step, setStep] = useState(1);
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
    <div className="space-y-3 md:space-y-4 animate-fade-in">
      {/* Filter Bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-24 h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <button
          onClick={() => setShowAddDialog(true)}
          className="h-11 w-11 shrink-0 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Transaction List */}
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first transaction to get started."
            action={
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="cursor-pointer rounded-md bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-200">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{tx.description}</p>
                      {tx.ai_categorized && <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(tx.date)}
                      {tx.category_name && <span> · {tx.category_name}</span>}
                    </p>
                  </div>
                  <span className={`text-sm tabular-nums font-extrabold shrink-0 ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="text-[13px] text-gray-700">{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-[13px]">{tx.description}</span>
                          {tx.ai_categorized && <Sparkles className="h-3 w-3 text-emerald-500" />}
                        </div>
                      </TableCell>
                      <TableCell><span className="text-[13px] text-gray-700">{tx.category_name || "—"}</span></TableCell>
                      <TableCell className="text-right">
                        <span className={`tabular-nums font-extrabold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'income' ? 'success' : tx.type === 'expense' ? 'destructive' : 'secondary'}>{tx.type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onClose={() => { setShowAddDialog(false); setStep(1); }}>
        <DialogHeader>
          <DialogTitle className="text-gray-900">{step === 1 ? "New Transaction" : "Details"}</DialogTitle>
          <div className="flex gap-1.5 mt-3">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <Input
                  placeholder="e.g., AWS Monthly Bill"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                <Input
                  placeholder="Add any notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-11 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="rounded-md bg-emerald-50 p-3.5 flex items-start gap-2.5 border border-emerald-200">
                <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-emerald-700 leading-relaxed">AI will automatically categorize this transaction based on the description.</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter className="flex gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 w-full cursor-pointer rounded-md h-11 border border-gray-300">
              Back
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex-1 w-full cursor-pointer rounded-md h-11 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {step === 1 ? "Next" : createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
