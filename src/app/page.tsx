"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sparkles, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 rounded-lg bg-white border border-gray-200 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 rounded-lg bg-white border border-gray-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" />;
      default: return <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Flow */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cash Flow</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tabular-nums mt-2">
            {formatCurrency(data.cash_balance)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Current cash balance</p>
          <div className="h-28 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar dataKey="income" name="Money in" fill="#34d399" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Money out" fill="#93c5fd" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tabular-nums mt-2">
            {formatCurrency(data.total_expenses)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Business spending</p>
          <div className="mt-5 space-y-2.5">
            {data.monthly_data.slice(-3).map((m) => (
              <div key={m.period} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12">{m.period}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.min((m.expenses / 20000) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums w-16 text-right">{formatCurrency(m.expenses)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profit & Loss */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Profit and Loss</h3>
          <p className={`text-2xl md:text-3xl font-extrabold tabular-nums mt-2 ${data.net_profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(data.net_profit)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Net income this period</p>
          <div className="mt-5 flex gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-xs text-gray-500">Income</span>
              </div>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(data.total_income)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
                <span className="text-xs text-gray-500">Expenses</span>
              </div>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(data.total_expenses)}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5 h-3">
            <div className="bg-emerald-400 rounded-sm" style={{ width: `${(data.total_income / (data.total_income + data.total_expenses)) * 100}%` }} />
            <div className="bg-blue-300 rounded-sm" style={{ width: `${(data.total_expenses / (data.total_income + data.total_expenses)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Row 2: Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Invoices Summary */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoices</h3>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-gray-400">Overdue</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">$12,500.00</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: '35%' }} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Paid last 30 days</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums">$29,665.63</p>
            </div>
          </div>
          <Link href="/invoices" className="text-xs font-semibold text-emerald-600 mt-4 inline-flex items-center gap-0.5 cursor-pointer hover:text-emerald-700 transition-colors">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Transactions</h3>
            <Link href="/transactions" className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5 cursor-pointer hover:text-emerald-700 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{tx.description}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-[13px] font-bold shrink-0 tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {data.insights.slice(0, 3).map((insight, i) => (
              <div key={insight.id || i} className="flex gap-2.5">
                <div className="mt-0.5 shrink-0">{insightIcon(insight.type)}</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800">{insight.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
