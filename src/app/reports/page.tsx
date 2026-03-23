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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
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
              <Card>
                <CardContent className="p-3 md:p-5 text-center">
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Income</p>
                  <p className="text-sm md:text-xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(plData.total_income)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:p-5 text-center">
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Expenses</p>
                  <p className="text-sm md:text-xl font-bold text-red-500 mt-1 tabular-nums">{formatCurrency(plData.total_expenses)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:p-5 text-center">
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Net</p>
                  <p className={`text-sm md:text-xl font-bold mt-1 tabular-nums ${plData.net_profit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>{formatCurrency(plData.net_profit)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-48 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[3,3,0,0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-48 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={plData.expenses_by_category} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                        {plData.expenses_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {plData.expenses_by_category.slice(0, 6).map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2 text-xs py-0.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 truncate">{cat.category}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Balance Sheet */}
      {activeTab === "bs" && (
        bsLoading ? <Skeleton className="h-80 rounded-2xl" /> : bsData && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Card><CardContent className="p-3 md:p-5 text-center"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Assets</p><p className="text-sm md:text-xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(bsData.total_assets)}</p></CardContent></Card>
              <Card><CardContent className="p-3 md:p-5 text-center"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Liabilities</p><p className="text-sm md:text-xl font-bold text-red-500 mt-1 tabular-nums">{formatCurrency(bsData.total_liabilities)}</p></CardContent></Card>
              <Card><CardContent className="p-3 md:p-5 text-center"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Equity</p><p className="text-sm md:text-xl font-bold text-indigo-600 mt-1 tabular-nums">{formatCurrency(bsData.total_equity)}</p></CardContent></Card>
            </div>
            {bsData.accounts_by_type.map(group => (
              <Card key={group.type}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 capitalize">{group.type}s</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="divide-y divide-gray-100">
                    {group.accounts.map(acc => (
                      <div key={acc.name} className="flex justify-between py-2.5 text-sm">
                        <span className="text-gray-600">{acc.name}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Cash Flow */}
      {activeTab === "cf" && (
        cfLoading ? <Skeleton className="h-80 rounded-2xl" /> : cfData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Card><CardContent className="p-3 md:p-5"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Inflows</p><p className="text-base md:text-xl font-bold text-emerald-600 mt-1 tabular-nums">+{formatCurrency(cfData.total_inflows)}</p></CardContent></Card>
              <Card><CardContent className="p-3 md:p-5"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Outflows</p><p className="text-base md:text-xl font-bold text-red-500 mt-1 tabular-nums">-{formatCurrency(cfData.total_outflows)}</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Card><CardContent className="p-3 md:p-5"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Opening</p><p className="text-base md:text-xl font-bold mt-1 tabular-nums">{formatCurrency(cfData.opening_balance)}</p></CardContent></Card>
              <Card><CardContent className="p-3 md:p-5"><p className="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Closing</p><p className="text-base md:text-xl font-bold text-indigo-600 mt-1 tabular-nums">{formatCurrency(cfData.closing_balance)}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Cash Flow Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-48 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfData.monthly_data} margin={{ left: -10, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="inflows" name="Inflows" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="outflows" name="Outflows" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}
