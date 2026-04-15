"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  ArrowRight,
  Landmark,
  CalendarDays,
  Check,
  X,
  Loader2,
} from "lucide-react";
import type { Account, Transaction } from "@/types";

/* ─── Design Tokens ─── */
const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748B",
};

const bigNumber: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.02em",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748B",
};

/* ─── Component ─── */
export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [reconciled, setReconciled] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ─── Data Fetching ─── */
  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then((r) => r.json()),
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>(
    {
      queryKey: ["transactions"],
      queryFn: () => fetch("/api/transactions").then((r) => r.json()),
    }
  );

  /* ─── Derived State ─── */
  // FIX 6: Only show bank/cash accounts (type === 'asset') in reconciliation dropdown
  const bankAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.type === "asset"),
    [accounts]
  );

  const accountTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!selectedAccountId) return transactions;
    return transactions.filter((t) => t.account_id === selectedAccountId);
  }, [transactions, selectedAccountId]);

  const clearedTransactions = useMemo(
    () => accountTransactions.filter((t) => clearedIds.has(t.id)),
    [accountTransactions, clearedIds]
  );

  const unclearedTransactions = useMemo(
    () => accountTransactions.filter((t) => !clearedIds.has(t.id)),
    [accountTransactions, clearedIds]
  );

  const clearedTotal = useMemo(
    () =>
      clearedTransactions.reduce((sum, t) => {
        const amt =
          typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
        return t.type === "income" ? sum + amt : sum - amt;
      }, 0),
    [clearedTransactions]
  );

  const selectedAccount = useMemo(
    () => accounts?.find((a) => a.id === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const bookBalance = selectedAccount
    ? typeof selectedAccount.balance === "string"
      ? parseFloat(selectedAccount.balance)
      : selectedAccount.balance
    : 0;

  const statementBalanceNum = parseFloat(statementBalance) || 0;
  const difference = statementBalanceNum - (bookBalance + clearedTotal);
  const isDifferenceZero =
    statementBalance !== "" && Math.abs(difference) < 0.005;
  const hasStatementInfo = selectedAccountId && statementBalance !== "";

  /* ─── Handlers ─── */
  const toggleCleared = useCallback((id: string) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCompleteReconciliation = async () => {
    if (clearedIds.size === 0) return;
    setIsCompleting(true);

    // Batch PUT each cleared transaction to persist reconciled status in notes
    const reconcileDate = statementDate;
    const reconcileNote = `Reconciled: ${reconcileDate}`;

    try {
      const results = await Promise.allSettled(
        Array.from(clearedIds).map(async (txId) => {
          const tx = accountTransactions.find((t) => t.id === txId);
          if (!tx) return;
          // Append reconciliation marker to notes without overwriting existing notes
          const existingNotes = tx.notes || "";
          const alreadyMarked = existingNotes.includes("Reconciled:");
          const updatedNotes = alreadyMarked
            ? existingNotes.replace(/Reconciled: [^\n]+/, reconcileNote)
            : existingNotes
            ? `${existingNotes}\n${reconcileNote}`
            : reconcileNote;

          return fetch(`/api/transactions/${txId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: tx.date,
              description: tx.description,
              amount: typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount,
              type: tx.type,
              notes: updatedNotes,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to update transaction ${txId}`);
            return r.json();
          });
        })
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast(`${failed} transaction(s) failed to update`, "error");
      } else {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setReconciled(true);
      }
    } catch {
      toast("Reconciliation failed — please try again", "error");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleReset = () => {
    setClearedIds(new Set());
    setStatementBalance("");
    setReconciled(false);
  };

  /* ─── Transaction Row ─── */
  const TransactionRow = ({
    tx,
    showCheckbox,
    index,
  }: {
    tx: Transaction;
    showCheckbox: boolean;
    index: number;
  }) => {
    const amt = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
    const isIncome = tx.type === "income";
    const isChecked = clearedIds.has(tx.id);

    return (
      <tr
        style={{
          borderBottom: "1px solid #F1F5F9",
          background: index % 2 === 1 ? "#FAFBFC" : "transparent",
          transition: "background 0.15s",
          cursor: showCheckbox ? "pointer" : "default",
        }}
        onClick={showCheckbox ? () => toggleCleared(tx.id) : undefined}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            index % 2 === 1 ? "#FAFBFC" : "transparent";
        }}
      >
        {showCheckbox && (
          <td style={{ padding: "14px 12px 14px 16px", width: 44 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                border: isChecked
                  ? "2px solid #7C3AED"
                  : "2px solid #CBD5E1",
                background: isChecked ? "#7C3AED" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              {isChecked && (
                <Check style={{ width: 12, height: 12, color: "#FFFFFF" }} />
              )}
            </div>
          </td>
        )}
        <td
          style={{
            padding: "14px 16px",
            color: "#64748B",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {formatDate(tx.date)}
        </td>
        <td style={{ padding: "14px 16px" }}>
          <span
            style={{
              fontWeight: 500,
              color: "#0F172A",
              fontSize: 13,
            }}
          >
            {tx.description}
          </span>
        </td>
        <td style={{ padding: "14px 16px", textAlign: "right" }}>
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              fontSize: 13,
              color: isIncome ? "#059669" : "#EF4444",
            }}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(amt)}
          </span>
        </td>
      </tr>
    );
  };

  /* ─── Render ─── */
  const isLoading = accountsLoading || txLoading;

  if (reconciled) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "80px 24px",
          textAlign: "center",
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 style={{ width: 36, height: 36, color: "#059669" }} />
        </div>
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 8,
            }}
          >
            Reconciliation Complete
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", maxWidth: 400 }}>
            {selectedAccount?.name ?? "Account"} has been successfully reconciled
            as of {formatDate(statementDate)}.{" "}
            {clearedTransactions.length} transaction
            {clearedTransactions.length !== 1 ? "s" : ""} cleared.
          </p>
        </div>
        <Button
          onClick={handleReset}
          className="cursor-pointer"
          style={{ marginTop: 8 }}
        >
          Start New Reconciliation
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      className="animate-fade-in"
    >
      {/* ─── Page Header ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Scale style={{ width: 20, height: 20, color: "#FFFFFF" }} />
        </div>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.01em",
            }}
          >
            Bank Reconciliation
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Match your book balance with your bank statement
          </p>
        </div>
      </div>

      {/* ─── Setup Card ─── */}
      <div style={card}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <p style={{ ...sectionLabel, marginBottom: 16 }}>
            Reconciliation Setup
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Account Selector */}
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Landmark
                  style={{ width: 14, height: 14, color: "#94A3B8" }}
                />
                Account
              </label>
              <Select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setClearedIds(new Set());
                  setReconciled(false);
                }}
              >
                <option value="">Select an account...</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Statement Balance */}
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <CircleDot
                  style={{ width: 14, height: 14, color: "#94A3B8" }}
                />
                Statement Ending Balance
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
              />
            </div>

            {/* Statement Date */}
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <CalendarDays
                  style={{ width: 14, height: 14, color: "#94A3B8" }}
                />
                Statement Date
              </label>
              <Input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─── Summary Bar ─── */}
        {hasStatementInfo && (
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 24,
              background: "#F8FAFC",
            }}
          >
            {/* Book Balance */}
            <div style={{ flex: "1 1 140px", minWidth: 140 }}>
              <p style={{ ...sectionLabel, marginBottom: 6 }}>Book Balance</p>
              <p style={{ ...bigNumber, color: "#0F172A" }}>
                {formatCurrency(bookBalance)}
              </p>
            </div>

            <ArrowRight
              className="hidden sm:block"
              style={{ width: 20, height: 20, color: "#CBD5E1", flexShrink: 0 }}
            />

            {/* Cleared Total */}
            <div style={{ flex: "1 1 140px", minWidth: 140 }}>
              <p style={{ ...sectionLabel, marginBottom: 6 }}>
                Cleared Total
              </p>
              <p
                style={{
                  ...bigNumber,
                  color: clearedTotal >= 0 ? "#059669" : "#EF4444",
                }}
              >
                {clearedTotal >= 0 ? "+" : ""}
                {formatCurrency(clearedTotal)}
              </p>
            </div>

            <ArrowRight
              className="hidden sm:block"
              style={{ width: 20, height: 20, color: "#CBD5E1", flexShrink: 0 }}
            />

            {/* Statement Balance */}
            <div style={{ flex: "1 1 140px", minWidth: 140 }}>
              <p style={{ ...sectionLabel, marginBottom: 6 }}>
                Statement Balance
              </p>
              <p style={{ ...bigNumber, color: "#0F172A" }}>
                {formatCurrency(statementBalanceNum)}
              </p>
            </div>

            {/* Difference */}
            <div
              style={{
                flex: "1 1 160px",
                minWidth: 160,
                padding: "14px 20px",
                borderRadius: 12,
                background: isDifferenceZero ? "#ECFDF5" : "#FEF2F2",
                border: isDifferenceZero
                  ? "1px solid #A7F3D0"
                  : "1px solid #FECACA",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  ...sectionLabel,
                  marginBottom: 6,
                  color: isDifferenceZero ? "#059669" : "#EF4444",
                }}
              >
                Difference
              </p>
              <p
                style={{
                  ...bigNumber,
                  fontSize: 28,
                  color: isDifferenceZero ? "#059669" : "#EF4444",
                }}
              >
                {formatCurrency(Math.abs(difference))}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {isDifferenceZero ? (
                  <CheckCircle2
                    style={{ width: 14, height: 14, color: "#059669" }}
                  />
                ) : (
                  <AlertCircle
                    style={{ width: 14, height: 14, color: "#EF4444" }}
                  />
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isDifferenceZero ? "#059669" : "#EF4444",
                  }}
                >
                  {isDifferenceZero
                    ? "Balanced!"
                    : `${difference > 0 ? "Over" : "Under"} by ${formatCurrency(Math.abs(difference))}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Status / Progress ─── */}
      {hasStatementInfo && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: "#64748B" }}>
            <span style={{ fontWeight: 600, color: "#0F172A" }}>
              {clearedTransactions.length}
            </span>{" "}
            of{" "}
            <span style={{ fontWeight: 600, color: "#0F172A" }}>
              {accountTransactions.length}
            </span>{" "}
            transactions cleared
            {clearedTransactions.length > 0 && (
              <span style={{ color: "#94A3B8" }}>
                {" "}
                &middot; Cleared total:{" "}
                <span
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: clearedTotal >= 0 ? "#059669" : "#EF4444",
                  }}
                >
                  {clearedTotal >= 0 ? "+" : ""}
                  {formatCurrency(clearedTotal)}
                </span>
              </span>
            )}
          </p>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!isDifferenceZero || isCompleting}
            className="cursor-pointer"
            style={{ gap: 8 }}
          >
            {isCompleting ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                Complete Reconciliation
              </>
            )}
          </Button>
        </div>
      )}

      {/* ─── Two-Column Transaction Lists ─── */}
      {selectedAccountId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cleared Transactions */}
          <div style={card}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "2px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#059669",
                  }}
                />
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Cleared Transactions
                </h3>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "#059669",
                  padding: "2px 10px",
                  borderRadius: 99,
                }}
              >
                {clearedTransactions.length}
              </span>
            </div>

            {isLoading ? (
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : clearedTransactions.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <X
                  style={{
                    width: 32,
                    height: 32,
                    color: "#CBD5E1",
                    margin: "0 auto 12px",
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#64748B",
                  }}
                >
                  No cleared transactions yet
                </p>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                  Check transactions in the uncleared column to mark them as
                  cleared
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cleared list */}
                <div className="md:hidden">
                  {clearedTransactions.map((tx, i) => {
                    const amt = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
                    const isIncome = tx.type === "income";
                    return (
                      <div
                        key={tx.id}
                        onClick={() => toggleCleared(tx.id)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < clearedTransactions.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer" }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: "2px solid #7C3AED", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check style={{ width: 12, height: 12, color: "#FFFFFF" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{formatDate(tx.date)}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isIncome ? "#059669" : "#EF4444", flexShrink: 0 }}>
                          {isIncome ? "+" : "-"}{formatCurrency(amt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop cleared table */}
                <div className="hidden md:block" style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: 13,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                        <th style={{ ...thStyle, width: 44, padding: "12px 12px 12px 16px" }} />
                        <th style={{ ...thStyle, width: 100 }}>Date</th>
                        <th style={thStyle}>Description</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clearedTransactions.map((tx, i) => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          showCheckbox
                          index={i}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Cleared Footer */}
            {clearedTransactions.length > 0 && (
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #E2E8F0",
                  background: "#F8FAFC",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}
                >
                  Total Cleared
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: clearedTotal >= 0 ? "#059669" : "#EF4444",
                  }}
                >
                  {clearedTotal >= 0 ? "+" : ""}
                  {formatCurrency(clearedTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Uncleared Transactions */}
          <div style={card}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "2px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#F59E0B",
                  }}
                />
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Uncleared Transactions
                </h3>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "#F59E0B",
                  padding: "2px 10px",
                  borderRadius: 99,
                }}
              >
                {unclearedTransactions.length}
              </span>
            </div>

            {isLoading ? (
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : unclearedTransactions.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <CheckCircle2
                  style={{
                    width: 32,
                    height: 32,
                    color: "#059669",
                    margin: "0 auto 12px",
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#059669",
                  }}
                >
                  All transactions cleared!
                </p>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                  Every transaction has been reconciled
                </p>
              </div>
            ) : (
              <>
                {/* Mobile uncleared list */}
                <div className="md:hidden">
                  {unclearedTransactions.map((tx, i) => {
                    const amt = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
                    const isIncome = tx.type === "income";
                    const isChecked = clearedIds.has(tx.id);
                    return (
                      <div
                        key={tx.id}
                        onClick={() => toggleCleared(tx.id)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < unclearedTransactions.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer" }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: isChecked ? "2px solid #7C3AED" : "2px solid #CBD5E1", background: isChecked ? "#7C3AED" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {isChecked && <Check style={{ width: 12, height: 12, color: "#FFFFFF" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{formatDate(tx.date)}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isIncome ? "#059669" : "#EF4444", flexShrink: 0 }}>
                          {isIncome ? "+" : "-"}{formatCurrency(amt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop uncleared table */}
                <div className="hidden md:block" style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: 13,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                        <th style={{ ...thStyle, width: 44, padding: "12px 12px 12px 16px" }} />
                        <th style={{ ...thStyle, width: 100 }}>Date</th>
                        <th style={thStyle}>Description</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unclearedTransactions.map((tx, i) => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          showCheckbox
                          index={i}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!selectedAccountId && !isLoading && (
        <div
          style={{
            ...card,
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <Scale
            style={{
              width: 40,
              height: 40,
              color: "#CBD5E1",
              margin: "0 auto 16px",
            }}
          />
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: 6,
            }}
          >
            Select an account to begin
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", maxWidth: 360, margin: "0 auto" }}>
            Choose a bank account above, then enter your statement ending
            balance to start reconciling transactions.
          </p>
        </div>
      )}

      {/* Confirm Complete Dialog */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogHeader>
          <DialogTitle>Complete Reconciliation</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            You are about to mark <strong>{clearedIds.size}</strong> transaction{clearedIds.size !== 1 ? 's' : ''} as reconciled for the statement ending <strong>{statementDate}</strong>. This action marks each transaction with a reconciliation note.
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>This can be reviewed in the transaction history at any time.</p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { setShowConfirm(false); handleCompleteReconciliation(); }}
            disabled={isCompleting}
            className="flex-1 cursor-pointer"
          >
            {isCompleting ? 'Completing...' : 'Confirm & Complete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
