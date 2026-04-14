"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Landmark,
  Pencil,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Account } from "@/types";

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
  fontSize: 28,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  color: '#0F172A',
  fontFamily: 'Inter, sans-serif',
};

const TYPE_CONFIG: Record<Account['type'], { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  asset: { label: 'Assets', icon: Wallet, color: '#059669', bgColor: '#ECFDF5', borderColor: '#059669' },
  liability: { label: 'Liabilities', icon: CreditCard, color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444' },
  equity: { label: 'Equity', icon: Landmark, color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#7C3AED' },
  revenue: { label: 'Revenue', icon: TrendingUp, color: '#0284C7', bgColor: '#F0F9FF', borderColor: '#0284C7' },
  expense: { label: 'Expenses', icon: TrendingDown, color: '#D97706', bgColor: '#FFFBEB', borderColor: '#D97706' },
};

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "asset" as string,
    sub_type: "",
  });

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; sub_type?: string }) =>
      fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      closeAccountDialog();
      toast("Account created successfully");
    },
    onError: () => { toast("Failed to create account", "error"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; type: string; sub_type: string }) =>
      fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      closeAccountDialog();
      toast("Account updated");
    },
    onError: () => { toast("Failed to update account", "error"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/accounts/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setDeletingId(null);
      toast("Account deleted");
    },
    onError: () => { toast("Failed to delete account", "error"); },
  });

  function openEdit(account: Account) {
    setForm({ name: account.name, type: account.type, sub_type: account.sub_type ?? "" });
    setEditingId(account.id);
    setShowAddDialog(true);
  }

  function closeAccountDialog() {
    setShowAddDialog(false);
    setEditingId(null);
    setForm({ name: "", type: "asset", sub_type: "" });
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), type: form.type, sub_type: form.sub_type.trim() };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const totals = useMemo(() => {
    if (!accounts) return { asset: 0, liability: 0, equity: 0 };
    return {
      asset: accounts.filter(a => a.type === 'asset').reduce((s, a) => s + (typeof a.balance === 'string' ? parseFloat(a.balance as unknown as string) : a.balance), 0),
      liability: accounts.filter(a => a.type === 'liability').reduce((s, a) => s + (typeof a.balance === 'string' ? parseFloat(a.balance as unknown as string) : a.balance), 0),
      equity: accounts.filter(a => a.type === 'equity').reduce((s, a) => s + (typeof a.balance === 'string' ? parseFloat(a.balance as unknown as string) : a.balance), 0),
    };
  }, [accounts]);

  const grouped = useMemo(() => {
    if (!accounts) return {} as Record<string, Account[]>;
    const map: Record<string, Account[]> = {};
    for (const type of ACCOUNT_TYPES) {
      const filtered = accounts.filter(a => a.type === type);
      if (filtered.length > 0) map[type] = filtered;
    }
    return map;
  }, [accounts]);

  const summaryCards = [
    { label: 'Total Assets', value: totals.asset, borderColor: '#059669', icon: Wallet },
    { label: 'Total Liabilities', value: totals.liability, borderColor: '#EF4444', icon: CreditCard },
    { label: 'Total Equity', value: totals.equity, borderColor: '#7C3AED', icon: Landmark },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>Chart of Accounts</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Manage your financial accounts and track balances
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer shrink-0 whitespace-nowrap" style={{ padding: '0 16px' }}>
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                ...card,
                borderLeft: `4px solid ${item.borderColor}`,
                padding: '20px 20px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={sectionLabel}>{item.label}</span>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${item.borderColor}12`,
                }}>
                  <Icon style={{ width: 16, height: 16, color: item.borderColor }} />
                </div>
              </div>
              <span style={bigNumber}>
                {isLoading ? '—' : formatCurrency(item.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grouped Account Lists */}
      {isLoading ? (
        <div style={card}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg animate-shimmer" />)}
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([type, accts]) => {
          const config = TYPE_CONFIG[type as Account['type']];
          const Icon = config.icon;
          const groupTotal = accts.reduce((s, a) => s + (typeof a.balance === 'string' ? parseFloat(a.balance as unknown as string) : a.balance), 0);

          return (
            <div key={type} style={card}>
              {/* Group Header */}
              <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #E2E8F0',
                background: '#F8FAFC',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: config.bgColor,
                  }}>
                    <Icon style={{ width: 18, height: 18, color: config.color }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{config.label}</h2>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{accts.length} account{accts.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: config.color,
                }}>
                  {formatCurrency(groupTotal)}
                </span>
              </div>

              {/* Account Rows */}
              {accts.map((account, i) => (
                <div
                  key={account.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 20px',
                    borderBottom: i < accts.length - 1 ? '1px solid #F1F5F9' : 'none',
                    background: i % 2 === 1 ? '#FAFBFC' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? '#FAFBFC' : 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    {/* Active indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {account.is_active ? (
                        <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
                      ) : (
                        <XCircle style={{ width: 16, height: 16, color: '#94A3B8' }} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: account.is_active ? '#0F172A' : '#94A3B8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {account.name}
                        </span>
                        {account.sub_type && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: config.bgColor,
                            color: config.color,
                            border: `1px solid ${config.color}20`,
                            textTransform: 'capitalize',
                          }}>
                            {account.sub_type}
                          </span>
                        )}
                      </div>
                      {!account.is_active && (
                        <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, display: 'block' }}>Inactive</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: account.is_active ? '#0F172A' : '#94A3B8',
                    }}>
                      {formatCurrency(typeof account.balance === 'string' ? parseFloat(account.balance as unknown as string) : account.balance)}
                    </span>
                    <button onClick={() => openEdit(account)} title="Edit" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'all 0.15s' }}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button onClick={() => setDeletingId(account.id)} title="Delete" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* Empty state when no accounts and not loading */}
      {!isLoading && accounts && accounts.length === 0 && (
        <div style={{
          ...card,
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Building2 style={{ width: 28, height: 28, color: '#7C3AED' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>No accounts yet</h3>
          <p style={{ fontSize: 13, color: '#64748B', maxWidth: 320 }}>
            Create your first account to start building your chart of accounts.
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer" style={{ marginTop: 8, padding: '0 20px' }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Account
          </Button>
        </div>
      )}

      {/* Add / Edit Account Dialog */}
      <Dialog open={showAddDialog} onClose={closeAccountDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Account" : "New Account"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Account Name</label>
              <Input
                placeholder="e.g., Business Checking"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Account Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Sub-Type (optional)</label>
              <Input
                placeholder="e.g., Cash, Bank, Accounts Receivable"
                value={form.sub_type}
                onChange={(e) => setForm({ ...form, sub_type: e.target.value })}
              />
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                Further classify this account within its type
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeAccountDialog} className="flex-1 w-full cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !form.name.trim()}
            className="flex-1 w-full cursor-pointer"
          >
            {isSaving ? "Saving..." : editingId ? "Update Account" : "Create Account"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            Are you sure you want to delete this account? This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 w-full cursor-pointer"
            style={{ background: '#EF4444', borderColor: '#EF4444' }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
