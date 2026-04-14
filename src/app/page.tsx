"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Activity,
  Clock,
  Zap,
  Plus,
  ScanLine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats, CashFlowForecast } from "@/types";

// ── Chart tooltip shared style ────────────────────────────────────────────────
const tooltipStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  backgroundColor: '#FFFFFF',
  padding: '8px 12px',
};

// ── Skeleton block ─────────────────────────────────────────────────────────────
function Skeleton({ height = 24, width = '100%', className = '' }: { height?: number; width?: number | string; className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      style={{ height, width, borderRadius: 8 }}
      aria-hidden="true"
    />
  );
}

// ── KPI Card skeleton ─────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="card" style={{ padding: '18px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Skeleton height={30} width={30} />
        <Skeleton height={11} width={80} />
      </div>
      <Skeleton height={32} width="70%" className="mb-2" />
      <Skeleton height={11} width="50%" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  subtext?: React.ReactNode;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentLeft?: string;
  footer?: React.ReactNode;
}

function KpiCard({ label, value, subtext, icon: Icon, iconBg, iconColor, accentLeft, footer }: KpiCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '18px 20px 16px',
        borderLeft: accentLeft ? `3px solid ${accentLeft}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 14, height: 14, color: iconColor }} />
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: '#64748B',
        }}>
          {label}
        </span>
      </div>

      <p className="tabular-nums" style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#0F172A',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {value}
      </p>

      {subtext && (
        <div style={{ marginTop: 6 }}>{subtext}</div>
      )}
      {footer && (
        <div style={{ marginTop: 10 }}>{footer}</div>
      )}
    </div>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ change, inverse = false }: { change: number; inverse?: boolean }) {
  // inverse=true: for expenses, DOWN is good
  const isPositive = inverse ? change <= 0 : change >= 0;
  const color  = isPositive ? '#059669' : '#EF4444';
  const Icon   = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="tabular-nums" style={{
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        color,
      }}>
        <Icon aria-hidden="true" style={{ width: 12, height: 12 }} />
        {Math.abs(change)}%
      </span>
      <span style={{ fontSize: 11, color: '#94A3B8' }}>vs last month</span>
    </div>
  );
}

// ── Needs Attention section ───────────────────────────────────────────────────
function NeedsAttention({ data }: { data: DashboardStats & { bills_due_soon?: number; unreconciled_count?: number } }) {
  const items: { label: string; value: string; urgency: 'high' | 'medium' | 'low'; href: string }[] = [];

  if ((data.invoice_overdue ?? 0) > 0) {
    items.push({ label: 'Overdue invoices', value: formatCurrency(data.invoice_overdue ?? 0), urgency: 'high', href: '/invoices' });
  }
  if ((data.bills_due_soon ?? 0) > 0) {
    items.push({ label: 'Bills due soon', value: formatCurrency(data.bills_due_soon ?? 0), urgency: 'medium', href: '/bills' });
  }
  if ((data.unreconciled_count ?? 0) > 0) {
    items.push({ label: 'Unreconciled transactions', value: `${data.unreconciled_count}`, urgency: 'low', href: '/reconciliation' });
  }

  const urgencyColor = {
    high:   { dot: '#EF4444', bg: '#FEF2F2', text: '#DC2626' },
    medium: { dot: '#D97706', bg: '#FFFBEB', text: '#B45309' },
    low:    { dot: '#64748B', bg: '#F1F5F9', text: '#475569' },
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AlertTriangle style={{ width: 13, height: 13, color: '#EF4444' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Needs Attention</span>
        </div>
        {items.length > 0 && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 99,
            background: '#FEF2F2',
            color: '#EF4444',
          }}>
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>All caught up</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>No overdue invoices or upcoming bills</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => {
            const style = urgencyColor[item.urgency];
            return (
              <Link
                key={i}
                href={item.href}
                className="cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: style.bg,
                  textDecoration: 'none',
                  transition: 'opacity 150ms ease',
                  gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    aria-hidden="true"
                    style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: style.text }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: style.text }}>{item.value}</span>
                  <ArrowRight style={{ width: 12, height: 12, color: style.text, opacity: 0.6 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Recent activity ───────────────────────────────────────────────────────────
function RecentActivity({ data }: { data: DashboardStats }) {
  const txs = data.recent_transactions?.slice(0, 6) ?? [];

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Activity style={{ width: 13, height: 13, color: '#2563EB' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Recent Activity</span>
        </div>
        <Link
          href="/transactions"
          className="cursor-pointer"
          style={{ fontSize: 12, fontWeight: 500, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          View all <ChevronRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>

      {txs.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
          <Receipt style={{ width: 28, height: 28, color: '#CBD5E1', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', marginBottom: 2 }}>No transactions yet</p>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>Add your first transaction to start tracking</p>
        </div>
      ) : (
        <div>
          {txs.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '9px 0',
                borderBottom: i < txs.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.description}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{formatDate(tx.date)}</p>
              </div>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                  color: tx.type === 'income' ? '#059669' : '#EF4444',
                }}
              >
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Insights panel ─────────────────────────────────────────────────────────
function AiInsights({ data }: { data: DashboardStats }) {
  const insights = data.insights?.slice(0, 4) ?? [];

  const insightIcon = (type: string) => {
    switch (type) {
      case 'anomaly':    return <AlertTriangle style={{ width: 14, height: 14, color: '#D97706', flexShrink: 0 }} />;
      case 'suggestion': return <Lightbulb     style={{ width: 14, height: 14, color: '#7C3AED', flexShrink: 0 }} />;
      default:           return <Sparkles      style={{ width: 14, height: 14, color: '#2563EB', flexShrink: 0 }} />;
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: 13, height: 13, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Insights</span>
        </div>
        <Link
          href="/ai"
          className="cursor-pointer"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '4px 10px',
            borderRadius: 99,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#DBEAFE'}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#EFF6FF'}
        >
          Ask AI <ChevronRight style={{ width: 11, height: 11 }} />
        </Link>
      </div>

      {insights.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
          <Sparkles style={{ width: 24, height: 24, color: '#CBD5E1', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: '#94A3B8' }}>Add transactions to get AI-powered insights</p>
        </div>
      ) : (
        <div>
          {insights.map((insight, i) => (
            <div
              key={insight.id || i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < insights.length - 1 ? '1px solid #F8FAFC' : 'none',
                cursor: 'default',
              }}
            >
              <div style={{ marginTop: 1, flexShrink: 0 }}>{insightIcon(insight.type)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0F172A',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {insight.title}
                </p>
                <p style={{
                  fontSize: 11,
                  marginTop: 2,
                  lineHeight: 1.5,
                  color: '#64748B',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}>
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cash Flow Forecast ────────────────────────────────────────────────────────
function CashFlowForecastCard({ forecast }: { forecast: CashFlowForecast }) {
  const periods = [
    { label: '30 days', value: forecast.forecast_30d, accent: '#2563EB' },
    { label: '60 days', value: forecast.forecast_60d, accent: '#7C3AED' },
    { label: '90 days', value: forecast.forecast_90d, accent: '#059669' },
  ];

  const runwayBadge = () => {
    if (forecast.months_of_runway >= 999) return null;
    const color = forecast.months_of_runway > 12
      ? { bg: '#F0FDF4', text: '#059669' }
      : forecast.months_of_runway > 6
        ? { bg: '#FFFBEB', text: '#D97706' }
        : { bg: '#FEF2F2', text: '#EF4444' };
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 99,
        background: color.bg,
        color: color.text,
      }}>
        {forecast.months_of_runway} mo. runway
      </span>
    );
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Zap style={{ width: 13, height: 13, color: '#2563EB' }} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block' }}>Cash Flow Forecast</span>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>AI projection based on your history</span>
          </div>
        </div>
        {runwayBadge()}
      </div>

      <div className="grid grid-cols-3" style={{ gap: 10, marginBottom: 16 }}>
        {periods.map(p => (
          <div
            key={p.label}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderTop: `3px solid ${p.accent}`,
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Clock style={{ width: 11, height: 11, color: p.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#64748B' }}>
                {p.label}
              </span>
            </div>
            <p className="tabular-nums" style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: p.value >= 0 ? '#0F172A' : '#EF4444',
            }}>
              {formatCurrency(p.value)}
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
              {p.value >= forecast.current_balance ? '+' : ''}{formatCurrency(p.value - forecast.current_balance)} from now
            </p>
          </div>
        ))}
      </div>

      {forecast.insights.length > 0 && (
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
          {forecast.insights.slice(0, 2).map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                padding: '7px 0',
                borderBottom: i < 1 && forecast.insights.length > 1 ? '1px solid #F8FAFC' : 'none',
              }}
            >
              <Zap style={{ width: 12, height: 12, color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, lineHeight: 1.5, color: '#64748B' }}>{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Invoice summary ───────────────────────────────────────────────────────────
function InvoiceSummary({ data }: { data: DashboardStats }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FileText style={{ width: 13, height: 13, color: '#7C3AED' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Invoices</span>
        </div>
        <Link
          href="/invoices"
          className="cursor-pointer"
          style={{ fontSize: 12, fontWeight: 500, color: '#7C3AED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          View all <ChevronRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#EF4444' }}>Overdue</p>
          <p className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
            {formatCurrency(data.invoice_overdue ?? 0)}
          </p>
        </div>
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#059669' }}>Paid (30d)</p>
          <p className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 4 }}>
            {formatCurrency(data.invoice_paid_30d ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard loading skeleton ────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome bar skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Skeleton height={22} width={200} className="mb-2" />
          <Skeleton height={14} width={130} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton height={34} width={140} />
          <Skeleton height={34} width={130} />
          <Skeleton height={34} width={125} />
        </div>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 14 }}>
        <div className="animate-shimmer card lg:col-span-2" style={{ height: 300 }} />
        <div className="animate-shimmer card" style={{ height: 300 }} />
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 14 }}>
        <div className="animate-shimmer card" style={{ height: 200 }} />
        <div className="animate-shimmer card" style={{ height: 200 }} />
      </div>
    </div>
  );
}

// ── Greeting ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayFormatted() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => {
      if (!r.ok) throw new Error('Dashboard data unavailable');
      return r.json();
    }),
  });

  const { data: forecast } = useQuery<CashFlowForecast>({
    queryKey: ['forecast'],
    queryFn: () => fetch('/api/ai/forecast').then(r => r.json()),
    retry: false,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="card animate-fade-in" style={{ padding: 48, textAlign: 'center' as const }}>
        <AlertTriangle style={{ width: 32, height: 32, color: '#EF4444', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Could not load dashboard</p>
        <p style={{ fontSize: 13, color: '#64748B' }}>Check your connection and try refreshing the page.</p>
      </div>
    );
  }

  const incomeChange  = data.income_change  ?? 0;
  const expenseChange = data.expense_change ?? 0;
  const incomeRatio   = data.total_income + data.total_expenses > 0
    ? Math.round((data.total_income / (data.total_income + data.total_expenses)) * 100)
    : 50;

  return (
    <div className="animate-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Welcome bar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {greeting()}, {firstName}
          </h2>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{todayFormatted()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <QuickActionButton href="/transactions" icon={Plus} label="Transaction" />
          <QuickActionButton href="/invoices/new" icon={FileText} label="Invoice" />
          <QuickActionButton href="/scanner" icon={ScanLine} label="Scan Receipt" accent />
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>
        <KpiCard
          label="Cash Balance"
          value={formatCurrency(data.cash_balance)}
          subtext={<p style={{ fontSize: 11, color: '#94A3B8' }}>Current available</p>}
          icon={DollarSign}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
        <KpiCard
          label="Revenue"
          value={formatCurrency(data.total_income)}
          subtext={<TrendBadge change={incomeChange} />}
          icon={ArrowUpRight}
          iconBg="#F0FDF4"
          iconColor="#059669"
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(data.total_expenses)}
          subtext={<TrendBadge change={expenseChange} inverse />}
          icon={ArrowDownRight}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(data.net_profit)}
          icon={data.net_profit >= 0 ? TrendingUp : TrendingDown}
          iconBg={data.net_profit >= 0 ? '#F0FDF4' : '#FEF2F2'}
          iconColor={data.net_profit >= 0 ? '#059669' : '#EF4444'}
          accentLeft={data.net_profit >= 0 ? '#059669' : '#EF4444'}
          footer={
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 500, color: '#94A3B8', marginBottom: 4 }}>
                <span>Revenue {incomeRatio}%</span>
                <span>Expenses {100 - incomeRatio}%</span>
              </div>
              <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', background: '#F1F5F9' }}>
                <div style={{ background: '#059669', width: `${incomeRatio}%`, transition: 'width 600ms ease' }} />
                <div style={{ background: '#EF4444', width: `${100 - incomeRatio}%` }} />
              </div>
            </div>
          }
        />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 14 }}>

        {/* Monthly bar chart */}
        <div className="card lg:col-span-2" style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Monthly Overview</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Revenue vs expenses over 6 months</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#64748B' }}>
              <LegendDot color="#059669" label="Revenue" />
              <LegendDot color="#EF4444" label="Expenses" />
            </div>
          </div>
          {data.monthly_data?.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthly_data}
                  barCategoryGap="28%"
                  barGap={3}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'inherit' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'inherit' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={value => [formatCurrency(Number(value)), '']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="income"   name="Revenue"  fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState label="Add transactions to see monthly trends" />
          )}
        </div>

        {/* AI Insights */}
        <AiInsights data={data} />
      </div>

      {/* ── Cash Flow Forecast ─────────────────────────────────────────────── */}
      {forecast && <CashFlowForecastCard forecast={forecast} />}

      {/* ── Action items + Recent activity ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 14 }}>
        <NeedsAttention data={data} />
        <RecentActivity data={data} />
      </div>

      {/* ── Invoice summary ────────────────────────────────────────────────── */}
      <InvoiceSummary data={data} />

    </div>
  );
}

// ── Small shared sub-components ───────────────────────────────────────────────

function QuickActionButton({
  href,
  icon: Icon,
  label,
  accent = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="cursor-pointer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 150ms ease',
        background: accent ? '#2563EB' : '#F1F5F9',
        color: accent ? '#FFFFFF' : '#334155',
        border: accent ? 'none' : '1px solid #E2E8F0',
        boxShadow: accent ? '0 1px 3px rgba(37, 99, 235, 0.25)' : 'none',
        whiteSpace: 'nowrap' as const,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = accent ? '#1D4ED8' : '#E2E8F0';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = accent ? '#2563EB' : '#F1F5F9';
      }}
    >
      <Icon aria-hidden="true" style={{ width: 13, height: 13 }} />
      {label}
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }}
      />
      {label}
    </span>
  );
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div style={{
      height: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 8,
      background: '#F8FAFC',
      borderRadius: 8,
      border: '1px dashed #E2E8F0',
    }}>
      <BarChart3EmptyIcon />
      <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' as const }}>{label}</p>
    </div>
  );
}

// Simple placeholder icon for empty chart state
function BarChart3EmptyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3"  y="12" width="4" height="9" rx="1" fill="#E2E8F0" />
      <rect x="10" y="7"  width="4" height="14" rx="1" fill="#E2E8F0" />
      <rect x="17" y="4"  width="4" height="17" rx="1" fill="#E2E8F0" />
    </svg>
  );
}
