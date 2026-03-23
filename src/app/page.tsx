"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { title: "Income", value: data.total_income, change: data.income_change, icon: TrendingUp, gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", textColor: "text-emerald-700" },
    { title: "Expenses", value: data.total_expenses, change: data.expense_change, icon: TrendingDown, gradient: "from-rose-500 to-rose-600", lightBg: "bg-rose-50", textColor: "text-rose-600" },
    { title: "Net Profit", value: data.net_profit, change: null, icon: DollarSign, gradient: "from-indigo-500 to-indigo-600", lightBg: "bg-indigo-50", textColor: data.net_profit >= 0 ? "text-indigo-600" : "text-rose-600" },
    { title: "Cash", value: data.cash_balance, change: null, icon: Wallet, gradient: "from-violet-500 to-violet-600", lightBg: "bg-violet-50", textColor: "text-violet-600" },
  ];

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <div className="rounded-lg bg-amber-50 p-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /></div>;
      case 'suggestion': return <div className="rounded-lg bg-indigo-50 p-1.5"><Lightbulb className="h-3.5 w-3.5 text-indigo-500" /></div>;
      default: return <div className="rounded-lg bg-emerald-50 p-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-500" /></div>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <div className={`rounded-lg p-1.5 ${stat.lightBg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.textColor}`} />
                </div>
              </div>
              <p className={`text-xl md:text-2xl font-extrabold tabular-nums ${stat.textColor}`}>
                {formatCurrency(stat.value)}
              </p>
              {stat.change !== null && (
                <div className="flex items-center gap-1 mt-1.5">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-rose-500" />
                  )}
                  <span className={`text-[11px] font-bold ${stat.change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
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
        <CardHeader className="p-4 pb-1">
          <CardTitle>Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="h-44 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} barGap={3} margin={{ left: -15, right: 0, top: 5 }}>
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={38} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions" className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5 cursor-pointer hover:text-indigo-700 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-2">
          <div className="divide-y divide-slate-100/60">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{tx.description}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-[13px] font-bold shrink-0 tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-indigo-100/50">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 p-1.5">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <CardTitle className="text-slate-800">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2.5">
            {data.insights.slice(0, 3).map((insight, i) => (
              <div key={insight.id || i} className="flex gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="shrink-0 mt-0.5">{insightIcon(insight.type)}</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{insight.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
