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
    { id: "pl", label: "Profit & Loss" },
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
    <div className="space-y-6 animate-fade-in">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-full sm:w-auto overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profit & Loss */}
      {activeTab === "pl" && (
        plLoading ? <Skeleton className="h-96" /> : plData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Income</p><p className="text-lg md:text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(plData.total_income)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-lg md:text-2xl font-semibold text-red-500 mt-1">{formatCurrency(plData.total_expenses)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Net Profit</p><p className={`text-lg md:text-2xl font-semibold mt-1 ${plData.net_profit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>{formatCurrency(plData.net_profit)}</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-52 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={plData.monthly_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4,4,0,0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-52 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={plData.expenses_by_category}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          paddingAngle={2}
                        >
                          {plData.expenses_by_category.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {plData.expenses_by_category.slice(0, 6).map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600 truncate">{cat.category}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      )}

      {/* Balance Sheet */}
      {activeTab === "bs" && (
        bsLoading ? <Skeleton className="h-96" /> : bsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Assets</p><p className="text-lg md:text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(bsData.total_assets)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Liabilities</p><p className="text-lg md:text-2xl font-semibold text-red-500 mt-1">{formatCurrency(bsData.total_liabilities)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Equity</p><p className="text-lg md:text-2xl font-semibold text-indigo-600 mt-1">{formatCurrency(bsData.total_equity)}</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bsData.accounts_by_type.map(group => (
                <Card key={group.type}>
                  <CardHeader><CardTitle className="text-base capitalize">{group.type}s</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.accounts.map(acc => (
                        <div key={acc.name} className="flex justify-between text-sm">
                          <span className="text-gray-600">{acc.name}</span>
                          <span className="font-medium">{formatCurrency(acc.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      )}

      {/* Cash Flow */}
      {activeTab === "cf" && (
        cfLoading ? <Skeleton className="h-96" /> : cfData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Opening</p><p className="text-base md:text-xl font-semibold mt-1">{formatCurrency(cfData.opening_balance)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Inflows</p><p className="text-base md:text-xl font-semibold text-emerald-600 mt-1">+{formatCurrency(cfData.total_inflows)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Outflows</p><p className="text-base md:text-xl font-semibold text-red-500 mt-1">-{formatCurrency(cfData.total_outflows)}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Closing</p><p className="text-base md:text-xl font-semibold text-indigo-600 mt-1">{formatCurrency(cfData.closing_balance)}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Cash Flow Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfData.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Line type="monotone" dataKey="inflows" name="Inflows" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="outflows" name="Outflows" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="net" name="Net" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
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
