"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sparkles, AlertTriangle, Lightbulb, ChevronRight, TrendingUp, TrendingDown, DollarSign, Receipt, ArrowUpRight, ArrowDownRight, FileText, Activity, Clock, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DashboardStats, CashFlowForecast } from "@/types";
import Link from "next/link";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const tooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  backgroundColor: '#ffffff',
  padding: '8px 12px',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
  });

  const { data: forecast } = useQuery<CashFlowForecast>({
    queryKey: ["forecast"],
    queryFn: () => fetch("/api/ai/forecast").then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl animate-shimmer" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle style={{ width: 16, height: 16, color: '#F59E0B', flexShrink: 0 }} />;
      case 'suggestion': return <Lightbulb style={{ width: 16, height: 16, color: '#7C3AED', flexShrink: 0 }} />;
      default: return <Sparkles style={{ width: 16, height: 16, color: '#8B5CF6', flexShrink: 0 }} />;
    }
  };

  const incomeChange = data.income_change ?? 0;
  const expenseChange = data.expense_change ?? 0;
  const incomeRatio = data.total_income + data.total_expenses > 0
    ? Math.round((data.total_income / (data.total_income + data.total_expenses)) * 100)
    : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
        {/* Cash Balance */}
        <div style={{ ...card, padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign style={{ width: 16, height: 16, color: '#7C3AED' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Cash Balance</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatCurrency(data.cash_balance)}
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Current available balance</p>
        </div>

        {/* Income */}
        <div style={{ ...card, padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight style={{ width: 16, height: 16, color: '#059669' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Income</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatCurrency(data.total_income)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, color: incomeChange >= 0 ? '#059669' : '#EF4444' }}>
              {incomeChange >= 0 ? <TrendingUp style={{ width: 14, height: 14 }} /> : <TrendingDown style={{ width: 14, height: 14 }} />}
              {Math.abs(incomeChange)}%
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>vs last month</span>
          </div>
        </div>

        {/* Expenses */}
        <div style={{ ...card, padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight style={{ width: 16, height: 16, color: '#EF4444' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Expenses</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatCurrency(data.total_expenses)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, color: expenseChange <= 0 ? '#059669' : '#EF4444' }}>
              {expenseChange <= 0 ? <TrendingDown style={{ width: 14, height: 14 }} /> : <TrendingUp style={{ width: 14, height: 14 }} />}
              {Math.abs(expenseChange)}%
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>vs last month</span>
          </div>
        </div>

        {/* Net Profit */}
        <div style={{ ...card, padding: '20px 24px 16px', borderLeft: `4px solid ${data.net_profit >= 0 ? '#059669' : '#EF4444'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: data.net_profit >= 0 ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {data.net_profit >= 0
                ? <TrendingUp style={{ width: 16, height: 16, color: '#059669' }} />
                : <TrendingDown style={{ width: 16, height: 16, color: '#EF4444' }} />}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Net Profit</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: data.net_profit >= 0 ? '#059669' : '#EF4444' }}>
            {formatCurrency(data.net_profit)}
          </p>
          {/* Income vs Expenses ratio */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 500, color: '#94A3B8', marginBottom: 4 }}>
              <span>Income {incomeRatio}%</span>
              <span>Expenses {100 - incomeRatio}%</span>
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: '#F1F5F9' }}>
              <div style={{ background: '#059669', width: `${incomeRatio}%`, borderRadius: '99px 0 0 99px' }} />
              <div style={{ background: '#EF4444', width: `${100 - incomeRatio}%`, borderRadius: '0 99px 99px 0' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Chart + AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 16 }}>
        {/* Monthly Overview Chart */}
        <div style={{ ...card, padding: 24 }} className="lg:col-span-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Monthly Overview</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Income vs expenses</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#059669', display: 'inline-block' }} /> Income</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444', display: 'inline-block' }} /> Expenses</span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data} barCategoryGap="30%" barGap={4} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
                <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: 12, height: 12, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>AI Insights</span>
            </div>
            <Link
              href="/ai"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#7C3AED',
                background: '#EDE9FE',
                padding: '4px 12px',
                borderRadius: 99,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Ask AI <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.insights.slice(0, 4).map((insight, i) => (
              <div
                key={insight.id || i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 0',
                  borderBottom: i < Math.min(data.insights.length, 4) - 1 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>{insightIcon(insight.type)}</div>
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.title}</p>
                  <p style={{
                    fontSize: 12, marginTop: 2, lineHeight: 1.5, color: '#64748B',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}>{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2.5: Cash Flow Forecast ── */}
      {forecast && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Cash Flow Forecast</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>AI-powered projection based on historical trends</p>
                </div>
              </div>
              {forecast.months_of_runway < 999 && (
                <div style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                  background: forecast.months_of_runway > 12 ? '#ECFDF5' : forecast.months_of_runway > 6 ? '#FEF3C7' : '#FEF2F2',
                  color: forecast.months_of_runway > 12 ? '#059669' : forecast.months_of_runway > 6 ? '#D97706' : '#EF4444',
                }}>
                  {forecast.months_of_runway} months runway
                </div>
              )}
            </div>

            {/* Forecast mini-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginBottom: 20 }}>
              {/* 30-day */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16,
                borderTop: `3px solid #7C3AED`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Clock style={{ width: 14, height: 14, color: '#7C3AED' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>30-Day</span>
                </div>
                <p style={{
                  fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  color: forecast.forecast_30d >= 0 ? '#0F172A' : '#EF4444',
                }}>
                  {formatCurrency(forecast.forecast_30d)}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  {forecast.forecast_30d >= forecast.current_balance ? '+' : ''}{formatCurrency(forecast.forecast_30d - forecast.current_balance)} from today
                </p>
              </div>

              {/* 60-day */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16,
                borderTop: '3px solid #8B5CF6',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Clock style={{ width: 14, height: 14, color: '#8B5CF6' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>60-Day</span>
                </div>
                <p style={{
                  fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  color: forecast.forecast_60d >= 0 ? '#0F172A' : '#EF4444',
                }}>
                  {formatCurrency(forecast.forecast_60d)}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  {forecast.forecast_60d >= forecast.current_balance ? '+' : ''}{formatCurrency(forecast.forecast_60d - forecast.current_balance)} from today
                </p>
              </div>

              {/* 90-day */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16,
                borderTop: '3px solid #A78BFA',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Clock style={{ width: 14, height: 14, color: '#A78BFA' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>90-Day</span>
                </div>
                <p style={{
                  fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  color: forecast.forecast_90d >= 0 ? '#0F172A' : '#EF4444',
                }}>
                  {formatCurrency(forecast.forecast_90d)}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  {forecast.forecast_90d >= forecast.current_balance ? '+' : ''}{formatCurrency(forecast.forecast_90d - forecast.current_balance)} from today
                </p>
              </div>
            </div>

            {/* Forecast insights */}
            {forecast.insights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {forecast.insights.slice(0, 2).map((insight, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 0',
                      borderTop: i === 0 ? '1px solid #F1F5F9' : 'none',
                      borderBottom: i < Math.min(forecast.insights.length, 2) - 1 ? '1px solid #F1F5F9' : 'none',
                    }}
                  >
                    <Zap style={{ width: 14, height: 14, color: '#7C3AED', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: '#64748B' }}>{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 3: Invoices + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
        {/* Invoices Summary */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText style={{ width: 16, height: 16, color: '#7C3AED' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Invoices</span>
            </div>
            <Link href="/invoices" style={{ fontSize: 12, fontWeight: 500, color: '#7C3AED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#EF4444' }}>Overdue</p>
              <p style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#DC2626', marginTop: 4 }}>{formatCurrency(data.invoice_overdue ?? 0)}</p>
            </div>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>Paid (30d)</p>
              <p style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#059669', marginTop: 4 }}>{formatCurrency(data.invoice_paid_30d ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt style={{ width: 16, height: 16, color: '#8B5CF6' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Recent Transactions</span>
            </div>
            <Link href="/transactions" style={{ fontSize: 12, fontWeight: 500, color: '#7C3AED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div>
            {data.recent_transactions.slice(0, 5).map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '10px 0',
                  borderBottom: i < Math.min(data.recent_transactions.length, 5) - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{formatDate(tx.date)}</p>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600, flexShrink: 0, fontVariantNumeric: 'tabular-nums', textAlign: 'right' as const,
                  color: tx.type === 'income' ? '#059669' : '#EF4444',
                }}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
