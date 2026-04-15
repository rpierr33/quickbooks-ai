"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  due_date: string | null;
  status: string;
  total: number;
  paid_date: string | null;
}

interface PortalData {
  client: { name: string; email: string | null };
  invoices: Invoice[];
  summary: {
    total_outstanding: number;
    total_paid: number;
    invoice_count: number;
  };
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: "#ECFDF5", color: "#059669", label: "Paid" },
  sent: { bg: "#EFF6FF", color: "#2563EB", label: "Sent" },
  draft: { bg: "#F1F5F9", color: "#64748B", label: "Draft" },
  overdue: { bg: "#FEF2F2", color: "#DC2626", label: "Overdue" },
  partial: { bg: "#FFFBEB", color: "#D97706", label: "Partial" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 99,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export default function ClientPortalPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/portal/${clientId}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error ?? "Failed to load"));
        return r.json();
      })
      .then((d: PortalData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(typeof err === "string" ? err : "Unable to load your portal");
        setLoading(false);
      });
  }, [clientId]);

  // Separate outstanding vs paid invoices
  const outstanding = data?.invoices.filter((i) => i.status !== "paid" && i.status !== "draft") ?? [];
  const paid = data?.invoices.filter((i) => i.status === "paid") ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#0F172A",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          height: 60,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>L</span>
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#F8FAFC",
            letterSpacing: "-0.01em",
          }}
        >
          Ledgr
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#475569",
            marginLeft: 4,
          }}
        >
          Client Portal
        </span>
      </header>

      <main
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "32px 16px 64px",
        }}
      >
        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              marginTop: 80,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #E2E8F0",
                borderTopColor: "#3B82F6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: 14, color: "#94A3B8" }}>Loading your invoices...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 80,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Unable to load portal</p>
            <p style={{ fontSize: 14, color: "#64748B" }}>{error}</p>
          </div>
        )}

        {/* Portal content */}
        {data && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Client header */}
            <div>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>Welcome back,</p>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                  marginBottom: 2,
                }}
              >
                {data.client.name}
              </h1>
              {data.client.email && (
                <p style={{ fontSize: 13, color: "#64748B" }}>{data.client.email}</p>
              )}
            </div>

            {/* Summary cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {/* Outstanding */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginBottom: 8 }}>
                  OUTSTANDING BALANCE
                </p>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: data.summary.total_outstanding > 0 ? "#DC2626" : "#059669",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmtCurrency(data.summary.total_outstanding)}
                </p>
              </div>

              {/* Paid */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginBottom: 8 }}>
                  TOTAL PAID
                </p>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#059669",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmtCurrency(data.summary.total_paid)}
                </p>
              </div>

              {/* Invoice count */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginBottom: 8 }}>
                  TOTAL INVOICES
                </p>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {data.summary.invoice_count}
                </p>
              </div>
            </div>

            {/* Outstanding invoices */}
            {outstanding.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#DC2626",
                    }}
                  />
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                    Outstanding Invoices
                  </h2>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: "#FEF2F2",
                      color: "#DC2626",
                    }}
                  >
                    {outstanding.length}
                  </span>
                </div>
                {/* Mobile outstanding list */}
                <div className="md:hidden">
                  {outstanding.map((inv, i) => (
                    <div key={inv.id} style={{ padding: "14px 16px", borderBottom: i < outstanding.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{inv.invoice_number}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                            {fmtDate(inv.created_at)}
                            {inv.due_date && <span style={{ color: new Date(inv.due_date) < new Date() ? "#DC2626" : "#64748B" }}> · Due {fmtDate(inv.due_date)}</span>}
                          </p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{fmtCurrency(inv.total)}</p>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={`/pay?invoice=${inv.id}`}
                          style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", padding: "8px 16px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
                        >
                          Pay Now
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop outstanding table */}
                <div className="hidden md:block" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        <th style={thStyle}>Invoice #</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Due</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Status</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>
                              {inv.invoice_number}
                            </span>
                          </td>
                          <td style={tdStyle}>{fmtDate(inv.created_at)}</td>
                          <td style={{ ...tdStyle, color: inv.due_date && new Date(inv.due_date) < new Date() ? "#DC2626" : "#64748B" }}>
                            {inv.due_date ? fmtDate(inv.due_date) : "—"}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            {fmtCurrency(inv.total)}
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={inv.status} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <a
                              href={`/pay?invoice=${inv.id}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#FFFFFF",
                                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                padding: "6px 14px",
                                borderRadius: 8,
                                textDecoration: "none",
                                display: "inline-block",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Pay Now
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment history */}
            {paid.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#059669",
                    }}
                  />
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                    Payment History
                  </h2>
                </div>
                {/* Mobile paid list */}
                <div className="md:hidden">
                  {paid.map((inv, i) => (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: i < paid.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{inv.invoice_number}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {fmtDate(inv.created_at)}
                          {inv.paid_date && <span style={{ color: "#059669" }}> · Paid {fmtDate(inv.paid_date)}</span>}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#059669", flexShrink: 0 }}>{fmtCurrency(inv.total)}</span>
                    </div>
                  ))}
                </div>
                {/* Desktop paid table */}
                <div className="hidden md:block" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 400 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        <th style={thStyle}>Invoice #</th>
                        <th style={thStyle}>Invoice Date</th>
                        <th style={thStyle}>Paid Date</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paid.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>
                              {inv.invoice_number}
                            </span>
                          </td>
                          <td style={tdStyle}>{fmtDate(inv.created_at)}</td>
                          <td style={tdStyle}>
                            {inv.paid_date ? fmtDate(inv.paid_date) : "—"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "#059669" }}>
                            {fmtCurrency(inv.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {data.invoices.length === 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
                  No invoices yet
                </p>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  Invoices sent to you will appear here.
                </p>
              </div>
            )}

            {/* Footer */}
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#CBD5E1",
                marginTop: 8,
              }}
            >
              Powered by Ledgr — Smart Accounting
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#64748B",
  borderBottom: "1px solid #E2E8F0",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "#475569",
  whiteSpace: "nowrap",
};
