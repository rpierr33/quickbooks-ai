"use client";
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeftRight,
  FileText,
  Landmark,
  Search,
  ChevronDown,
  Clock,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AuditAction } from "@/lib/audit";
import type { Transaction, Invoice, Account } from "@/types";

const ITEMS_PER_PAGE = 30;

const card: React.CSSProperties = {
  background: "var(--paper-2)",
  border: "1px solid var(--rule)",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

type ActivityType = "transaction" | "invoice" | "account";

interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  description: string;
  amount?: number;
  meta?: string;
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

function getDateGroupKey(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

const typeConfig: Record<
  ActivityType,
  { icon: typeof ArrowLeftRight; color: string; borderColor: string; bgColor: string; label: string }
> = {
  transaction: {
    icon: ArrowLeftRight,
    color: "#B33A1F",
    borderColor: "#B33A1F",
    bgColor: "#F5E0D9",
    label: "Transactions",
  },
  invoice: {
    icon: FileText,
    color: "#171510",
    borderColor: "#171510",
    bgColor: "#DDE4EC",
    label: "Invoices",
  },
  account: {
    icon: Landmark,
    color: "#1C3A5B",
    borderColor: "#1C3A5B",
    bgColor: "#DDE4EC",
    label: "Accounts",
  },
};

function buildActivities(
  transactions: Transaction[] | undefined,
  invoices: Invoice[] | undefined,
  accounts: Account[] | undefined
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  if (transactions) {
    for (const tx of transactions) {
      const amt = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
      const typeLabel = tx.type === "income" ? "Income" : tx.type === "expense" ? "Expense" : "Transfer";
      entries.push({
        id: `tx-${tx.id}`,
        type: "transaction",
        timestamp: tx.created_at,
        title: `Transaction created`,
        description: `${tx.description}${tx.category_name ? " — " + tx.category_name : ""}`,
        amount: amt,
        meta: typeLabel,
      });
    }
  }

  if (invoices) {
    for (const inv of invoices) {
      const total = typeof inv.total === "string" ? parseFloat(inv.total) : inv.total;
      const statusLabel =
        inv.status === "draft"
          ? "created as draft"
          : inv.status === "sent"
          ? "sent"
          : inv.status === "paid"
          ? "marked paid"
          : "marked overdue";
      entries.push({
        id: `inv-${inv.id}`,
        type: "invoice",
        timestamp: inv.status === "paid" && inv.paid_date ? inv.paid_date : inv.created_at,
        title: `Invoice ${inv.invoice_number} ${statusLabel}`,
        description: `${inv.client_name}`,
        amount: total,
        meta: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      });
    }
  }

  if (accounts) {
    for (const acc of accounts) {
      const bal = typeof acc.balance === "string" ? parseFloat(acc.balance) : acc.balance;
      entries.push({
        id: `acc-${acc.id}`,
        type: "account",
        timestamp: acc.created_at,
        title: `Account created`,
        description: `${acc.name}`,
        amount: bal,
        meta: acc.type.charAt(0).toUpperCase() + acc.type.slice(1),
      });
    }
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries;
}

function groupByDate(entries: ActivityEntry[]): { label: string; entries: ActivityEntry[] }[] {
  const groups: Map<string, ActivityEntry[]> = new Map();
  for (const entry of entries) {
    const key = getDateGroupKey(entry.timestamp);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

type MainTab = "activity" | "system_log";
const AUDIT_ACTIONS: { key: "all" | AuditAction; label: string }[] = [
  { key: "all", label: "All" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "login", label: "Login" },
  { key: "export", label: "Export" },
  { key: "import", label: "Import" },
];

const filterTabs: { key: "all" | ActivityType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "transaction", label: "Transactions" },
  { key: "invoice", label: "Invoices" },
  { key: "account", label: "Accounts" },
];

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  create: { bg: "#DDE4EC", color: "#1C3A5B" },
  update: { bg: "#DDE4EC", color: "#171510" },
  delete: { bg: "#F5E0D9", color: "#922D15" },
  login: { bg: "#F5E0D9", color: "#B33A1F" },
  logout: { bg: "#F1F5F9", color: "#64748B" },
  export: { bg: "#FFF7ED", color: "#C2410C" },
  import: { bg: "#DDE4EC", color: "#065F46" },
};

interface AuditEntry {
  id: string;
  company_id: string | null;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const typeToRoute: Record<ActivityType, string> = {
  transaction: "/transactions",
  invoice: "/invoices",
  account: "/accounts",
};

export default function ActivityPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("activity");
  const [activeTab, setActiveTab] = useState<"all" | ActivityType>("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [auditAction, setAuditAction] = useState<"all" | AuditAction>("all");
  const [auditOffset, setAuditOffset] = useState(0);
  const AUDIT_LIMIT = 50;

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => fetch("/api/transactions").then((r) => r.json()),
  });

  const { data: invoices, isLoading: invLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => fetch("/api/invoices").then((r) => r.json()),
  });

  const { data: accounts, isLoading: accLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then((r) => r.json()),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ entries: AuditEntry[]; total: number }>({
    queryKey: ["audit", auditAction, auditOffset],
    queryFn: () =>
      fetch(`/api/audit?action=${auditAction}&limit=${AUDIT_LIMIT}&offset=${auditOffset}`)
        .then((r) => r.json()),
    enabled: mainTab === "system_log",
  });

  const isLoading = txLoading || invLoading || accLoading;

  const allActivities = useMemo(
    () => buildActivities(transactions, invoices, accounts),
    [transactions, invoices, accounts]
  );

  const filteredActivities = useMemo(() => {
    let items = allActivities;
    if (activeTab !== "all") {
      items = items.filter((e) => e.type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.meta && e.meta.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allActivities, activeTab, search]);

  const visibleActivities = filteredActivities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredActivities.length;
  const groups = groupByDate(visibleActivities);

  // Reset visible count when filter/search changes
  React.useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [activeTab, search]);

  // Reset audit pagination when action filter changes
  React.useEffect(() => {
    setAuditOffset(0);
  }, [auditAction]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount = allActivities.filter(
      (e) => new Date(e.timestamp).toISOString().split("T")[0] === todayStr
    ).length;
    const weekCount = allActivities.filter(
      (e) => new Date(e.timestamp) >= weekAgo
    ).length;

    return { total: allActivities.length, today: todayCount, thisWeek: weekCount };
  }, [allActivities]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
      className="animate-fade-in"
    >
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Clock style={{ width: 20, height: 20, color: "#B33A1F" }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
              Activity Log
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748B" }}>
            Complete audit trail of all transactions, invoices, and accounts.
          </p>
        </div>
        {/* Main Tab Toggle */}
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--paper-3)", borderRadius: 12 }}>
          {([
            { key: "activity", label: "Activity", icon: Clock },
            { key: "system_log", label: "System Log", icon: ShieldCheck },
          ] as { key: MainTab; label: string; icon: typeof Clock }[]).map((t) => {
            const isActive = mainTab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setMainTab(t.key)}
                className="cursor-pointer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#FFFFFF" : "#64748B",
                  background: isActive ? "#B33A1F" : "transparent",
                  border: "none", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <Icon style={{ width: 13, height: 13 }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {mainTab === "activity" && (
      <>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Events", value: stats.total, color: "#B33A1F" },
          { label: "Today", value: stats.today, color: "#1C3A5B" },
          { label: "This Week", value: stats.thisWeek, color: "#171510" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, padding: "16px 20px" }}>
            <p style={{ ...sectionLabel, color: "#94A3B8", marginBottom: 4 }}>{stat.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: stat.color, fontVariantNumeric: "tabular-nums" }}>
              {isLoading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--paper-3)", borderRadius: 8, width: "fit-content" }}>
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="cursor-pointer"
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#FFFFFF" : "#64748B",
                  background: isActive ? "#B33A1F" : "transparent",
                  border: "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
                {!isLoading && tab.key !== "all" && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    {tab.key === "transaction"
                      ? transactions?.length ?? 0
                      : tab.key === "invoice"
                      ? invoices?.length ?? 0
                      : accounts?.length ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: "#94A3B8", pointerEvents: 'none' }}
          />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  className="animate-shimmer"
                  style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="animate-shimmer" style={{ height: 14, borderRadius: 6, width: "60%" }} />
                  <div className="animate-shimmer" style={{ height: 12, borderRadius: 6, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Filter style={{ width: 32, height: 32, color: "#CFBF9E", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              No activity found
            </p>
            <p style={{ fontSize: 13, color: "#94A3B8" }}>
              {search
                ? "Try a different search term."
                : "Activity will appear here as you create transactions, invoices, and accounts."}
            </p>
          </div>
        ) : (
          <div>
            {groups.map((group, gi) => (
              <div key={group.label}>
                {/* Date Group Header */}
                <div
                  style={{
                    padding: "12px 20px",
                    background: "var(--paper)",
                    borderTop: gi > 0 ? "1px solid #E2E8F0" : "none",
                    borderBottom: "1px solid #F1F5F9",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <p style={{ ...sectionLabel, color: "#64748B", margin: 0 }}>{group.label}</p>
                </div>

                {/* Entries */}
                {group.entries.map((entry, i) => {
                  const config = typeConfig[entry.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => router.push(typeToRoute[entry.type])}
                      className="cursor-pointer"
                      style={{
                        display: "flex",
                        gap: 14,
                        padding: "16px 20px",
                        borderLeft: `3px solid ${config.borderColor}`,
                        borderBottom:
                          i < group.entries.length - 1 ? "1px solid #F1F5F9" : "none",
                        background: "transparent",
                        transition: "background 0.15s",
                        alignItems: "flex-start",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#EFE7D5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: config.bgColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: 16, height: 16, color: config.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0F172A",
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {entry.title}
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#64748B",
                                margin: "2px 0 0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {entry.description}
                              {entry.amount !== undefined && (
                                <span style={{ fontWeight: 600, color: "#0F172A" }}>
                                  {" "}
                                  ({formatCurrency(entry.amount)})
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Right side: timestamp + badge */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 6,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#94A3B8",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatTimestamp(entry.timestamp)}
                            </span>
                            {entry.meta && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: config.bgColor,
                                  color: config.color,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {entry.meta}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #E2E8F0",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="cursor-pointer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 24px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#B33A1F",
                    background: "#F5E0D9",
                    border: "1px solid #F5E0D9",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F5E0D9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F5E0D9";
                  }}
                >
                  <ChevronDown style={{ width: 14, height: 14 }} />
                  Load more ({filteredActivities.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #E2E8F0",
                background: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: 12, color: "#94A3B8" }}>
                Showing {visibleActivities.length} of {filteredActivities.length} events
              </p>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>
                {allActivities.length} total audit entries
              </p>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* System Log Tab */}
      {mainTab === "system_log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action filter */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--paper-3)", borderRadius: 8, width: "fit-content", flexWrap: "wrap" }}>
            {AUDIT_ACTIONS.map((a) => {
              const isActive = auditAction === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() => setAuditAction(a.key as "all" | AuditAction)}
                  className="cursor-pointer"
                  style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#FFFFFF" : "#64748B",
                    background: isActive ? "#B33A1F" : "transparent",
                    border: "none", transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>

          {/* Log table */}
          <div style={card}>
            {auditLoading ? (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-shimmer" style={{ height: 40, borderRadius: 8 }} />
                ))}
              </div>
            ) : !auditData?.entries?.length ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <ShieldCheck style={{ width: 32, height: 32, color: "#CFBF9E", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                  No audit entries yet
                </p>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  System events will appear here as you create and modify data.
                </p>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "160px 100px 100px 1fr 120px",
                  padding: "10px 20px", background: "var(--paper)",
                  borderBottom: "1px solid #E2E8F0",
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#94A3B8", gap: 12,
                }}>
                  <span>Timestamp</span>
                  <span>Action</span>
                  <span>Entity</span>
                  <span>User</span>
                  <span>Entity ID</span>
                </div>
                {auditData.entries.map((entry, i) => {
                  const colors = ACTION_COLORS[entry.action] ?? { bg: "#F1F5F9", color: "#64748B" };
                  const isLast = i === auditData.entries.length - 1;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: "grid", gridTemplateColumns: "160px 100px 100px 1fr 120px",
                        padding: "12px 20px", gap: 12, alignItems: "center",
                        borderBottom: isLast ? "none" : "1px solid #F1F5F9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#EFE7D5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                        {new Date(entry.created_at).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 99,
                        background: colors.bg, color: colors.color, whiteSpace: "nowrap",
                      }}>
                        {entry.action}
                      </span>
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
                        {entry.entity_type}
                      </span>
                      <span style={{ fontSize: 12, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.user_email ?? "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.entity_id ? entry.entity_id.slice(0, 8) + "..." : "—"}
                      </span>
                    </div>
                  );
                })}

                {/* Pagination footer */}
                <div style={{
                  padding: "12px 20px", borderTop: "1px solid #E2E8F0",
                  background: "var(--paper)", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>
                    Showing {auditOffset + 1}–{Math.min(auditOffset + AUDIT_LIMIT, auditData.total ?? 0)} of {auditData.total ?? 0} entries
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setAuditOffset((o) => Math.max(0, o - AUDIT_LIMIT))}
                      disabled={auditOffset === 0}
                      className="cursor-pointer"
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: "1px solid var(--rule)", background: "#fff", color: auditOffset === 0 ? "#CFBF9E" : "#475569",
                        cursor: auditOffset === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setAuditOffset((o) => o + AUDIT_LIMIT)}
                      disabled={auditOffset + AUDIT_LIMIT >= (auditData.total ?? 0)}
                      className="cursor-pointer"
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: "1px solid var(--rule)", background: "#fff",
                        color: auditOffset + AUDIT_LIMIT >= (auditData.total ?? 0) ? "#CFBF9E" : "#475569",
                        cursor: auditOffset + AUDIT_LIMIT >= (auditData.total ?? 0) ? "not-allowed" : "pointer",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
