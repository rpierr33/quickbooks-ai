/**
 * 1099-NEC Form Generator
 *
 * Generates 1099-NEC forms as structured data ready for PDF rendering.
 * For actual PDF generation: npm install @react-pdf/renderer or jspdf
 * For IRS e-filing: Requires authorized e-file provider account (Tax1099.com API, Track1099, or IRS FIRE system)
 *
 * ACTIVATION (PDF): npm install jspdf && uncomment generatePDF function
 * ACTIVATION (e-file): Set TAX1099_API_KEY for Tax1099.com integration
 */

// ── Types ──────────────────────────────────────────────────────

export interface ContractorPayment {
  contractorName: string;
  contractorTIN: string; // SSN or EIN
  contractorAddress: string;
  contractorCity: string;
  contractorState: string;
  contractorZip: string;
  totalPaid: number; // Total nonemployee compensation
  federalTaxWithheld?: number;
  stateTaxWithheld?: number;
  stateIncome?: number;
  payerStateNo?: string;
}

export interface Form1099NEC {
  taxYear: number;
  // Payer (your company) info
  payerName: string;
  payerTIN: string;
  payerAddress: string;
  payerCity: string;
  payerState: string;
  payerZip: string;
  payerPhone: string;
  // Recipient (contractor) info
  recipientName: string;
  recipientTIN: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  // Amounts
  box1_nonemployeeCompensation: number;
  box4_federalTaxWithheld: number;
  box5_stateTaxWithheld: number;
  box6_stateIncome: number;
  box7_payerStateNo: string;
  // Meta
  corrected: boolean;
  void_form: boolean;
}

// ── Functions ──────────────────────────────────────────────────

/**
 * Identify contractors who need 1099-NEC forms
 * IRS rule: Any contractor paid >= $600 in a tax year gets a 1099-NEC
 */
export function identifyContractorsNeedingForms(
  transactions: { description: string; amount: number | string; type: string; date: string; category_name?: string | null }[],
  taxYear: number
): { contractor: string; totalPaid: number; transactionCount: number }[] {
  // Filter to expense transactions that look like contractor payments
  const contractorCategories = ['Professional Services', 'Consulting Revenue', 'Contractor Payments'];
  const yearStr = String(taxYear);

  const contractorTotals = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (!tx.date.startsWith(yearStr)) continue;

    // Heuristic: identify contractor payments by category or description patterns
    const isContractorPayment =
      contractorCategories.includes(tx.category_name || '') ||
      /contractor|freelanc|consult|1099|subcontract/i.test(tx.description);

    if (!isContractorPayment) continue;

    // Extract contractor name from description (before " - ")
    const name = tx.description.split(' - ')[0].trim();
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;

    const existing = contractorTotals.get(name) || { total: 0, count: 0 };
    existing.total += amount;
    existing.count += 1;
    contractorTotals.set(name, existing);
  }

  // Only include contractors paid >= $600 (IRS threshold)
  return Array.from(contractorTotals.entries())
    .filter(([, data]) => data.total >= 600)
    .map(([contractor, data]) => ({
      contractor,
      totalPaid: Math.round(data.total * 100) / 100,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid);
}

/**
 * Generate a 1099-NEC form data object
 */
export function generate1099NEC(
  payer: { name: string; tin: string; address: string; city: string; state: string; zip: string; phone: string },
  contractor: ContractorPayment,
  taxYear: number
): Form1099NEC {
  return {
    taxYear,
    payerName: payer.name,
    payerTIN: payer.tin,
    payerAddress: payer.address,
    payerCity: payer.city,
    payerState: payer.state,
    payerZip: payer.zip,
    payerPhone: payer.phone,
    recipientName: contractor.contractorName,
    recipientTIN: contractor.contractorTIN,
    recipientAddress: contractor.contractorAddress,
    recipientCity: contractor.contractorCity,
    recipientState: contractor.contractorState,
    recipientZip: contractor.contractorZip,
    box1_nonemployeeCompensation: contractor.totalPaid,
    box4_federalTaxWithheld: contractor.federalTaxWithheld || 0,
    box5_stateTaxWithheld: contractor.stateTaxWithheld || 0,
    box6_stateIncome: contractor.stateIncome || contractor.totalPaid,
    box7_payerStateNo: contractor.payerStateNo || '',
    corrected: false,
    void_form: false,
  };
}

/**
 * Generate 1099-NEC as CSV for bulk import into tax filing software
 */
export function export1099sAsCSV(forms: Form1099NEC[]): string {
  const headers = [
    'Tax Year', 'Recipient Name', 'Recipient TIN', 'Recipient Address',
    'City', 'State', 'ZIP', 'Box 1 - Nonemployee Compensation',
    'Box 4 - Federal Tax Withheld', 'Corrected',
  ];
  const rows = forms.map(f => [
    f.taxYear, f.recipientName, f.recipientTIN, f.recipientAddress,
    f.recipientCity, f.recipientState, f.recipientZip,
    f.box1_nonemployeeCompensation.toFixed(2),
    f.box4_federalTaxWithheld.toFixed(2),
    f.corrected ? 'Yes' : 'No',
  ]);
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}

// ── PDF Generation (requires jspdf) ───────────────────────────
// Uncomment after: npm install jspdf
/*
export async function generatePDF(form: Form1099NEC): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('1099-NEC — Nonemployee Compensation', 20, 20);
  doc.setFontSize(10);
  doc.text(`Tax Year: ${form.taxYear}`, 20, 30);

  doc.setFontSize(9);
  doc.text('PAYER:', 20, 45);
  doc.text(form.payerName, 20, 52);
  doc.text(form.payerAddress, 20, 58);
  doc.text(`${form.payerCity}, ${form.payerState} ${form.payerZip}`, 20, 64);
  doc.text(`TIN: ${form.payerTIN}`, 20, 70);

  doc.text('RECIPIENT:', 110, 45);
  doc.text(form.recipientName, 110, 52);
  doc.text(form.recipientAddress, 110, 58);
  doc.text(`${form.recipientCity}, ${form.recipientState} ${form.recipientZip}`, 110, 64);
  doc.text(`TIN: ${form.recipientTIN}`, 110, 70);

  doc.setFontSize(11);
  doc.text(`Box 1 — Nonemployee Compensation: $${form.box1_nonemployeeCompensation.toFixed(2)}`, 20, 90);
  doc.text(`Box 4 — Federal Tax Withheld: $${form.box4_federalTaxWithheld.toFixed(2)}`, 20, 100);

  return Buffer.from(doc.output('arraybuffer'));
}
*/

// ── Tax1099.com e-filing (requires API key) ───────────────────
// Uncomment after: set TAX1099_API_KEY env var
/*
export async function eFile1099(form: Form1099NEC): Promise<{ success: boolean; confirmationId?: string; error?: string }> {
  const apiKey = process.env.TAX1099_API_KEY;
  if (!apiKey) return { success: false, error: 'TAX1099_API_KEY not set' };

  const response = await fetch('https://api.tax1099.com/v2/forms/1099nec', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tax_year: form.taxYear,
      payer: { name: form.payerName, tin: form.payerTIN },
      recipient: { name: form.recipientName, tin: form.recipientTIN },
      amounts: { box1: form.box1_nonemployeeCompensation },
    }),
  });

  const data = await response.json();
  if (!response.ok) return { success: false, error: data.message };
  return { success: true, confirmationId: data.id };
}
*/
