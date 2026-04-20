"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Invoice } from "@/types";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtShort(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmountParts(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [whole, cents] = s.split(".");
  return { whole, cents: cents ?? "00" };
}

export default function PayInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(true);

  const returnStatus = searchParams.get("status");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/public/invoice/${invoiceId}`);
        if (res.status === 404) {
          setError("Invoice not found");
          return;
        }
        if (!res.ok) throw new Error("Failed to load invoice");
        const data: Invoice = await res.json();
        setInvoice(data);
      } catch {
        setError("Unable to load this invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

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

      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setPaying(false);
    }
  }

  // ── Successful payment return ──
  if (returnStatus === "success") {
    return (
      <div className="pay-wrap">
        <div className="pay-frame" style={{ textAlign: "center", paddingTop: 40 }}>
          <div
            className="stamp-block"
            style={{
              transform: "rotate(-4deg)",
              fontSize: 18,
              padding: "14px 28px",
              borderWidth: 4,
              borderColor: "var(--pencil)",
              color: "var(--pencil)",
              display: "inline-flex",
            }}
          >
            Received
            <span className="sub" style={{ color: "var(--pencil)" }}>
              in full · {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }).replaceAll("/", ".")}
            </span>
          </div>
          <h1 className="display-h1" style={{ marginTop: 32, fontSize: 56 }}>
            Thank you{invoice?.client_name ? ", " : "."}<em>{invoice?.client_name ?? ""}</em>
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--ink-3)", marginTop: 14, lineHeight: 1.5 }}>
            A receipt is on its way{invoice?.client_email ? ` to ${invoice.client_email}` : ""}. All paid up.
          </p>
          {invoice && (
            <div className="receipt" style={{ textAlign: "left", marginTop: 40, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-3)", paddingBottom: 10, borderBottom: "1px dashed var(--ink-3)" }}>
                Receipt
              </div>
              <div className="field-row"><span className="k">Invoice</span><span className="mono">{invoice.invoice_number}</span></div>
              <div className="field-row"><span className="k">Method</span><span className="mono">Card ···· checkout</span></div>
              <div className="field-row total"><span className="k">Paid</span><span className="v">{fmtCurrency(Number(invoice.total))}</span></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pay-wrap">
        <div className="pay-frame" style={{ textAlign: "center", paddingTop: 60 }}>
          <div className="eyebrow-stamp">— Loading —</div>
          <h1 className="display-h1" style={{ marginTop: 16, fontSize: 60 }}>One <em>moment.</em></h1>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="pay-wrap">
        <div className="pay-frame" style={{ textAlign: "center", paddingTop: 60 }}>
          <div className="eyebrow-stamp">— Trouble —</div>
          <h1 className="display-h1" style={{ marginTop: 16, fontSize: 60 }}>Invoice <em>not found.</em></h1>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", marginTop: 18 }}>
            {error ?? "This link may have expired. Please ask for a fresh one."}
          </p>
        </div>
      </div>
    );
  }

  const amount = formatAmountParts(Number(invoice.total));
  const subtotal = Number(invoice.subtotal ?? 0);
  const taxAmt = Number(invoice.tax_amount ?? 0);

  return (
    <div className="pay-wrap">
      <div className="pay-frame">
        <div className="portal-nav" style={{ padding: 0, borderBottom: "none", marginBottom: 32 }}>
          <div className="brand-word" style={{ fontSize: 28 }}>Ledgr</div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            · Secure checkout
          </span>
          <div style={{ flex: 1 }} />
        </div>

        {returnStatus === "cancelled" && (
          <div style={{ border: "1px solid var(--stamp)", padding: "12px 16px", borderRadius: "var(--radius)", marginBottom: 20, background: "var(--stamp-soft)" }}>
            <div className="eyebrow-stamp" style={{ marginBottom: 4 }}>Cancelled</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--stamp-ink)" }}>
              Payment was cancelled. You can try again below.
            </div>
          </div>
        )}

        <div className="eyebrow-stamp">Invoice {invoice.invoice_number}</div>
        <h1 className="display-h1" style={{ marginTop: 8, fontSize: 64 }}>
          ${amount.whole}<span style={{ color: "var(--ink-3)", fontSize: "0.5em" }}>.{amount.cents}</span>
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-3)", marginTop: 6 }}>
          {invoice.client_name} · due {fmtShort(invoice.due_date)}
        </p>

        <div style={{ borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", padding: "16px 0", marginTop: 28 }}>
          {invoice.items?.map((it, i) => (
            <div key={i} className="field-row">
              <span className="k" style={{ fontFamily: "var(--serif)", color: "var(--ink)", textTransform: "none", letterSpacing: 0, fontSize: 14 }}>
                {it.description} <em style={{ color: "var(--ink-3)" }}>× {it.quantity}</em>
              </span>
              <span className="mono">${((it.quantity || 0) * (it.rate || 0)).toFixed(2)}</span>
            </div>
          ))}
          <div className="field-row"><span className="k">Subtotal</span><span className="mono">${subtotal.toFixed(2)}</span></div>
          <div className="field-row"><span className="k">Tax</span><span className="mono">${taxAmt.toFixed(2)}</span></div>
          <div className="field-row total"><span className="k">Total due</span><span className="v">${Number(invoice.total).toFixed(2)}</span></div>
        </div>

        {!stripeAvailable && (
          <div style={{ border: "1px dashed var(--rule)", padding: "14px 18px", marginTop: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Payment unavailable</div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 14 }}>
              Card payments aren't set up yet. Please contact the sender directly.
            </div>
          </div>
        )}

        {error && (
          <div style={{ border: "1px solid var(--stamp)", padding: "10px 14px", marginTop: 20, background: "var(--stamp-soft)" }}>
            <div style={{ fontFamily: "var(--serif)", color: "var(--stamp-ink)", fontStyle: "italic" }}>{error}</div>
          </div>
        )}

        {stripeAvailable && invoice.status !== "paid" && (
          <button
            type="button"
            className="btn stamp lg full"
            style={{ marginTop: 32 }}
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? "Redirecting…" : `Pay ${fmtCurrency(Number(invoice.total))}`}
          </button>
        )}

        {invoice.status === "paid" && (
          <div style={{ marginTop: 36, textAlign: "center" }}>
            <div
              className="stamp-block"
              style={{ borderColor: "var(--pencil)", color: "var(--pencil)", display: "inline-flex" }}
            >
              Paid<span className="sub" style={{ color: "var(--pencil)" }}>in full · {fmtShort(invoice.paid_date)}</span>
            </div>
          </div>
        )}

        <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.16em", textTransform: "uppercase", textAlign: "center", marginTop: 18 }}>
          Secured by Stripe · 256-bit encryption
        </p>
      </div>
    </div>
  );
}
