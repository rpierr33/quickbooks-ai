"use client";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Download, Sparkles, TrendingUp, AlertTriangle, RefreshCw, FileText, Calculator, Receipt, BookOpen } from "lucide-react";
import { exportReport } from "@/lib/export";
import type { ProfitLossReport, BalanceSheetReport, CashFlowReport, AgedReceivablesReport, TrialBalanceReport, TaxSummaryReport, GeneralLedgerReport } from "@/types";

interface ReportSummary {
  period: string;
  summary_text: string;
  highlights: string[];
  warnings: string[];
  metrics: {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    income_growth_pct: number;
    expense_growth_pct: number;
    profit_margin_pct: number;
    top_expense_category: { name: string; amount: number } | null;
    largest_transaction: { description: string; amount: number; type: string } | null;
    overdue_invoices: { count: number; total: number };
    cash_position: number;
  };
}

const COLORS = ["#7C3AED", "#F472B6", "#059669", "#F59E0B", "#8B5CF6", "#06B6D4", "#FB923C", "#A3E635"];

const tooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  backgroundColor: '#ffffff',
  padding: '8px 12px',
};

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("pl");
  const [dateRange, setDateRange] = useState("6m");
  const tabs = [
    { id: "pl", label: "Profit & Loss" },
    { id: "bs", label: "Balance Sheet" },
    { id: "cf", label: "Cash Flow" },
    { id: "ar", label: "Aged Receivables" },
    { id: "tb", label: "Trial Balance" },
    { id: "tax", label: "Tax Summary" },
    { id: "gl", label: "General Ledger" },
  ];

  const queryClient = useQueryClient();

  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching } = useQuery<ReportSummary>({
    queryKey: ["reports", "ai-summary"],
    queryFn: () => fetch("/api/ai/report-summary").then(r => r.json()),
    enabled: activeTab === "pl",
    staleTime: 5 * 60 * 1000,
  });

  // Convert dateRange to months count for APIs that accept it
  const rangeToMonths = (range: string): string => {
    switch (range) {
      case "1m": return "1";
      case "3m": return "3";
      case "6m": return "6";
      case "1y": return "12";
      case "ytd": {
        const now = new Date();
        return String(now.getMonth() + 1); // months since Jan 1
      }
      case "all": return "120"; // 10 years effectively
      default: return "6";
    }
  };
  const months = rangeToMonths(dateRange);

  const { data: plData, isLoading: plLoading } = useQuery<ProfitLossReport>({
    queryKey: ["reports", "profit-loss", dateRange],
    queryFn: () => fetch(`/api/reports/profit-loss?months=${months}`).then(r => r.json()),
    enabled: activeTab === "pl",
  });
  const { data: bsData, isLoading: bsLoading } = useQuery<BalanceSheetReport>({
    queryKey: ["reports", "balance-sheet", dateRange],
    queryFn: () => fetch(`/api/reports/balance-sheet?range=${dateRange}`).then(r => r.json()),
    enabled: activeTab === "bs",
  });
  const { data: cfData, isLoading: cfLoading } = useQuery<CashFlowReport>({
    queryKey: ["reports", "cash-flow", dateRange],
    queryFn: () => fetch(`/api/reports/cash-flow?months=${months}`).then(r => r.json()),
    enabled: activeTab === "cf",
  });
  const { data: arData, isLoading: arLoading } = useQuery<AgedReceivablesReport>({
    queryKey: ["reports", "aged-receivables", dateRange],
    queryFn: () => fetch(`/api/reports/aged-receivables?range=${dateRange}`).then(r => r.json()),
    enabled: activeTab === "ar",
  });
  const { data: tbData, isLoading: tbLoading } = useQuery<TrialBalanceReport>({
    queryKey: ["reports", "trial-balance", dateRange],
    queryFn: () => fetch(`/api/reports/trial-balance?range=${dateRange}`).then(r => r.json()),
    enabled: activeTab === "tb",
  });
  const { data: taxData, isLoading: taxLoading } = useQuery<TaxSummaryReport>({
    queryKey: ["reports", "tax-summary", dateRange],
    queryFn: () => fetch(`/api/reports/tax-summary?range=${dateRange}`).then(r => r.json()),
    enabled: activeTab === "tax",
  });
  const { data: glData, isLoading: glLoading } = useQuery<GeneralLedgerReport>({
    queryKey: ["reports", "general-ledger", dateRange],
    queryFn: () => fetch(`/api/reports/general-ledger?months=${months}`).then(r => r.json()),
    enabled: activeTab === "gl",
  });

  const buildCategoryData = (categories: { category: string; amount: number }[] | undefined) => {
    if (!categories || categories.length === 0) return [];
    const sorted = [...categories].sort((a, b) => b.amount - a.amount);
    if (sorted.length <= 6) return sorted;
    const top5 = sorted.slice(0, 5);
    const otherAmount = sorted.slice(5).reduce((sum, c) => sum + c.amount, 0);
    return [...top5, { category: "Other", amount: otherAmount }];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 12 }}>
        {/* Tab bar */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 12, overflowX: 'auto', maxWidth: '100%' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className="cursor-pointer"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
                background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.id ? '#0F172A' : '#94A3B8',
                boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Period + Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
            {[
              { id: "3m", label: "3M" },
              { id: "6m", label: "6M" },
              { id: "1y", label: "1Y" },
              { id: "all", label: "All" },
            ].map(r => (
              <button
                key={r.id}
                className="cursor-pointer"
                onClick={() => setDateRange(r.id)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none',
                  transition: 'all 0.15s',
                  background: dateRange === r.id ? '#FFFFFF' : 'transparent',
                  color: dateRange === r.id ? '#0F172A' : '#94A3B8',
                  boxShadow: dateRange === r.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className="cursor-pointer"
            onClick={() => {
              if (activeTab === 'pl' && plData) {
                exportReport(
                  plData.monthly_data.map((m: { period: string; income: number; expenses: number; net: number }) => ({ Period: m.period, Income: m.income, Expenses: m.expenses, Net: m.net })),
                  'profit-loss'
                );
              } else if (activeTab === 'bs' && bsData) {
                const rows: Record<string, unknown>[] = [];
                bsData.accounts_by_type.forEach((g: { type: string; accounts: { name: string; balance: number }[] }) => {
                  g.accounts.forEach(a => rows.push({ Type: g.type, Account: a.name, Balance: a.balance }));
                });
                exportReport(rows, 'balance-sheet');
              } else if (activeTab === 'cf' && cfData) {
                exportReport(
                  cfData.monthly_data.map((m: { month: string; inflows: number; outflows: number; net: number }) => ({ Month: m.month, Inflows: m.inflows, Outflows: m.outflows, Net: m.net })),
                  'cash-flow'
                );
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569',
            }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Export
          </button>
        </div>
      </div>

      {/* Profit & Loss */}
      {activeTab === "pl" && (
        plLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
            </div>
            <div className="h-72 rounded-2xl animate-shimmer" />
          </div>
        ) : plData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Monthly AI Summary */}
            {summaryLoading ? (
              <div className="rounded-2xl animate-shimmer" style={{ height: 160 }} />
            ) : summaryData && summaryData.summary_text && (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                padding: 24,
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Sparkles style={{ width: 16, height: 16, color: '#FFFFFF' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Monthly Summary</h3>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 1 }}>{summaryData.period}</p>
                    </div>
                  </div>
                  <button
                    className="cursor-pointer"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["reports", "ai-summary"] })}
                    disabled={summaryFetching}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: summaryFetching ? '#F1F5F9' : '#F5F3FF',
                      border: '1px solid ' + (summaryFetching ? '#E2E8F0' : '#DDD6FE'),
                      color: summaryFetching ? '#94A3B8' : '#7C3AED',
                      transition: 'all 0.15s',
                    }}
                  >
                    <RefreshCw style={{
                      width: 13, height: 13,
                      animation: summaryFetching ? 'spin 1s linear infinite' : 'none',
                    }} />
                    Regenerate
                  </button>
                </div>

                {/* Narrative */}
                <p style={{
                  fontSize: 13, lineHeight: 1.7, color: '#334155',
                  margin: 0, marginBottom: summaryData.highlights.length > 0 || summaryData.warnings.length > 0 ? 16 : 0,
                }}>
                  {summaryData.summary_text}
                </p>

                {/* Highlights & Warnings */}
                {(summaryData.highlights.length > 0 || summaryData.warnings.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {summaryData.highlights.map((h, i) => (
                      <div key={`h-${i}`} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: '#F0FDF4', border: '1px solid #BBF7D0',
                      }}>
                        <TrendingUp style={{ width: 14, height: 14, color: '#059669', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>{h}</span>
                      </div>
                    ))}
                    {summaryData.warnings.map((w, i) => (
                      <div key={`w-${i}`} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: '#FFFBEB', border: '1px solid #FDE68A',
                      }}>
                        <AlertTriangle style={{ width: 14, height: 14, color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
              {[
                { label: 'Total Income', value: plData.total_income, color: '#059669', borderLeft: '#059669' },
                { label: 'Total Expenses', value: plData.total_expenses, color: '#EF4444', borderLeft: '#EF4444' },
                { label: 'Net Profit', value: plData.net_profit, color: plData.net_profit >= 0 ? '#059669' : '#EF4444', borderLeft: plData.net_profit >= 0 ? '#059669' : '#EF4444' },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...card, borderLeft: `4px solid ${kpi.borderLeft}`, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{kpi.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: kpi.color, marginTop: 6 }}>{formatCurrency(kpi.value)}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: 16, alignItems: 'start' }}>
              {/* Bar Chart */}
              <div className="lg:col-span-3" style={{ ...card, padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Monthly Trend</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Income vs expenses over time</p>
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData.monthly_data} barCategoryGap="30%" barGap={4} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                      <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 11, color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', display: 'inline-block' }} /> Income</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', opacity: 0.8, display: 'inline-block' }} /> Expenses</span>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="lg:col-span-2" style={{ ...card, padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>By Category</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Expense breakdown</p>
                </div>
                {(() => {
                  const categoryData = buildCategoryData(plData.expenses_by_category);
                  const catTotal = categoryData.reduce((s, c) => s + c.amount, 0);
                  return (
                    <>
                      <div style={{ height: 180, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={42} paddingAngle={2} strokeWidth={0}>
                              {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                          textAlign: 'center', pointerEvents: 'none',
                        }}>
                          <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Total</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                            ${(catTotal / 1000).toFixed(0)}k
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        {categoryData.map((cat, i) => {
                          const pct = catTotal > 0 ? ((cat.amount / catTotal) * 100).toFixed(1) : '0';
                          return (
                            <div key={cat.category} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0, marginTop: 3 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</p>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{pct}%</p>
                                <p style={{ fontSize: 11, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cat.amount)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )
      )}

      {/* Balance Sheet */}
      {activeTab === "bs" && (
        bsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
            </div>
            <div className="h-64 rounded-2xl animate-shimmer" />
          </div>
        ) : bsData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
              {[
                { label: 'Total Assets', value: bsData.total_assets, color: '#059669' },
                { label: 'Total Liabilities', value: bsData.total_liabilities, color: '#EF4444' },
                { label: 'Total Equity', value: bsData.total_equity, color: '#0F172A' },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...card, borderLeft: `4px solid ${kpi.color}`, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{kpi.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: kpi.color, marginTop: 6 }}>{formatCurrency(kpi.value)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
              {bsData.accounts_by_type.map(group => (
                <div key={group.type} style={{ ...card, padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize', marginBottom: 12 }}>{group.type}s</h3>
                  {group.accounts.map((acc, i) => (
                    <div key={acc.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, borderBottom: i < group.accounts.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <span style={{ color: '#64748B' }}>{acc.name}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Cash Flow */}
      {activeTab === "cf" && (
        cfLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
            </div>
            <div className="h-72 rounded-2xl animate-shimmer" />
          </div>
        ) : cfData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
              {[
                { label: 'Total Inflows', value: `+${formatCurrency(cfData.total_inflows)}`, color: '#059669' },
                { label: 'Total Outflows', value: `-${formatCurrency(cfData.total_outflows)}`, color: '#EF4444' },
                { label: 'Opening Balance', value: formatCurrency(cfData.opening_balance), color: '#0F172A' },
                { label: 'Closing Balance', value: formatCurrency(cfData.closing_balance), color: '#0F172A' },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...card, borderLeft: `4px solid ${kpi.color}`, padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: kpi.color, marginTop: 6 }}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Cash Flow Trend</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 16 }}>Inflows, outflows & net movement over time</p>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cfData.monthly_data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="inflows" name="Inflows" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                    <Line type="monotone" dataKey="outflows" name="Outflows" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: '#7C3AED' }} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 11, color: '#64748B' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }} /> Inflows</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} /> Outflows</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, border: '2px dashed #7C3AED', display: 'inline-block' }} /> Net</span>
              </div>
            </div>
          </div>
        )
      )}
      {/* Aged Receivables */}
      {activeTab === "ar" && (
        arLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="h-24 rounded-2xl animate-shimmer" />
            <div className="h-64 rounded-2xl animate-shimmer" />
          </div>
        ) : arData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, borderLeft: '4px solid #F59E0B', padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Total Outstanding</p>
              <p style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#F59E0B', marginTop: 6 }}>{formatCurrency(arData.total_outstanding)}</p>
            </div>
            {/* Buckets chart */}
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Aging Breakdown</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={arData.buckets} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    <Bar dataKey="total" name="Amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Bucket detail tables */}
            {arData.buckets.filter(b => b.clients.length > 0).map(bucket => (
              <div key={bucket.label} style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{bucket.label}</h4>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(bucket.total)}</span>
                </div>
                {bucket.clients.map((client, i) => (
                  <div key={client.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, borderBottom: i < bucket.clients.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{client.name}</span>
                      <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 8 }}>{client.invoice_count} invoice{client.invoice_count !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(client.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {/* Trial Balance */}
      {activeTab === "tb" && (
        tbLoading ? (
          <div className="h-96 rounded-2xl animate-shimmer" />
        ) : tbData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div style={{ ...card, borderLeft: '4px solid #059669', padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Total Debits</p>
                <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#059669', marginTop: 6 }}>{formatCurrency(tbData.total_debits)}</p>
              </div>
              <div style={{ ...card, borderLeft: '4px solid #7C3AED', padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Total Credits</p>
                <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#7C3AED', marginTop: 6 }}>{formatCurrency(tbData.total_credits)}</p>
              </div>
            </div>
            {Math.abs(tbData.total_debits - tbData.total_credits) < 0.01 && (
              <div style={{ padding: '10px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#059669' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#065F46' }}>Trial balance is in balance — debits equal credits.</span>
              </div>
            )}
            <div style={{ ...card }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Account</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', width: 120 }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', width: 120 }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {tbData.rows.map((row, i) => (
                    <tr key={row.account_id} style={{ borderBottom: i < tbData.rows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: '#0F172A' }}>{row.account_name}</td>
                      <td style={{ padding: '10px 16px', textTransform: 'capitalize', color: '#64748B' }}>{row.account_type}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: row.debit > 0 ? 600 : 400, color: row.debit > 0 ? '#0F172A' : '#CBD5E1' }}>{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: row.credit > 0 ? 600 : 400, color: row.credit > 0 ? '#0F172A' : '#CBD5E1' }}>{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, borderTop: '2px solid #E2E8F0' }}>
                    <td colSpan={2} style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#64748B' }}>Totals</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatCurrency(tbData.total_debits)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatCurrency(tbData.total_credits)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tax Summary */}
      {activeTab === "tax" && (
        taxLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
            </div>
            <div className="h-64 rounded-2xl animate-shimmer" />
          </div>
        ) : taxData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
              {[
                { label: 'Taxable Income', value: formatCurrency(taxData.taxable_income), color: '#059669' },
                { label: 'Total Deductions', value: formatCurrency(taxData.total_deductions), color: '#7C3AED' },
                { label: 'Est. Tax Liability', value: formatCurrency(taxData.estimated_tax_liability), color: '#EF4444' },
                { label: 'Effective Rate', value: `${taxData.effective_rate}%`, color: '#F59E0B' },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...card, borderLeft: `4px solid ${kpi.color}`, padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{kpi.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: kpi.color, marginTop: 6 }}>{kpi.value}</p>
                </div>
              ))}
            </div>
            {/* Quarterly breakdown */}
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Quarterly Breakdown</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taxData.quarterly} barCategoryGap="30%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.8} />
                    <Bar dataKey="estimated_tax" name="Est. Tax" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Deductions by category */}
            <div style={{ ...card }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Deductions by Category</h3>
              </div>
              {taxData.deductions_by_category.map((cat, i) => (
                <div key={cat.category} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: i < taxData.deductions_by_category.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{cat.category}</span>
                    {cat.is_deductible && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#059669', textTransform: 'uppercase' }}>Deductible</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* General Ledger */}
      {activeTab === "gl" && (
        glLoading ? (
          <div className="h-96 rounded-2xl animate-shimmer" />
        ) : glData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 16px', borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen style={{ width: 14, height: 14, color: '#7C3AED' }} />
              <span style={{ fontSize: 13, color: '#5B21B6' }}>
                Showing {glData.accounts.length} accounts with activity in the last 6 months
              </span>
            </div>
            {glData.accounts.map(account => (
              <div key={account.account_id} style={{ ...card }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{account.account_name}</h4>
                    <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize', marginTop: 2 }}>{account.account_type}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>Closing Balance</p>
                    <p style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatCurrency(account.closing_balance)}</p>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', width: 100 }}>Debit</th>
                      <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', width: 100 }}>Credit</th>
                      <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', width: 110 }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.entries.slice(0, 20).map((entry, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 16px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: '8px 16px', color: '#0F172A', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: entry.debit > 0 ? '#0F172A' : '#CBD5E1' }}>{entry.debit > 0 ? formatCurrency(entry.debit) : '—'}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: entry.credit > 0 ? '#0F172A' : '#CBD5E1' }}>{entry.credit > 0 ? formatCurrency(entry.credit) : '—'}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(entry.balance)}</td>
                      </tr>
                    ))}
                    {account.entries.length > 20 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
                          ...and {account.entries.length - 20} more entries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
