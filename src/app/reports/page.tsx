"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { ProfitLossReport, BalanceSheetReport, CashFlowReport } from "@/types";

const COLORS = ["#4f46e5", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("pl");
  const tabs = [
    { id: "pl", label: "P&L" },
    { id: "bs", label: "Balance Sheet" },
    { id: "cf", label: "Cash Flow" },
  ];

  const { data: plData, isLoading: plLoading } = useQuery<ProfitLossReport>({
    queryKey: ["reports", "profit-loss"],
    queryFn: () => fetch("/api/reports/profit-loss").then(r => r.json()),
    enabled: activeTab === "pl",
  });

  const { data: bsData, isLoading: bsLoading } = useQuery<BalanceSheetReport>({
    queryKey: ["reports", "balance-sheet"],
    queryFn: () => fetch("/api/reports/balance-sheet").then(r => r.json()),
    enabled: activeTab === "bs",
  });

  const { data: cfData, isLoading: cfLoading } = useQuery<CashFlowReport>({
    queryKey: ["reports", "cash-flow"],
    queryFn: () => fetch("/api/reports/cash-flow").then(r => r.json()),
    enabled: activeTab === "cf",
  });

  const roundedTooltipStyle = {
    borderRadius: '16px',
    border: '1px solid rgba(226,232,240,0.6)',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  };

  return (
    <div className="space-y-4 animate-fade-in font-[family-name:var(--font-plus-jakarta)]">
      {/* Tab Bar - Glass pill */}
      <div className="flex items-center gap-1 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 px-3 py-2.5 text-[13px] font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profit & Loss */}
      {activeTab === "pl" && (
        plLoading ? <Skeleton className="h-80 rounded-2xl" /> : plData && (
          <div className="space-y-3">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Income</p>
                <p className="text-sm md:text-xl tabular-nums font-bold text-emerald-600 mt-1">{formatCurrency(plData.total_income)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Expenses</p>
                <p className="text-sm md:text-xl tabular-nums font-bold text-rose-500 mt-1">{formatCurrency(plData.total_expenses)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Net</p>
                <p className={`text-sm md:text-xl tabular-nums font-bold mt-1 ${plData.net_profit >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>{formatCurrency(plData.net_profit)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-[13px] font-semibold text-slate-700">Monthly Trend</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="h-44 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={roundedTooltipStyle} />
                      <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4,4,0,0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pie */}
            <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-[13px] font-semibold text-slate-700">Expenses by Category</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="h-44 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={plData.expenses_by_category}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={typeof window !== 'undefined' && window.innerWidth < 768 ? 65 : 75}
                        innerRadius={typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40}
                        paddingAngle={2}
                      >
                        {plData.expenses_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={roundedTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  {plData.expenses_by_category.slice(0, 6).map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2 text-[11px] py-0.5">
                      <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 truncate">{cat.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Balance Sheet */}
      {activeTab === "bs" && (
        bsLoading ? <Skeleton className="h-80 rounded-2xl" /> : bsData && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Assets</p>
                <p className="text-sm md:text-xl tabular-nums font-bold text-emerald-600 mt-1">{formatCurrency(bsData.total_assets)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Liabilities</p>
                <p className="text-sm md:text-xl tabular-nums font-bold text-rose-500 mt-1">{formatCurrency(bsData.total_liabilities)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Equity</p>
                <p className="text-sm md:text-xl tabular-nums font-bold text-indigo-600 mt-1">{formatCurrency(bsData.total_equity)}</p>
              </div>
            </div>
            {bsData.accounts_by_type.map(group => (
              <div key={group.type} className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
                <div className="p-4 pb-2">
                  <h3 className="text-[13px] font-semibold text-slate-700 capitalize">{group.type}s</h3>
                </div>
                <div className="px-4 pb-4">
                  <div className="divide-y divide-slate-100/60">
                    {group.accounts.map(acc => (
                      <div key={acc.name} className="flex justify-between py-2.5 text-[13px]">
                        <span className="text-slate-600">{acc.name}</span>
                        <span className="tabular-nums font-bold text-slate-900">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Cash Flow */}
      {activeTab === "cf" && (
        cfLoading ? <Skeleton className="h-80 rounded-2xl" /> : cfData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Inflows</p>
                <p className="text-base md:text-xl tabular-nums font-bold text-emerald-600 mt-1">+{formatCurrency(cfData.total_inflows)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Outflows</p>
                <p className="text-base md:text-xl tabular-nums font-bold text-rose-500 mt-1">-{formatCurrency(cfData.total_outflows)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Opening</p>
                <p className="text-base md:text-xl tabular-nums font-bold text-slate-900 mt-1">{formatCurrency(cfData.opening_balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 p-3 md:p-5">
                <p className="text-[10px] md:text-[11px] text-slate-400 uppercase font-medium tracking-wide">Closing</p>
                <p className="text-base md:text-xl tabular-nums font-bold text-indigo-600 mt-1">{formatCurrency(cfData.closing_balance)}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-[13px] font-semibold text-slate-700">Cash Flow Trend</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="h-44 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={roundedTooltipStyle} />
                      <Line type="monotone" dataKey="inflows" name="Inflows" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="outflows" name="Outflows" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
