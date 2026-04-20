"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { GettingStartedChecklist } from "@/components/ui/getting-started-checklist";
import { ProductTour } from "@/components/ui/product-tour";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats, CashFlowForecast } from "@/types";

type DashboardStatsExt = DashboardStats & {
  bills_due_soon?: number;
  unreconciled_count?: number;
  invoice_outstanding?: number;
  invoice_overdue_count?: number;
  invoice_outstanding_count?: number;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function monthOfNow() {
  return new Date().toLocaleDateString("en-US", { month: "long" });
}

function formatMoneyParts(n: number) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [whole, cents] = s.split(".");
  return { neg, whole, cents };
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="animate-shimmer" style={{ height: 120 }} />
      <div className="animate-shimmer" style={{ height: 260 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="animate-shimmer" style={{ height: 96 }} />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const { data, isLoading, isError } = useQuery<DashboardStatsExt>({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("Dashboard data unavailable");
        return r.json();
      }),
  });

  const { data: forecast } = useQuery<CashFlowForecast>({
    queryKey: ["forecast"],
    queryFn: () => fetch("/api/ai/forecast").then((r) => r.json()),
    retry: false,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="empty" style={{ padding: "60px 20px" }}>
        <div className="eyebrow-stamp" style={{ marginBottom: 12 }}>Dashboard</div>
        <h1 className="h1">Couldn't load your data</h1>
        <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", marginTop: 14 }}>
          Check your connection and refresh.
        </p>
      </div>
    );
  }

  const incomeChange = data.income_change ?? 0;
  const expenseChange = data.expense_change ?? 0;

  const attention: { mark: string; title: string; sub: string; href: string; tone?: "warn" | "info" }[] = [];
  if ((data.invoice_overdue ?? 0) > 0) {
    attention.push({
      mark: "1",
      title: `Overdue receivable${(data.invoice_overdue ?? 0) > 1 ? "s" : ""}`,
      sub: `${formatCurrency(data.invoice_overdue ?? 0)} outstanding`,
      href: "/invoices",
    });
  }
  if ((data.bills_due_soon ?? 0) > 0) {
    attention.push({
      mark: String(attention.length + 1),
      title: "Bills due soon",
      sub: `${formatCurrency(data.bills_due_soon ?? 0)} on the horizon`,
      href: "/bills",
      tone: "warn",
    });
  }
  if ((data.unreconciled_count ?? 0) > 0) {
    attention.push({
      mark: String(attention.length + 1),
      title: `${data.unreconciled_count} unreconciled entries`,
      sub: "Match against your bank statement",
      href: "/reconciliation",
      tone: "info",
    });
  }

  const months = data.monthly_data ?? [];
  const maxBar = Math.max(1, ...months.map((m) => Math.max(m.income ?? 0, m.expenses ?? 0)));

  const txns = (data.recent_transactions ?? []).slice(0, 7);
  const insights = (data.insights ?? []).slice(0, 4);
  const cash = formatMoneyParts(data.cash_balance ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="dash-head" data-tour="welcome-bar">
        <div>
          <div className="eyebrow-stamp">{monthOfNow()} overview</div>
          <h1 className="display-h1" style={{ marginTop: 10 }}>
            {greeting()},<br /><em>{firstName}.</em>
          </h1>
        </div>
        <div className="folio-block">
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      {(data.transaction_count ?? 0) === 0 && (
        <div style={{ marginBottom: 24 }}>
          <GettingStartedChecklist
            hasTransactions={(data.transaction_count ?? 0) > 0}
            hasInvoices={(data.invoice_count ?? 0) > 0}
            hasVisitedReports={false}
          />
        </div>
      )}

      {/* Hero */}
      <div className="hero-grid" data-tour="kpi-cards">
        <div className="hero-balance">
          <div className="label">Cash on hand — all accounts</div>
          <div className="hero-num">
            <span className="cur">US$</span>
            {cash.neg && "−"}{Number(cash.whole).toLocaleString()}<span className="cents">.{cash.cents}</span>
          </div>
          <div className="hero-foot">
            {incomeChange !== 0 && (
              <span>
                <span className={incomeChange >= 0 ? "delta-up" : "delta-dn"}>
                  {incomeChange >= 0 ? "↑" : "↓"} {Math.abs(incomeChange)}%
                </span> revenue vs. last period
              </span>
            )}
            {forecast && forecast.months_of_runway < 999 && (
              <span>Runway <b>{forecast.months_of_runway} months</b></span>
            )}
            <span style={{ color: "var(--ink-4)" }}>Updated just now</span>
          </div>
        </div>

        <div className="attention-col">
          <div className="eyebrow-stamp">Needs attention</div>
          <h3>{attention.length === 0 ? "All clear." : `${attention.length} ${attention.length === 1 ? "item" : "items"}`}</h3>
          {attention.length === 0 ? (
            <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", fontSize: 14, lineHeight: 1.5 }}>
              Nothing overdue. Books look tidy.
            </p>
          ) : (
            <div>
              {attention.map((a, i) => (
                <Link key={i} href={a.href} className="attention-item">
                  <span className={"mark " + (a.tone ?? "")}>{a.mark}</span>
                  <span>
                    <div className="title">{a.title}</div>
                    <div className="sub">{a.sub}</div>
                  </span>
                  <span className="amt">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="summary-strip" style={{ marginTop: 28 }}>
        <Link href="/transactions?type=income" className="cell">
          <div className="label">Revenue · {monthOfNow()}</div>
          <div className="n">{formatCurrency(data.total_income ?? 0)}</div>
          <div className="delta">
            {incomeChange >= 0 ? "↑" : "↓"} {Math.abs(incomeChange)}% vs. prior
          </div>
        </Link>
        <Link href="/transactions?type=expense" className="cell">
          <div className="label">Expenses · {monthOfNow()}</div>
          <div className="n">{formatCurrency(data.total_expenses ?? 0)}</div>
          <div className="delta">
            {expenseChange >= 0 ? "↑" : "↓"} {Math.abs(expenseChange)}% vs. prior
          </div>
        </Link>
        <div className="cell" style={{ cursor: "default" }}>
          <div className="label">Net profit</div>
          <div className="n">{formatCurrency(data.net_profit ?? 0)}</div>
          <div className="delta">
            {data.total_income > 0 ? Math.round(((data.net_profit ?? 0) / data.total_income) * 100) : 0}% margin
          </div>
        </div>
        <Link href="/invoices" className="cell">
          <div className="label">Receivable</div>
          <div className="n">{formatCurrency((data.invoice_overdue ?? 0) + (data.invoice_outstanding ?? 0))}</div>
          <div className="delta">
            {data.invoice_overdue_count ?? 0} overdue
          </div>
        </Link>
      </div>

      {/* Chart */}
      <div className="chart-section" data-tour="chart-row">
        <div className="chart-head">
          <div>
            <div className="eyebrow-stamp" style={{ marginBottom: 6 }}>12 months</div>
            <h3>Revenue &amp; <em>expenses</em></h3>
          </div>
          <div style={{ display: "flex", gap: 20, fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ink)", marginRight: 6, verticalAlign: "middle", borderRadius: 2 }} />
              Revenue
            </span>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "var(--stamp)", opacity: 0.7, marginRight: 6, verticalAlign: "middle", borderRadius: 2 }} />
              Expenses
            </span>
          </div>
        </div>
        {months.length === 0 ? (
          <div className="empty">No monthly data yet. Add transactions to see trends.</div>
        ) : (
          <div className="bar-chart">
            {months.map((m, i) => {
              const rev = m.income ?? 0;
              const exp = m.expenses ?? 0;
              const label = String(m.period ?? "").slice(0, 3);
              return (
                <button
                  key={i}
                  className="bar-col"
                  onClick={() => router.push("/transactions")}
                  aria-label={`${label}: revenue ${formatCurrency(rev)}, expenses ${formatCurrency(exp)}`}
                >
                  <div className="stack">
                    <div className="bar" style={{ height: `${(rev / maxBar) * 100}%` }} />
                    <div className="bar exp" style={{ height: `${(exp / maxBar) * 100}%` }} />
                  </div>
                  <div className="mo">{label}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-column: recent + insights */}
      <div className="insights-section">
        <div>
          <div className="section-head">
            <div className="kicker">Recent activity</div>
            <h2>Latest <em>entries</em></h2>
          </div>
          {txns.length === 0 ? (
            <div className="empty">No entries yet.</div>
          ) : (
            <div className="lcard" style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 110px 110px", padding: "12px 16px", fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", borderBottom: "1px solid var(--rule)", background: "var(--paper-3)", fontWeight: 500 }}>
                <span>Date</span>
                <span>Description</span>
                <span style={{ textAlign: "right" }}>Debit</span>
                <span style={{ textAlign: "right" }}>Credit</span>
              </div>
              {txns.map((t, i) => {
                const amt = Number(t.amount) || 0;
                const isDebit = t.type === "expense";
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 110px 110px",
                      padding: "12px 16px",
                      borderBottom: i < txns.length - 1 ? "1px solid var(--rule)" : "none",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
                      {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                    </span>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)" }}>
                      {t.description}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, textAlign: "right", color: isDebit ? "var(--stamp)" : "var(--ink-4)" }}>
                      {isDebit ? amt.toFixed(2) : "—"}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, textAlign: "right", color: !isDebit ? "var(--pencil)" : "var(--ink-4)" }}>
                      {!isDebit ? amt.toFixed(2) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/transactions" className="btn ghost" style={{ marginTop: 14 }}>
            See all transactions →
          </Link>
        </div>

        <div data-tour="ai-insights">
          <div className="section-head">
            <div className="kicker">Ledgr insights</div>
            <h2>Worth <em>noting</em></h2>
          </div>
          {insights.length === 0 ? (
            <div className="empty">Add more transactions and I'll surface insights here.</div>
          ) : (
            <div>
              {insights.map((ins, i) => {
                const href =
                  ins.type === "anomaly" ? "/transactions"
                  : ins.type === "suggestion" ? "/ai"
                  : "/reports";
                return (
                  <Link key={ins.id ?? i} href={href} className="insight-item">
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <div className="title">{ins.title}</div>
                      <div className="sub">{ins.description}</div>
                    </span>
                    <span className="arr">→</span>
                  </Link>
                );
              })}
            </div>
          )}
          <Link href="/ai" className="btn" style={{ marginTop: 16 }}>
            Ask Ledgr →
          </Link>
        </div>
      </div>

      {/* Cash flow forecast */}
      {forecast && forecast.insights && forecast.insights.length > 0 && (
        <div style={{ padding: "32px 0", borderBottom: "1px solid var(--rule)" }}>
          <div className="eyebrow-stamp" style={{ marginBottom: 6 }}>Projection</div>
          <h2 className="h2" style={{ marginBottom: 20 }}>Cash flow <em>forecast</em></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "30 days", value: forecast.forecast_30d },
              { label: "60 days", value: forecast.forecast_60d },
              { label: "90 days", value: forecast.forecast_90d },
            ].map((p) => (
              <div key={p.label} className="lcard" style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginBottom: 10 }}>
                  {p.label}
                </div>
                <div style={{ fontFamily: "var(--display)", fontSize: 32, lineHeight: 1, letterSpacing: "-0.02em", color: p.value >= 0 ? "var(--ink)" : "var(--stamp)" }}>
                  {formatCurrency(p.value)}
                </div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
                  {p.value >= forecast.current_balance ? "↑" : "↓"} {formatCurrency(Math.abs(p.value - forecast.current_balance))} from now
                </div>
              </div>
            ))}
          </div>
          <div className="lcard" style={{ padding: "16px 20px" }}>
            {forecast.insights.slice(0, 2).map((ins, i) => (
              <div key={i} style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", padding: "8px 0", borderBottom: i === 0 && forecast.insights.length > 1 ? "1px solid var(--rule)" : "none", lineHeight: 1.5 }}>
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      <ProductTour
        tourId="dashboard"
        delay={1200}
        steps={[
          { element: '[data-tour="welcome-bar"]', popover: { title: "Welcome to Ledgr", description: "Your dashboard — greeting, key stats, what needs attention, all at a glance.", side: "bottom" } },
          { element: '[data-tour="kpi-cards"]', popover: { title: "Cash on hand", description: "The headline number — what's in every account right now.", side: "bottom" } },
          { element: '[data-tour="chart-row"]', popover: { title: "Revenue vs expenses", description: "Twelve months at a glance. Click any bar to drill in.", side: "top" } },
          { element: '[data-tour="ai-insights"]', popover: { title: "Ledgr insights", description: "Anomalies, trends, and suggestions Ledgr has surfaced from your data.", side: "left" } },
        ]}
      />
    </div>
  );
}
