-- Ledgr Database Schema
-- Run against Neon PostgreSQL

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  industry VARCHAR(100),
  fiscal_year_start VARCHAR(20) DEFAULT 'january',
  coa_template VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  role VARCHAR(20) DEFAULT 'owner',
  status VARCHAR(20) DEFAULT 'active',
  invite_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  sub_type VARCHAR(50),
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  parent_id UUID,
  icon VARCHAR(50),
  color VARCHAR(10),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  account_id UUID,
  category_id UUID,
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule_id UUID,
  ai_categorized BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(5,2),
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  base_amount DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  invoice_number VARCHAR(20) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  base_amount DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  estimate_number VARCHAR(20) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  tax_id VARCHAR(50),
  type VARCHAR(20) DEFAULT 'client',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  category_id VARCHAR(100),
  category_name VARCHAR(255),
  monthly_amount DECIMAL(15,2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  next_date DATE,
  category VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL,
  memo TEXT,
  lines JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(15,2) DEFAULT 0,
  cost_price DECIMAL(15,2) DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  category VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules (auto-categorization)
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  conditions JSONB,
  category_id VARCHAR(100),
  category_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Cache
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scanned Receipts
CREATE TABLE IF NOT EXISTS scanned_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  image_data TEXT,
  extraction JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type VARCHAR(50),
  title TEXT,
  description TEXT,
  severity VARCHAR(20),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mileage
CREATE TABLE IF NOT EXISTS mileage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  miles DECIMAL(10,2) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'business',
  rate_per_mile DECIMAL(5,2) DEFAULT 0.70,
  deduction_amount DECIMAL(10,2),
  is_round_trip BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL,
  client_name VARCHAR(255),
  project_name VARCHAR(255),
  description TEXT,
  hours INTEGER DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  timer_start TIMESTAMPTZ,
  timer_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  po_number VARCHAR(20) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  shipping_address TEXT,
  expected_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (Payroll)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
  pay_type VARCHAR(20) DEFAULT 'salary',
  rate DECIMAL(15,2) DEFAULT 0,
  tax_withholding_pct DECIMAL(5,2) DEFAULT 20,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  pay_period_start DATE,
  pay_period_end DATE,
  run_date DATE,
  entries JSONB DEFAULT '[]',
  total_gross DECIMAL(15,2) DEFAULT 0,
  total_taxes DECIMAL(15,2) DEFAULT 0,
  total_net DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors (1099)
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  tax_id_last4 VARCHAR(4),
  tax_id_type VARCHAR(10) DEFAULT 'SSN',
  payment_terms VARCHAR(50),
  rate DECIMAL(15,2) DEFAULT 0,
  rate_type VARCHAR(20) DEFAULT 'hourly',
  total_paid_ytd DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  client_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  budget DECIMAL(15,2) DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  billing_type VARCHAR(20) DEFAULT 'fixed',
  start_date DATE,
  end_date DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  bill_number VARCHAR(20) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  base_amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'draft',
  bill_date DATE,
  due_date DATE,
  paid_date DATE,
  payment_terms VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite Tokens
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer',
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_mileage_company ON mileage(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_bills_company ON bills(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_contractors_company ON contractors(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
