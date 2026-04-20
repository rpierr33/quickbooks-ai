"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, BookOpen, ArrowRight, Ban } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import type { Account } from "@/types";

const card: React.CSSProperties = { background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };

interface JournalLine { accountId: string; accountName: string; debit: number; credit: number; }
interface JournalEntry { id: string; date: string; memo: string; lines: JournalLine[]; status?: string; voided_at?: string; created_at: string; }

export default function JournalPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["journal-entries"],
    queryFn: () => fetch("/api/journal-entries").then(r => r.json()),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<{ accountId: string; debit: string; credit: string }[]>([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then(r => r.json()),
  });

  const totalDebits = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const addLine = () => setLines([...lines, { accountId: '', debit: '', credit: '' }]);
  const removeLine = (i: number) => { if (lines.length > 2) setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[i] as Record<string, string>)[field] = value;
    // If entering debit, clear credit and vice versa
    if (field === 'debit' && value) updated[i].credit = '';
    if (field === 'credit' && value) updated[i].debit = '';
    setLines(updated);
  };

  const [voidingId, setVoidingId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: { date: string; memo: string; lines: JournalLine[] }) =>
      fetch("/api/journal-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["journal-entries"] }); resetForm(); toast("Journal entry created"); },
    onError: () => { toast("Failed to create journal entry", "error"); },
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/journal-entries/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setVoidingId(null);
      toast("Journal entry voided");
    },
    onError: () => { toast("Failed to void journal entry", "error"); },
  });

  const handleCreate = () => {
    if (!memo || !isBalanced) return;
    const journalLines = lines.filter(l => l.accountId && (parseFloat(l.debit) || parseFloat(l.credit))).map(l => ({
      accountId: l.accountId,
      accountName: accounts?.find(a => a.id === l.accountId)?.name || 'Unknown',
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
    }));
    createMutation.mutate({ date, memo, lines: journalLines });
  };

  const resetForm = () => {
    setShowCreate(false);
    setMemo("");
    setDate(new Date().toISOString().split('T')[0]);
    setLines([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>{entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}</p>
        <Button onClick={() => setShowCreate(true)} className="cursor-pointer">
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Journal Entry
        </Button>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <BookOpen style={{ width: 40, height: 40, color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No journal entries yet</p>
          <p style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Journal entries are used for manual double-entry adjustments — depreciation, accruals, corrections, etc.</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="cursor-pointer"><Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Create Entry</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(entry => {
            const isVoided = entry.status === 'voided';
            return (
            <div key={entry.id} style={{ ...card, padding: 20, opacity: isVoided ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', textDecoration: isVoided ? 'line-through' : 'none' }}>{entry.memo}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{formatDate(entry.date)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isVoided ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--stamp-soft)', color: 'var(--stamp-2)', border: '1px solid var(--stamp-soft)' }}>Voided</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--pencil-soft)', color: 'var(--pencil)' }}>Balanced</span>
                      <button
                        onClick={() => setVoidingId(entry.id)}
                        className="cursor-pointer"
                        title="Void this entry"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--stamp-2)', background: 'var(--stamp-soft)', border: '1px solid var(--stamp-soft)' }}
                      >
                        <Ban style={{ width: 12, height: 12 }} /> Void
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 300 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Account</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', width: 100 }}>Debit</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', width: 100 }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((line, li) => (
                      <tr key={li} style={{ borderBottom: '1px solid var(--rule-soft)' }}>
                        <td style={{ padding: '8px', color: 'var(--ink)', fontWeight: 500, paddingLeft: line.credit > 0 ? 24 : 8 }}>
                          <Link href="/accounts" style={{ color: 'var(--stamp)', textDecoration: 'none', fontWeight: 500 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}>
                            {line.accountName}
                          </Link>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: line.debit > 0 ? '#0F172A' : '#CFBF9E', fontWeight: line.debit > 0 ? 600 : 400 }}>{line.debit > 0 ? formatCurrency(line.debit) : '—'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: line.credit > 0 ? '#0F172A' : '#CFBF9E', fontWeight: line.credit > 0 ? 600 : 400 }}>{line.credit > 0 ? formatCurrency(line.credit) : '—'}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '8px', color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase' }}>Total</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{formatCurrency(entry.lines.reduce((s, l) => s + l.debit, 0))}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{formatCurrency(entry.lines.reduce((s, l) => s + l.credit, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Void Confirm Dialog */}
      <Dialog open={!!voidingId} onClose={() => setVoidingId(null)}>
        <DialogHeader>
          <DialogTitle>Void Journal Entry</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            Voiding this entry will mark it as invalid. The entry will remain visible in the audit trail but will be struck through. This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setVoidingId(null)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (voidingId) voidMutation.mutate(voidingId); }}
            disabled={voidMutation.isPending}
            className="flex-1 w-full cursor-pointer"
            style={{ background: 'var(--stamp)', color: '#FFFFFF' }}
          >
            {voidMutation.isPending ? "Voiding..." : "Void Entry"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={resetForm}>
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <p style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>Debits must equal credits for the entry to balance.</p>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Memo</label>
                <Input value={memo} onChange={e => setMemo(e.target.value)} placeholder="e.g., Depreciation - March" />
              </div>
            </div>

            {/* Lines */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Lines</label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map((line, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      <Select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}>
                        <option value="">Select account...</option>
                        {accounts?.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                      </Select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input type="number" step="0.01" placeholder="Debit" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input type="number" step="0.01" placeholder="Credit" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} />
                    </div>
                    {lines.length > 2 && (
                      <button onClick={() => removeLine(i)} className="cursor-pointer" style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addLine} className="cursor-pointer w-full" style={{ marginTop: 8, borderStyle: 'dashed' }}>
                <Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Line
              </Button>
            </div>

            {/* Balance check */}
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: isBalanced ? '#DDE4EC' : totalDebits > 0 || totalCredits > 0 ? '#F5E0D9' : '#F8FAFC',
              border: `1px solid ${isBalanced ? '#DDE4EC' : totalDebits > 0 || totalCredits > 0 ? '#F5E0D9' : '#E2E8F0'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>Debits: <span style={{ color: 'var(--ink)' }}>{formatCurrency(totalDebits)}</span></span>
                <ArrowRight style={{ width: 14, height: 14, color: 'var(--ink-4)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>Credits: <span style={{ color: 'var(--ink)' }}>{formatCurrency(totalCredits)}</span></span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: isBalanced ? '#1C3A5B' : '#B33A1F' }}>
                {isBalanced ? 'Balanced' : totalDebits === 0 && totalCredits === 0 ? 'Enter amounts' : `Off by ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
              </span>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={resetForm} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button onClick={handleCreate} disabled={!isBalanced || !memo} className="flex-1 w-full cursor-pointer">
            Create Entry
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
