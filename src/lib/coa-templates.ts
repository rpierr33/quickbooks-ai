/**
 * Chart of Accounts templates.
 *
 * Each template provides a complete starting set of accounts and
 * transaction categories for a specific business type.
 *
 * Rules:
 *  - account.type must be one of the Account.type values in types/index.ts
 *  - category.type must be 'income' | 'expense'
 *  - balance starts at 0 (DECIMAL-safe: stored as string "0.00")
 *  - ids are intentionally left empty here — callers must inject
 *    crypto.randomUUID() and company_id before persisting
 */

export interface TemplateAccount {
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  sub_type: string | null;
}

export interface TemplateCategory {
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
}

export interface TemplateData {
  accounts: TemplateAccount[];
  categories: TemplateCategory[];
}

// ─── Standard Business ────────────────────────────────────────────────────────
const STANDARD: TemplateData = {
  accounts: [
    // Assets
    { name: "Business Checking", type: "asset", sub_type: "bank" },
    { name: "Business Savings", type: "asset", sub_type: "bank" },
    { name: "Accounts Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Petty Cash", type: "asset", sub_type: "cash" },
    { name: "Prepaid Expenses", type: "asset", sub_type: "other_asset" },
    // Liabilities
    { name: "Accounts Payable", type: "liability", sub_type: "accounts_payable" },
    { name: "Credit Card", type: "liability", sub_type: "credit_card" },
    { name: "Sales Tax Payable", type: "liability", sub_type: "other_liability" },
    { name: "Loan Payable", type: "liability", sub_type: "other_liability" },
    // Equity
    { name: "Owner's Equity", type: "equity", sub_type: "owner_equity" },
    { name: "Retained Earnings", type: "equity", sub_type: "retained_earnings" },
    { name: "Owner's Draw", type: "equity", sub_type: "owner_equity" },
    // Revenue
    { name: "Sales Revenue", type: "revenue", sub_type: null },
    { name: "Service Revenue", type: "revenue", sub_type: null },
    { name: "Interest Income", type: "revenue", sub_type: null },
    { name: "Other Income", type: "revenue", sub_type: null },
    // Expenses
    { name: "Rent", type: "expense", sub_type: null },
    { name: "Utilities", type: "expense", sub_type: null },
    { name: "Payroll", type: "expense", sub_type: null },
    { name: "Insurance", type: "expense", sub_type: null },
    { name: "Office Supplies", type: "expense", sub_type: null },
    { name: "Marketing", type: "expense", sub_type: null },
    { name: "Software & SaaS", type: "expense", sub_type: null },
    { name: "Travel", type: "expense", sub_type: null },
    { name: "Meals & Entertainment", type: "expense", sub_type: null },
    { name: "Professional Services", type: "expense", sub_type: null },
    { name: "Depreciation", type: "expense", sub_type: null },
    { name: "Miscellaneous", type: "expense", sub_type: null },
  ],
  categories: [
    { name: "Rent", type: "expense", icon: "Building2", color: "#EF4444" },
    { name: "Utilities", type: "expense", icon: "Zap", color: "#F59E0B" },
    { name: "Payroll", type: "expense", icon: "Users", color: "#8B5CF6" },
    { name: "Insurance", type: "expense", icon: "Shield", color: "#64748B" },
    { name: "Office Supplies", type: "expense", icon: "Package", color: "#14B8A6" },
    { name: "Marketing", type: "expense", icon: "Megaphone", color: "#EC4899" },
    { name: "Software & SaaS", type: "expense", icon: "Monitor", color: "#6366F1" },
    { name: "Travel", type: "expense", icon: "Plane", color: "#0EA5E9" },
    { name: "Meals & Entertainment", type: "expense", icon: "UtensilsCrossed", color: "#F97316" },
    { name: "Professional Services", type: "expense", icon: "Briefcase", color: "#A855F7" },
    { name: "Sales Revenue", type: "income", icon: "ShoppingCart", color: "#06B6D4" },
    { name: "Service Revenue", type: "income", icon: "TrendingUp", color: "#10B981" },
    { name: "Interest Income", type: "income", icon: "Percent", color: "#84CC16" },
    { name: "Other Income", type: "income", icon: "DollarSign", color: "#22C55E" },
  ],
};

