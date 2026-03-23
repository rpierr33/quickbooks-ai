"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { title: "Income", value: data.total_income, change: data.income_change, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Expenses", value: data.total_expenses, change: data.expense_change, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
    { title: "Net Profit", value: data.net_profit, change: null, icon: DollarSign, color: data.net_profit >= 0 ? "text-indigo-600" : "text-red-500", bg: "bg-indigo-50" },
    { title: "Cash", value: data.cash_balance, change: null, icon: Wallet, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-indigo-500 shrink-0" />;
      default: return <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-lg md:text-2xl font-bold ${stat.color}`}>
                {formatCurrency(stat.value)}
              </p>
              {stat.change !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-semibold ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {Math.abs(stat.change)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="h-48 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} barGap={2} margin={{ left: -10, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4">
          <div className="divide-y divide-gray-100">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4">
          <div className="divide-y divide-gray-100">
            {data.insights.slice(0, 3).map((insight, i) => (
              <div key={insight.id || i} className="flex gap-3 py-3">
                <div className="mt-0.5">{insightIcon(insight.type)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
