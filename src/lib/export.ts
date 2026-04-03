/**
 * CSV export utility for financial data
 */

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val == null ? '' : String(val);
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactions(transactions: {
  date: string;
  description: string;
  amount: number | string;
  type: string;
  category_name?: string | null;
}[]) {
  const data = transactions.map(tx => ({
    Date: tx.date,
    Description: tx.description,
    Category: tx.category_name || '',
    Amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
    Type: tx.type,
  }));
  downloadCSV(data, `ledgr-transactions-${new Date().toISOString().split('T')[0]}`);
}

export function exportInvoices(invoices: {
  invoice_number: string;
  client_name: string;
  total: number | string;
  status: string;
  due_date?: string | null;
}[]) {
  const data = invoices.map(inv => ({
    'Invoice #': inv.invoice_number,
    Client: inv.client_name,
    Total: typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total,
    Status: inv.status,
    'Due Date': inv.due_date || '',
  }));
  downloadCSV(data, `ledgr-invoices-${new Date().toISOString().split('T')[0]}`);
}

export function exportReport(reportData: Record<string, unknown>[], reportName: string) {
  downloadCSV(reportData, `ledgr-${reportName}-${new Date().toISOString().split('T')[0]}`);
}
