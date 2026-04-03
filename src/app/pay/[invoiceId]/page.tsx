"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Invoice } from "@/types";

// ---------- Inline styles (no sidebar/header — public page) ----------

const styles = {
  page: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 9999,
    background: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    overflowY: "auto" as const,
  } as React.CSSProperties,
  container: {
    width: "100%",
    maxWidth: 520,
  } as React.CSSProperties,
  logo: {
    textAlign: "center" as const,
    marginBottom: 32,
  } as React.CSSProperties,
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: "#7C3AED",
    letterSpacing: "-0.04em",
  } as React.CSSProperties,
  logoSub: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  } as React.CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(226,232,240,0.8)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
    overflow: "hidden",
  } as React.CSSProperties,
  cardHeader: {
    padding: "28px 28px 0",
  } as React.CSSProperties,
  cardBody: {
    padding: "20px 28px 28px",
  } as React.CSSProperties,
  invoiceLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#94A3B8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  } as React.CSSProperties,
  clientName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0F172A",
    marginTop: 4,
  } as React.CSSProperties,
  divider: {
    height: 1,
    background: "#E2E8F0",
    margin: "20px 0",
  } as React.CSSProperties,
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "8px 0",
    fontSize: 14,
    color: "#334155",
  } as React.CSSProperties,
  itemDesc: {
    flex: 1,
    paddingRight: 12,
  } as React.CSSProperties,
  itemAmount: {
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  itemQty: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  } as React.CSSProperties,
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#64748B",
    padding: "4px 0",
  } as React.CSSProperties,
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 18,
    fontWeight: 700,
    color: "#0F172A",
    padding: "8px 0 0",
  } as React.CSSProperties,
  payButton: {
    display: "block",
    width: "100%",
    padding: "14px 24px",
    background: "#7C3AED",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 24,
    transition: "background 0.2s",
    fontFamily: "inherit",
  } as React.CSSProperties,
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  } as React.CSSProperties,
  successBanner: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "#166534",
  } as React.CSSProperties,
  cancelBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 500,
    color: "#991B1B",
  } as React.CSSProperties,
  setupNotice: {
    background: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: 12,
    padding: "16px 20px",
    marginTop: 20,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#92400E",
  } as React.CSSProperties,
  skeleton: {
    background: "#E2E8F0",
    borderRadius: 8,
    animation: "pulse 1.5s ease-in-out infinite",
  } as React.CSSProperties,
  errorCard: {
    textAlign: "center" as const,
    padding: "48px 28px",
    color: "#64748B",
    fontSize: 15,
  } as React.CSSProperties,
};

// ---------- Helpers ----------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    paid: { bg: "#DCFCE7", color: "#166534" },
    sent: { bg: "#DBEAFE", color: "#1E40AF" },
    draft: { bg: "#F1F5F9", color: "#475569" },
    overdue: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{ ...styles.badge, background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

// ---------- Component ----------

export default function PayInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(true);

  const returnStatus = searchParams.get("status"); // "success" or "cancelled"

  // Fetch invoice on mount
  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("Failed to load invoices");
        const invoices: Invoice[] = await res.json();
        const found = invoices.find((inv) => inv.id === invoiceId);
        if (!found) {
          setError("Invoice not found");
        } else {
          setInvoice(found);
        }
      } catch {
        setError("Unable to load invoice. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

  // Pay handler — creates a Checkout Session and redirects
  async function handlePay() {
    if (!invoice) return;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_checkout",
          invoiceId: invoice.id,
          amount: invoice.total,
          clientName: invoice.client_name,
          clientEmail: invoice.client_email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setStripeAvailable(false);
          return;
        }
        throw new Error(data.error || "Payment request failed");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setPaying(false);
    }
  }

  // ── Render ──

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoText}>Ledgr</div>
          <div style={styles.logoSub}>Secure Invoice Payment</div>
        </div>

        {/* Return status banners */}
        {returnStatus === "success" && (
          <div style={styles.successBanner}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-1 15l-5-5 1.41-1.41L9 12.17l6.59-6.59L17 7l-8 8z" fill="#16A34A"/>
            </svg>
            Payment received. Thank you!
          </div>
        )}
        {returnStatus === "cancelled" && (
          <div style={styles.cancelBanner}>
            Payment was cancelled. You can try again below.
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={styles.card}>
            <div style={{ padding: 28 }}>
              <div style={{ ...styles.skeleton, width: 120, height: 14, marginBottom: 12 }} />
              <div style={{ ...styles.skeleton, width: 200, height: 22, marginBottom: 24 }} />
              <div style={{ ...styles.skeleton, width: "100%", height: 14, marginBottom: 8 }} />
              <div style={{ ...styles.skeleton, width: "80%", height: 14, marginBottom: 8 }} />
              <div style={{ ...styles.skeleton, width: "60%", height: 14 }} />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && !invoice && (
          <div style={styles.card}>
            <div style={styles.errorCard}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#CBD5E1"/>
                </svg>
              </div>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        {!loading && invoice && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={styles.invoiceLabel}>{invoice.invoice_number}</div>
                  <div style={styles.clientName}>{invoice.client_name}</div>
                </div>
                {statusBadge(invoice.status)}
              </div>
              {invoice.due_date && (
                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>
                  Due {new Date(invoice.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>

            <div style={styles.cardBody}>
              <div style={styles.divider} />

              {/* Line items */}
              {invoice.items.map((item, i) => (
                <div key={i} style={styles.itemRow}>
                  <div style={styles.itemDesc}>
                    <div>{item.description}</div>
                    <div style={styles.itemQty}>
                      {item.quantity} x {formatCurrency(item.rate)}
                    </div>
                  </div>
                  <div style={styles.itemAmount}>{formatCurrency(item.amount)}</div>
                </div>
              ))}

              <div style={styles.divider} />

              {/* Totals */}
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div style={styles.summaryRow}>
                  <span>Tax ({invoice.tax_rate}%)</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 16, lineHeight: 1.5 }}>
                  {invoice.notes}
                </div>
              )}

              {/* Pay button — only show if not already paid */}
              {invoice.status === "paid" || returnStatus === "success" ? (
                <div style={{ ...styles.successBanner, marginTop: 24, marginBottom: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-1 15l-5-5 1.41-1.41L9 12.17l6.59-6.59L17 7l-8 8z" fill="#16A34A"/>
                  </svg>
                  This invoice has been paid
                </div>
              ) : stripeAvailable ? (
                <>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    style={{
                      ...styles.payButton,
                      ...(paying ? styles.disabledButton : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (!paying) (e.target as HTMLButtonElement).style.background = "#6D28D9";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = "#7C3AED";
                    }}
                  >
                    {paying ? "Redirecting..." : `Pay ${formatCurrency(invoice.total)}`}
                  </button>
                  {error && (
                    <div style={{ color: "#DC2626", fontSize: 13, marginTop: 10, textAlign: "center" }}>
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.setupNotice}>
                  <strong>Online payments are not yet configured.</strong>
                  <br />
                  The business owner needs to set <code>STRIPE_SECRET_KEY</code> and{" "}
                  <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> environment variables to enable
                  Stripe payments.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#94A3B8" }}>
          Powered by Ledgr &middot; Payments secured by Stripe
        </div>
      </div>

      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
