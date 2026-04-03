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
} from "lucide-react";
import type { Transaction, Invoice, Account } from "@/types";

const ITEMS_PER_PAGE = 30;

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
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
    color: "#7C3AED",
    borderColor: "#7C3AED",
    bgColor: "#F5F3FF",
    label: "Transactions",
  },
  invoice: {
    icon: FileText,
    color: "#2563EB",
    borderColor: "#2563EB",
    bgColor: "#EFF6FF",
    label: "Invoices",
  },
  account: {
    icon: Landmark,
    color: "#059669",
    borderColor: "#059669",
    bgColor: "#ECFDF5",
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

const filterTabs: { key: "all" | ActivityType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "transaction", label: "Transactions" },
  { key: "invoice", label: "Invoices" },
  { key: "account", label: "Accounts" },
];

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<"all" | ActivityType>("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Clock style={{ width: 20, height: 20, color: "#7C3AED" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Activity Log
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "#64748B" }}>
          Complete audit trail of all transactions, invoices, and accounts.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Events", value: stats.total, color: "#7C3AED" },
          { label: "Today", value: stats.today, color: "#059669" },
          { label: "This Week", value: stats.thisWeek, color: "#2563EB" },
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
        <div style={{ display: "flex", gap: 4, padding: 4, background: "#F1F5F9", borderRadius: 12, width: "fit-content" }}>
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
                  background: isActive ? "#7C3AED" : "transparent",
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
            <Filter style={{ width: 32, height: 32, color: "#CBD5E1", margin: "0 auto 12px" }} />
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
                    background: "#F8FAFC",
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
                        e.currentTarget.style.background = "#FAFBFC";
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
                    color: "#7C3AED",
                    background: "#F5F3FF",
                    border: "1px solid #EDE9FE",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#EDE9FE";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F5F3FF";
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
                background: "#F8FAFC",
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
    </div>
  );
}