// ─── Service Business ─────────────────────────────────────────────────────────
const SERVICE: TemplateData = {
  accounts: [
    // Assets
    { name: "Business Checking", type: "asset", sub_type: "bank" },
    { name: "Accounts Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Prepaid Expenses", type: "asset", sub_type: "other_asset" },
    // Liabilities
    { name: "Accounts Payable", type: "liability", sub_type: "accounts_payable" },
    { name: "Credit Card", type: "liability", sub_type: "credit_card" },
    { name: "Sales Tax Payable", type: "liability", sub_type: "other_liability" },
    // Equity
    { name: "Owner's Equity", type: "equity", sub_type: "owner_equity" },
    { name: "Retained Earnings", type: "equity", sub_type: "retained_earnings" },
    // Revenue
    { name: "Service Revenue", type: "revenue", sub_type: null },
    { name: "Consulting Revenue", type: "revenue", sub_type: null },
    { name: "Project Revenue", type: "revenue", sub_type: null },
    { name: "Retainer Revenue", type: "revenue", sub_type: null },
    // Expenses
    { name: "Subcontractor Costs", type: "expense", sub_type: null },
    { name: "Software & Tools", type: "expense", sub_type: null },
    { name: "Office Supplies", type: "expense", sub_type: null },
    { name: "Travel", type: "expense", sub_type: null },
    { name: "Marketing", type: "expense", sub_type: null },
    { name: "Professional Development", type: "expense", sub_type: null },
    { name: "Insurance", type: "expense", sub_type: null },
    { name: "Rent", type: "expense", sub_type: null },
    { name: "Utilities", type: "expense", sub_type: null },
  ],
  categories: [
    { name: "Subcontractors", type: "expense", icon: "UserPlus", color: "#8B5CF6" },
    { name: "Software & Tools", type: "expense", icon: "Monitor", color: "#6366F1" },
    { name: "Office Supplies", type: "expense", icon: "Package", color: "#14B8A6" },
    { name: "Travel", type: "expense", icon: "Plane", color: "#0EA5E9" },
    { name: "Marketing", type: "expense", icon: "Megaphone", color: "#EC4899" },
    { name: "Professional Development", type: "expense", icon: "BookOpen", color: "#F59E0B" },
    { name: "Insurance", type: "expense", icon: "Shield", color: "#64748B" },
    { name: "Consulting Revenue", type: "income", icon: "TrendingUp", color: "#10B981" },
    { name: "Project Revenue", type: "income", icon: "Briefcase", color: "#A855F7" },
    { name: "Retainer Revenue", type: "income", icon: "RefreshCw", color: "#22C55E" },
  ],
};

// ─── Retail / E-commerce ──────────────────────────────────────────────────────
const RETAIL: TemplateData = {
  accounts: [
    // Assets
    { name: "Business Checking", type: "asset", sub_type: "bank" },
    { name: "Accounts Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Inventory", type: "asset", sub_type: "other_asset" },
    { name: "Prepaid Expenses", type: "asset", sub_type: "other_asset" },
    // Liabilities
    { name: "Accounts Payable", type: "liability", sub_type: "accounts_payable" },
    { name: "Credit Card", type: "liability", sub_type: "credit_card" },
    { name: "Sales Tax Payable", type: "liability", sub_type: "other_liability" },
    { name: "Loan Payable", type: "liability", sub_type: "other_liability" },
    // Equity
    { name: "Owner's Equity", type: "equity", sub_type: "owner_equity" },
    { name: "Retained Earnings", type: "equity", sub_type: "retained_earnings" },
    // Revenue
    { name: "Product Sales", type: "revenue", sub_type: null },
    { name: "Shipping Revenue", type: "revenue", sub_type: null },
    { name: "Returns & Refunds", type: "revenue", sub_type: null },
    // Expenses
    { name: "Cost of Goods Sold", type: "expense", sub_type: null },
    { name: "Shipping & Fulfillment", type: "expense", sub_type: null },
    { name: "Packaging", type: "expense", sub_type: null },
    { name: "Rent", type: "expense", sub_type: null },
    { name: "Utilities", type: "expense", sub_type: null },
    { name: "Marketing", type: "expense", sub_type: null },
    { name: "Payroll", type: "expense", sub_type: null },
    { name: "Software & SaaS", type: "expense", sub_type: null },
    { name: "Insurance", type: "expense", sub_type: null },
  ],
  categories: [
    { name: "Cost of Goods Sold", type: "expense", icon: "Package", color: "#EF4444" },
    { name: "Shipping & Fulfillment", type: "expense", icon: "Truck", color: "#F97316" },
    { name: "Packaging", type: "expense", icon: "Box", color: "#F59E0B" },
    { name: "Marketing", type: "expense", icon: "Megaphone", color: "#EC4899" },
    { name: "Payroll", type: "expense", icon: "Users", color: "#8B5CF6" },
    { name: "Software & SaaS", type: "expense", icon: "Monitor", color: "#6366F1" },
    { name: "Rent", type: "expense", icon: "Building2", color: "#64748B" },
    { name: "Product Sales", type: "income", icon: "ShoppingCart", color: "#06B6D4" },
    { name: "Shipping Revenue", type: "income", icon: "Truck", color: "#22C55E" },
  ],
};

