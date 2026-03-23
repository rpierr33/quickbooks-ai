"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: "Income",
      value: data.total_income,
      change: data.income_change,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Expenses",
      value: data.total_expenses,
      change: data.expense_change,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      title: "Net Profit",
      value: data.net_profit,
      change: null,
      icon: DollarSign,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Cash Balance",
      value: data.cash_balance,
      change: null,
      icon: Wallet,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-indigo-500" />;
      default: return <Sparkles className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-semibold mt-2 ${stat.color}`}>
                {formatCurrency(stat.value)}
              </p>
              {stat.change !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-xs text-gray-400">vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div key={insight.id || i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="mt-0.5">{insightIcon(insight.type)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
