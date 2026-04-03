/**
 * Invoice PDF Generator
 * Uses the browser's print-to-PDF via a hidden iframe with styled HTML.
 * No external dependencies needed.
 */

interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_email?: string | null;
  items: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  status: string;
  due_date?: string | null;
  created_at: string;
  notes?: string | null;
}

function fmt(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildInvoiceHTML(invoice: InvoiceData, companyName = 'My Business'): string {
  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

  const itemRows = items.map((item: { description: string; quantity: number; rate: number; amount: number }) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:center;color:#64748B;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;color:#64748B;">${fmt(item.rate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-weight:600;color:#0F172A;">${fmt(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; color:#0F172A; background:#fff; padding:48px; }
    @media print { body { padding:32px; } @page { margin:0.5in; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#9333EA);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;font-weight:800;color:#fff;">L</span>
        </div>
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">Ledgr</span>
      </div>
      <p style="font-size:13px;color:#64748B;margin-top:4px;">${companyName}</p>
    </div>
    <div style="text-align:right;">
      <h1 style="font-size:28px;font-weight:800;color:#7C3AED;letter-spacing:-0.02em;">INVOICE</h1>
      <p style="font-size:14px;font-weight:600;color:#0F172A;margin-top:4px;">${invoice.invoice_number}</p>
      <p style="font-size:12px;color:#94A3B8;margin-top:2px;">Issued: ${fmtDate(invoice.created_at)}</p>
      ${invoice.due_date ? `<p style="font-size:12px;color:#94A3B8;">Due: ${fmtDate(invoice.due_date)}</p>` : ''}
    </div>
  </div>

  <!-- Bill To -->
  <div style="margin-bottom:32px;padding:16px 20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
    <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;margin-bottom:6px;">Bill To</p>
    <p style="font-size:15px;font-weight:600;color:#0F172A;">${invoice.client_name}</p>
    ${invoice.client_email ? `<p style="font-size:12px;color:#64748B;margin-top:2px;">${invoice.client_email}</p>` : ''}
  </div>

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#F8FAFC;">
        <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;border-bottom:2px solid #E2E8F0;">Description</th>
        <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;border-bottom:2px solid #E2E8F0;width:80px;">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;border-bottom:2px solid #E2E8F0;width:100px;">Rate</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;border-bottom:2px solid #E2E8F0;width:120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
        <span style="color:#64748B;">Subtotal</span>
        <span style="font-weight:600;color:#0F172A;">${fmt(invoice.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #E2E8F0;">
        <span style="color:#64748B;">Tax (${typeof invoice.tax_rate === 'string' ? parseFloat(invoice.tax_rate) : invoice.tax_rate}%)</span>
        <span style="font-weight:600;color:#0F172A;">${fmt(invoice.tax_amount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:800;">
        <span style="color:#0F172A;">Total</span>
        <span style="color:#7C3AED;">${fmt(invoice.total)}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `
  <div style="margin-top:32px;padding:16px 20px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
    <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;margin-bottom:6px;">Notes</p>
    <p style="font-size:13px;color:#475569;line-height:1.6;">${invoice.notes}</p>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #E2E8F0;text-align:center;">
    <p style="font-size:11px;color:#94A3B8;">Generated by Ledgr — Smart Accounting</p>
  </div>
</body>
</html>`;
}

export function downloadInvoicePDF(invoice: InvoiceData, companyName?: string): void {
  const html = buildInvoiceHTML(invoice, companyName);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for fonts to load, then trigger print
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
