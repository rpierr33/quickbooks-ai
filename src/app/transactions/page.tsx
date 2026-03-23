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
      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-28 h-10">
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Button onClick={() => setShowAddDialog(true)} size="icon" className="h-10 w-10 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions yet"
              description="Add your first transaction to get started."
              action={<Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>}
            />
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                        {tx.ai_categorized && <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(tx.date)}
                        {tx.category_name && <span> · {tx.category_name}</span>}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-gray-500 text-sm">{formatDate(tx.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{tx.description}</span>
                            {tx.ai_categorized && <Sparkles className="h-3 w-3 text-indigo-400" />}
                          </div>
                        </TableCell>
                        <TableCell><span className="text-sm text-gray-500">{tx.category_name || "—"}</span></TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
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
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onClose={() => { setShowAddDialog(false); setStep(1); }}>
        <DialogHeader>
          <DialogTitle>{step === 1 ? "New Transaction" : "Details"}</DialogTitle>
          <div className="flex gap-1.5 mt-3">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          </div>
        </DialogHeader>
        <DialogContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                <Input placeholder="e.g., AWS Monthly Bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-12" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Amount</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-12" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Type</label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-12">
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
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-12" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes (optional)</label>
                <Input placeholder="Add any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-12" />
              </div>
              <div className="rounded-xl bg-indigo-50 p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-700 leading-relaxed">AI will automatically categorize this transaction based on the description.</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {step === 2 && <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>}
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1">
            {step === 1 ? "Next" : createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
