"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { ProfitLossReport, BalanceSheetReport, CashFlowReport } from "@/types";

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

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

  const tooltipStyle = {
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff',
  };

  return (
    <div className="space-y-4 animate-fade-in font-[family-name:var(--font-plus-jakarta)]">
      {/* Tab Bar */}
      <div className="flex items-center rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 px-3 py-3 text-[13px] font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? "text-gray-900 border-emerald-500"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profit & Loss */}
      {activeTab === "pl" && (
        plLoading ? <Skeleton className="h-80 rounded-lg" /> : plData && (
          <div className="space-y-3">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Income</p>
                <p className="text-sm md:text-xl tabular-nums font-extrabold text-emerald-500 mt-1">{formatCurrency(plData.total_income)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</p>
                <p className="text-sm md:text-xl tabular-nums font-extrabold text-red-500 mt-1">{formatCurrency(plData.total_expenses)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net</p>
                <p className={`text-sm md:text-xl tabular-nums font-extrabold mt-1 ${plData.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(plData.net_profit)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Trend</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="h-44 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pie */}
            <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses by Category</h3>
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
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  {plData.expenses_by_category.slice(0, 6).map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2 text-[11px] py-0.5">
                      <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700 truncate">{cat.category}</span>
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
        bsLoading ? <Skeleton className="h-80 rounded-lg" /> : bsData && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assets</p>
                <p className="text-sm md:text-xl tabular-nums font-extrabold text-emerald-500 mt-1">{formatCurrency(bsData.total_assets)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Liabilities</p>
                <p className="text-sm md:text-xl tabular-nums font-extrabold text-red-500 mt-1">{formatCurrency(bsData.total_liabilities)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Equity</p>
                <p className="text-sm md:text-xl tabular-nums font-extrabold text-gray-900 mt-1">{formatCurrency(bsData.total_equity)}</p>
              </div>
            </div>
            {bsData.accounts_by_type.map(group => (
              <div key={group.type} className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 pb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider capitalize">{group.type}s</h3>
                </div>
                <div className="px-4 pb-4">
                  <div className="divide-y divide-gray-200">
                    {group.accounts.map(acc => (
                      <div key={acc.name} className="flex justify-between py-2.5 text-[13px]">
                        <span className="text-gray-700">{acc.name}</span>
                        <span className="tabular-nums font-extrabold text-gray-900">{formatCurrency(acc.balance)}</span>
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
        cfLoading ? <Skeleton className="h-80 rounded-lg" /> : cfData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inflows</p>
                <p className="text-base md:text-xl tabular-nums font-extrabold text-emerald-500 mt-1">+{formatCurrency(cfData.total_inflows)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outflows</p>
                <p className="text-base md:text-xl tabular-nums font-extrabold text-red-500 mt-1">-{formatCurrency(cfData.total_outflows)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening</p>
                <p className="text-base md:text-xl tabular-nums font-extrabold text-gray-900 mt-1">{formatCurrency(cfData.opening_balance)}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3 md:p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Closing</p>
                <p className="text-base md:text-xl tabular-nums font-extrabold text-gray-900 mt-1">{formatCurrency(cfData.closing_balance)}</p>
              </div>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cash Flow Trend</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="h-44 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="inflows" name="Inflows" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="outflows" name="Outflows" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
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
