import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Public API — no auth required.
 * clientId is a URL-safe base64 encoded client name (or email).
 * Returns public-safe invoice/payment data for a client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    // Decode the client identifier (base64url → plain string)
    let clientName: string;
    try {
      clientName = Buffer.from(
        clientId.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8");
    } catch {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    if (!clientName || clientName.length > 300) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // Fetch invoices for this client (case-insensitive match on name or email)
    const result = await query(
      "SELECT * FROM invoices ORDER BY created_at DESC"
    );

    const allInvoices = result.rows;

    // Match by client_name (case-insensitive) or client_email
    const clientInvoices = allInvoices.filter(
      (inv) =>
        (inv.client_name &&
          inv.client_name.toLowerCase() === clientName.toLowerCase()) ||
        (inv.client_email &&
          inv.client_email.toLowerCase() === clientName.toLowerCase())
    );

    if (clientInvoices.length === 0) {
      // Return empty state — not a 404, client portal may be bookmarked before invoices exist
      return NextResponse.json({
        client: { name: clientName, email: null },
        invoices: [],
        summary: { total_outstanding: 0, total_paid: 0, invoice_count: 0 },
      });
    }

    // Build public-safe response — strip internal fields
    const invoices = clientInvoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      created_at: inv.created_at,
      due_date: inv.due_date ?? null,
      status: inv.status,
      total: parseFloat(inv.total),
      paid_date: inv.paid_date ?? null,
    }));

    // Resolve client name/email from first matching invoice
    const firstMatch = clientInvoices[0];
    const client = {
      name: firstMatch.client_name,
      email: firstMatch.client_email ?? null,
    };

    // Calculate summary
    const summary = invoices.reduce(
      (acc, inv) => {
        acc.invoice_count += 1;
        if (inv.status === "paid") {
          acc.total_paid += inv.total;
        } else if (inv.status !== "draft") {
          acc.total_outstanding += inv.total;
        }
        return acc;
      },
      { total_outstanding: 0, total_paid: 0, invoice_count: 0 }
    );

    return NextResponse.json({ client, invoices, summary });
  } catch (error) {
    console.error("portal.GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load portal" },
      { status: 500 }
    );
  }
}
