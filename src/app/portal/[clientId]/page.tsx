"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PortalInvoice {
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
  invoices: PortalInvoice[];
  summary: {
    total_outstanding: number;
    total_paid: number;
    invoice_count: number;
  };
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const outstanding = data?.invoices.filter((i) => i.status !== "paid" && i.status !== "draft") ?? [];
  const paid = data?.invoices.filter((i) => i.status === "paid") ?? [];

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-wrap" style={{ textAlign: "center", padding: "120px 24px" }}>
          <div className="eyebrow-stamp">— Loading —</div>
          <h1 className="display-h1" style={{ marginTop: 16 }}>One <em>moment.</em></h1>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="portal-page">
        <div className="portal-wrap" style={{ textAlign: "center", padding: "120px 24px" }}>
          <div className="eyebrow-stamp">— Trouble —</div>
          <h1 className="display-h1" style={{ marginTop: 16 }}>Couldn't <em>open the portal.</em></h1>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", marginTop: 18 }}>
            {error ?? "Please try again, or reach out for a fresh link."}
          </p>
        </div>
      </div>
    );
  }

  const firstInvoice = outstanding[0];

  return (
    <div className="portal-page">
      <div className="portal-nav">
        <div className="brand-word" style={{ fontSize: 28 }}>Ledgr</div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          · Client portal · {data.client.name}
        </span>
        <div style={{ flex: 1 }} />
      </div>

      <div className="portal-wrap">
        <div className="eyebrow-stamp">Billed to</div>
        <h1 className="display-h1" style={{ marginTop: 10 }}>Hello, <em>{data.client.name}</em></h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--ink-3)", maxWidth: "58ch", marginTop: 14, lineHeight: 1.5 }}>
          Everything we have on your account — past, present, outstanding. Pay what's open in a few clicks.
        </p>

        <div className="summary-strip" style={{ marginTop: 40 }}>
          <div className="cell" style={{ cursor: "default" }}>
            <div className="label">Due now</div>
            <div className="n" style={{ color: data.summary.total_outstanding > 0 ? "var(--stamp)" : "var(--ink)" }}>
              {fmtCurrency(data.summary.total_outstanding)}
            </div>
            <div className="delta">{outstanding.length} invoice{outstanding.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="cell" style={{ cursor: "default" }}>
            <div className="label">Paid YTD</div>
            <div className="n" style={{ color: "var(--pencil)" }}>{fmtCurrency(data.summary.total_paid)}</div>
            <div className="delta">{paid.length} invoice{paid.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="cell" style={{ cursor: "default" }}>
            <div className="label">Next reminder</div>
            <div className="n" style={{ fontSize: 28 }}>
              {firstInvoice?.due_date ? fmtShort(firstInvoice.due_date) : "—"}
            </div>
            <div className="delta">If unpaid</div>
          </div>
          <div className="cell" style={{ cursor: "default" }}>
            <div className="label">Contact</div>
            <div className="n" style={{ fontSize: 20, fontFamily: "var(--serif)", fontStyle: "italic" }}>{data.client.email ?? "—"}</div>
            <div className="delta">For questions</div>
          </div>
        </div>

        {outstanding.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div className="eyebrow-stamp" style={{ marginBottom: 10 }}>Your invoices</div>
            <h2 className="h2">Outstanding</h2>
            <div className="inv-grid" style={{ marginTop: 20 }}>
              {outstanding.map((inv) => (
                <a
                  key={inv.id}
                  href={`/pay/${inv.id}`}
                  className={"inv-cell " + inv.status}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div className="inv-id">{inv.invoice_number}</div>
                        <div className="client" style={{ fontSize: 22 }}>Invoice</div>
                      </div>
                      {inv.status === "overdue" && <div className="stamp-block">Overdue</div>}
                    </div>
                  </div>
                  <div>
                    <div className="amount"><span className="c">$</span>{Number(inv.total).toLocaleString()}</div>
                    <div className="due">
                      Due {fmtShort(inv.due_date)} · <b style={{ color: "var(--stamp)" }}>Pay now →</b>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {paid.length > 0 && (
          <>
            <h2 className="h2" style={{ marginTop: 48 }}>Paid</h2>
            <div style={{ borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", marginTop: 14 }}>
              {paid.map((inv) => (
                <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px 120px", padding: "14px 0", borderBottom: "1px dotted var(--rule)", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>{inv.invoice_number}</span>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 15 }}>Invoice</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--pencil)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Paid {fmtShort(inv.paid_date)}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 14, textAlign: "right" }}>${Number(inv.total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {outstanding.length === 0 && paid.length === 0 && (
          <div className="empty" style={{ marginTop: 40 }}>
            Nothing on the books yet.
          </div>
        )}

        <div style={{ marginTop: 48, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center", paddingTop: 32, borderTop: "1px solid var(--rule)" }}>
          Powered by Ledgr
        </div>
      </div>
    </div>
  );
}
