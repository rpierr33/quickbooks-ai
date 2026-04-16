export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  sub_type: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  account_id: string | null;
  category_id: string | null;
  category_name?: string;
  account_name?: string;
  is_recurring: boolean;
  recurring_rule_id: string | null;
  ai_categorized: boolean;
  ai_confidence: number | null;
  notes: string | null;
  attachments: string[];
  currency: string;
  exchange_rate: number;
  base_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'suggestion';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface RuleCondition {
  field: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'greater_than' | 'less_than';
  value: string;
}

export interface RuleAction {
  action: 'set_category' | 'set_type' | 'add_tag';
  value: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  account_id: string | null;
  category_id: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_run: string;
  last_run: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReportData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ProfitLossReport {
  period_start: string;
  period_end: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  income_by_category: { category: string; amount: number }[];
  expenses_by_category: { category: string; amount: number }[];
  monthly_data: ReportData[];
}

export interface BalanceSheetReport {
  as_of: string;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  accounts_by_type: { type: string; accounts: { name: string; balance: number }[] }[];
}

export interface CashFlowReport {
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_change: number;
  monthly_data: { month: string; inflows: number; outflows: number; net: number }[];
}

export interface EstimateItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email: string | null;
  items: EstimateItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIQueryResponse {
  answer: string;
  data?: Record<string, unknown>;
  chart_data?: { label: string; value: number }[];
}

export interface Budget {
  id: string;
  category_id: string;
  category_name: string;
  monthly_amount: number;
  period: string;
  created_at: string;
}

export interface CashFlowForecast {
  current_balance: number;
  forecast_30d: number;
  forecast_60d: number;
  forecast_90d: number;
  monthly_burn_rate: number;
  months_of_runway: number;
  recurring_monthly_cost: number;
  expected_invoice_income: number;
  insights: string[];
}

export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  cash_balance: number;
  income_change: number;
  expense_change: number;
  recent_transactions: Transaction[];
  insights: Insight[];
  monthly_data: ReportData[];
  invoice_overdue: number;
  invoice_paid_30d: number;
  /** Total transactions for this company — used by the Getting Started checklist */
  transaction_count?: number;
  /** Total invoices for this company — used by the Getting Started checklist */
  invoice_count?: number;
}

// ── Clients / Vendors ──
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  tax_id: string | null;
  type: 'client' | 'vendor' | 'both';
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Aged Receivables ──
export interface AgedReceivablesBucket {
  label: string;
  total: number;
  clients: { name: string; amount: number; invoice_count: number }[];
}

export interface AgedReceivablesReport {
  as_of: string;
  total_outstanding: number;
  buckets: AgedReceivablesBucket[];
}

// ── Trial Balance ──
export interface TrialBalanceRow {
  account_id: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  as_of: string;
  rows: TrialBalanceRow[];
  total_debits: number;
  total_credits: number;
}

// ── Tax Summary ──
export interface TaxSummaryReport {
  period_start: string;
  period_end: string;
  taxable_income: number;
  total_deductions: number;
  estimated_tax_liability: number;
  effective_rate: number;
  deductions_by_category: { category: string; amount: number; is_deductible: boolean }[];
  quarterly: { quarter: string; income: number; expenses: number; estimated_tax: number }[];
}

// ── General Ledger ──
export interface GeneralLedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerAccount {
  account_id: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
  entries: GeneralLedgerEntry[];
  closing_balance: number;
}

export interface GeneralLedgerReport {
  period_start: string;
  period_end: string;
  accounts: GeneralLedgerAccount[];
}

// ── Journal Entry (API-persisted) ──
export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  memo: string;
  lines: JournalLine[];
  created_at: string;
}

// ── Receipt / Invoice Scanner ──
export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface ReceiptExtraction {
  vendor: string;
  date: string;
  amount: number;
  tax: number;
  tip: number;
  subtotal: number;
  currency: string;
  category: string;
  payment_method: string | null;
  line_items: ReceiptLineItem[];
  notes: string | null;
}

export interface ScannedReceipt {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  extraction: ReceiptExtraction;
  confidence: number;
  status: 'scanned' | 'confirmed' | 'saved';
  transaction_id: string | null;
  created_at: string;
}

// ── Bills / Accounts Payable ──
export interface BillItem {
  description: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_email: string | null;
  items: BillItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  bill_date: string;
  due_date: string | null;
  paid_date: string | null;
  payment_terms: 'net15' | 'net30' | 'net60' | 'net90' | 'due_on_receipt';
  notes: string | null;
  scheduled_payment_date: string | null;
  created_at: string;
  updated_at: string;
}
