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

export interface AIQueryResponse {
  answer: string;
  data?: Record<string, unknown>;
  chart_data?: { label: string; value: number }[];
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
}