// ─── Nonprofit ────────────────────────────────────────────────────────────────
const NONPROFIT: TemplateData = {
  accounts: [
    // Assets
    { name: "Operating Checking", type: "asset", sub_type: "bank" },
    { name: "Savings", type: "asset", sub_type: "bank" },
    { name: "Grants Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Pledges Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Prepaid Expenses", type: "asset", sub_type: "other_asset" },
    // Liabilities
    { name: "Accounts Payable", type: "liability", sub_type: "accounts_payable" },
    { name: "Accrued Expenses", type: "liability", sub_type: "other_liability" },
    { name: "Deferred Revenue", type: "liability", sub_type: "other_liability" },
    // Net Assets (Equity)
    { name: "Unrestricted Net Assets", type: "equity", sub_type: "retained_earnings" },
    { name: "Temporarily Restricted", type: "equity", sub_type: "retained_earnings" },
    { name: "Permanently Restricted", type: "equity", sub_type: "retained_earnings" },
    // Revenue
    { name: "Individual Donations", type: "revenue", sub_type: null },
    { name: "Corporate Donations", type: "revenue", sub_type: null },
    { name: "Grants", type: "revenue", sub_type: null },
    { name: "Program Fees", type: "revenue", sub_type: null },
    { name: "Fundraising Events", type: "revenue", sub_type: null },
    // Expenses
    { name: "Program Expenses", type: "expense", sub_type: null },
    { name: "Salaries & Benefits", type: "expense", sub_type: null },
    { name: "Occupancy", type: "expense", sub_type: null },
    { name: "Office & Admin", type: "expense", sub_type: null },
    { name: "Fundraising Costs", type: "expense", sub_type: null },
    { name: "Professional Services", type: "expense", sub_type: null },
    { name: "Travel", type: "expense", sub_type: null },
  ],
  categories: [
    { name: "Program Expenses", type: "expense", icon: "Heart", color: "#EF4444" },
    { name: "Salaries & Benefits", type: "expense", icon: "Users", color: "#8B5CF6" },
    { name: "Occupancy", type: "expense", icon: "Building2", color: "#64748B" },
    { name: "Office & Admin", type: "expense", icon: "Package", color: "#14B8A6" },
    { name: "Fundraising Costs", type: "expense", icon: "Megaphone", color: "#EC4899" },
    { name: "Professional Services", type: "expense", icon: "Briefcase", color: "#A855F7" },
    { name: "Travel", type: "expense", icon: "Plane", color: "#0EA5E9" },
    { name: "Individual Donations", type: "income", icon: "DollarSign", color: "#22C55E" },
    { name: "Corporate Donations", type: "income", icon: "Building2", color: "#10B981" },
    { name: "Grants", type: "income", icon: "Award", color: "#06B6D4" },
    { name: "Program Fees", type: "income", icon: "TrendingUp", color: "#84CC16" },
    { name: "Fundraising Events", type: "income", icon: "Calendar", color: "#F59E0B" },
  ],
};

// ─── Custom (minimal scaffold) ────────────────────────────────────────────────
const CUSTOM: TemplateData = {
  accounts: [
    { name: "Business Checking", type: "asset", sub_type: "bank" },
    { name: "Accounts Receivable", type: "asset", sub_type: "accounts_receivable" },
    { name: "Accounts Payable", type: "liability", sub_type: "accounts_payable" },
    { name: "Owner's Equity", type: "equity", sub_type: "owner_equity" },
    { name: "Revenue", type: "revenue", sub_type: null },
    { name: "General Expenses", type: "expense", sub_type: null },
  ],
  categories: [
    { name: "Revenue", type: "income", icon: "DollarSign", color: "#22C55E" },
    { name: "General Expenses", type: "expense", icon: "Package", color: "#64748B" },
  ],
};

const TEMPLATES: Record<string, TemplateData> = {
  standard: STANDARD,
  service: SERVICE,
  retail: RETAIL,
  nonprofit: NONPROFIT,
  custom: CUSTOM,
};

/**
 * Return the accounts and categories for a given template ID.
 * Falls back to "standard" if the templateId is unrecognized.
 */
export function getTemplateData(templateId: string): TemplateData {
  return TEMPLATES[templateId] ?? TEMPLATES.standard;
}
