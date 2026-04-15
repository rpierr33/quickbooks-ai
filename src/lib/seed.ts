// Seed data for mock development mode
// Generates 6 months of realistic small business financial data

function uuid(index: number): string {
  const hex = index.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

export function seedMockStore() {
  // ── Accounts ──────────────────────────────────────────────
  const accounts = [
    { id: uuid(1), name: 'Business Checking', type: 'asset', sub_type: 'bank', balance: '47250.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(2), name: 'Business Savings', type: 'asset', sub_type: 'bank', balance: '25000.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(3), name: 'Chase Ink Credit Card', type: 'liability', sub_type: 'credit_card', balance: '3842.50', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(4), name: 'Accounts Receivable', type: 'asset', sub_type: 'accounts_receivable', balance: '18500.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(5), name: 'Accounts Payable', type: 'liability', sub_type: 'accounts_payable', balance: '4200.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(6), name: 'Owner Equity', type: 'equity', sub_type: 'owner_equity', balance: '50000.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(7), name: 'Retained Earnings', type: 'equity', sub_type: 'retained_earnings', balance: '32450.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
    { id: uuid(8), name: 'Petty Cash', type: 'asset', sub_type: 'cash', balance: '350.00', currency: 'USD', is_active: true, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-03-23T00:00:00Z' },
  ];

  // ── Categories ────────────────────────────────────────────
  const categories = [
    { id: uuid(101), name: 'Rent', type: 'expense', parent_id: null, icon: 'Building2', color: '#EF4444', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(102), name: 'Utilities', type: 'expense', parent_id: null, icon: 'Zap', color: '#F59E0B', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(103), name: 'Payroll', type: 'expense', parent_id: null, icon: 'Users', color: '#8B5CF6', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(104), name: 'Marketing', type: 'expense', parent_id: null, icon: 'Megaphone', color: '#EC4899', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(105), name: 'Software & SaaS', type: 'expense', parent_id: null, icon: 'Monitor', color: '#6366F1', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(106), name: 'Office Supplies', type: 'expense', parent_id: null, icon: 'Package', color: '#14B8A6', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(107), name: 'Travel', type: 'expense', parent_id: null, icon: 'Plane', color: '#0EA5E9', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(108), name: 'Meals & Entertainment', type: 'expense', parent_id: null, icon: 'UtensilsCrossed', color: '#F97316', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(109), name: 'Insurance', type: 'expense', parent_id: null, icon: 'Shield', color: '#64748B', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(110), name: 'Professional Services', type: 'expense', parent_id: null, icon: 'Briefcase', color: '#A855F7', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(111), name: 'Client Payments', type: 'income', parent_id: null, icon: 'DollarSign', color: '#22C55E', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(112), name: 'Consulting Revenue', type: 'income', parent_id: null, icon: 'TrendingUp', color: '#10B981', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(113), name: 'Product Sales', type: 'income', parent_id: null, icon: 'ShoppingCart', color: '#06B6D4', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(114), name: 'Interest Income', type: 'income', parent_id: null, icon: 'Percent', color: '#84CC16', is_system: true, created_at: '2025-09-01T00:00:00Z' },
    { id: uuid(115), name: 'Refunds', type: 'income', parent_id: null, icon: 'RotateCcw', color: '#78716C', is_system: false, created_at: '2025-09-01T00:00:00Z' },
  ];

  // ── Transactions (60+ spanning Oct 2025 - Mar 2026) ───────
  const transactions = [
    // ── October 2025 ──
    { id: uuid(201), date: '2025-10-01', description: 'Office Rent - October', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2025-10-01T09:00:00Z', updated_at: '2025-10-01T09:00:00Z' },
    { id: uuid(202), date: '2025-10-02', description: 'Gusto Payroll - Oct Period 1', amount: '8500.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-10-02T10:00:00Z', updated_at: '2025-10-02T10:00:00Z' },
    { id: uuid(203), date: '2025-10-03', description: 'Payment from Acme Corp - Website Redesign', amount: '12000.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'Invoice #INV-001', attachments: '[]', created_at: '2025-10-03T14:00:00Z', updated_at: '2025-10-03T14:00:00Z' },
    { id: uuid(204), date: '2025-10-05', description: 'AWS Monthly - Cloud Hosting', amount: '487.32', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2025-10-05T08:00:00Z', updated_at: '2025-10-05T08:00:00Z' },
    { id: uuid(205), date: '2025-10-07', description: 'Starbucks - Team Meeting', amount: '34.50', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.88', notes: null, attachments: '[]', created_at: '2025-10-07T11:30:00Z', updated_at: '2025-10-07T11:30:00Z' },
    { id: uuid(206), date: '2025-10-10', description: 'Google Ads - October Campaign', amount: '1200.00', type: 'expense', account_id: uuid(3), category_id: uuid(104), category_name: 'Marketing', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.95', notes: 'Q4 lead gen campaign', attachments: '[]', created_at: '2025-10-10T09:00:00Z', updated_at: '2025-10-10T09:00:00Z' },
    { id: uuid(207), date: '2025-10-12', description: 'ConEd - Electric Bill', amount: '245.80', type: 'expense', account_id: uuid(1), category_id: uuid(102), category_name: 'Utilities', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: null, attachments: '[]', created_at: '2025-10-12T08:00:00Z', updated_at: '2025-10-12T08:00:00Z' },
    { id: uuid(208), date: '2025-10-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-10-15T10:00:00Z', updated_at: '2025-10-15T10:00:00Z' },
    { id: uuid(209), date: '2025-10-18', description: 'Amazon - Office Chair & Supplies', amount: '389.99', type: 'expense', account_id: uuid(3), category_id: uuid(106), category_name: 'Office Supplies', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.78', notes: null, attachments: '[]', created_at: '2025-10-18T15:00:00Z', updated_at: '2025-10-18T15:00:00Z' },
    { id: uuid(210), date: '2025-10-22', description: 'Slack Business+ Subscription', amount: '125.00', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.91', notes: null, attachments: '[]', created_at: '2025-10-22T08:00:00Z', updated_at: '2025-10-22T08:00:00Z' },

    // ── November 2025 ──
    { id: uuid(211), date: '2025-11-01', description: 'Office Rent - November', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2025-11-01T09:00:00Z', updated_at: '2025-11-01T09:00:00Z' },
    { id: uuid(212), date: '2025-11-02', description: 'Gusto Payroll - Nov Period 1', amount: '8500.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-11-02T10:00:00Z', updated_at: '2025-11-02T10:00:00Z' },
    { id: uuid(213), date: '2025-11-04', description: 'Payment from Bright Ideas LLC - App Development', amount: '8500.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'Phase 1 milestone payment', attachments: '[]', created_at: '2025-11-04T11:00:00Z', updated_at: '2025-11-04T11:00:00Z' },
    { id: uuid(214), date: '2025-11-05', description: 'AWS Monthly - Cloud Hosting', amount: '512.18', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2025-11-05T08:00:00Z', updated_at: '2025-11-05T08:00:00Z' },
    { id: uuid(215), date: '2025-11-08', description: 'Uber - Client Meeting Downtown', amount: '28.45', type: 'expense', account_id: uuid(3), category_id: uuid(107), category_name: 'Travel', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.85', notes: null, attachments: '[]', created_at: '2025-11-08T14:00:00Z', updated_at: '2025-11-08T14:00:00Z' },
    { id: uuid(216), date: '2025-11-10', description: 'State Farm - Business Insurance Premium', amount: '475.00', type: 'expense', account_id: uuid(1), category_id: uuid(109), category_name: 'Insurance', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(502), ai_categorized: false, ai_confidence: null, notes: 'Monthly premium', attachments: '[]', created_at: '2025-11-10T09:00:00Z', updated_at: '2025-11-10T09:00:00Z' },
    { id: uuid(217), date: '2025-11-12', description: 'Chipotle - Team Lunch', amount: '67.80', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.82', notes: null, attachments: '[]', created_at: '2025-11-12T12:30:00Z', updated_at: '2025-11-12T12:30:00Z' },
    { id: uuid(218), date: '2025-11-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-11-15T10:00:00Z', updated_at: '2025-11-15T10:00:00Z' },
    { id: uuid(219), date: '2025-11-18', description: 'Facebook Ads - Holiday Campaign', amount: '1800.00', type: 'expense', account_id: uuid(3), category_id: uuid(104), category_name: 'Marketing', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.93', notes: 'Holiday promo push', attachments: '[]', created_at: '2025-11-18T09:00:00Z', updated_at: '2025-11-18T09:00:00Z' },
    { id: uuid(220), date: '2025-11-20', description: 'Figma - Team Plan', amount: '75.00', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: uuid(503), ai_categorized: true, ai_confidence: '0.89', notes: null, attachments: '[]', created_at: '2025-11-20T08:00:00Z', updated_at: '2025-11-20T08:00:00Z' },
    { id: uuid(221), date: '2025-11-25', description: 'Interest Income - Business Savings', amount: '42.15', type: 'income', account_id: uuid(2), category_id: uuid(114), category_name: 'Interest Income', account_name: 'Business Savings', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-11-25T08:00:00Z', updated_at: '2025-11-25T08:00:00Z' },

    // ── December 2025 ──
    { id: uuid(222), date: '2025-12-01', description: 'Office Rent - December', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2025-12-01T09:00:00Z', updated_at: '2025-12-01T09:00:00Z' },
    { id: uuid(223), date: '2025-12-02', description: 'Gusto Payroll - Dec Period 1', amount: '8500.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-12-02T10:00:00Z', updated_at: '2025-12-02T10:00:00Z' },
    { id: uuid(224), date: '2025-12-03', description: 'Payment from GreenLeaf Co - Brand Strategy', amount: '7500.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'Final payment', attachments: '[]', created_at: '2025-12-03T15:00:00Z', updated_at: '2025-12-03T15:00:00Z' },
    { id: uuid(225), date: '2025-12-05', description: 'AWS Monthly - Cloud Hosting', amount: '534.90', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2025-12-05T08:00:00Z', updated_at: '2025-12-05T08:00:00Z' },
    { id: uuid(226), date: '2025-12-07', description: 'Starbucks - Client Coffee', amount: '18.75', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.88', notes: null, attachments: '[]', created_at: '2025-12-07T10:00:00Z', updated_at: '2025-12-07T10:00:00Z' },
    { id: uuid(227), date: '2025-12-10', description: 'State Farm - Business Insurance Premium', amount: '475.00', type: 'expense', account_id: uuid(1), category_id: uuid(109), category_name: 'Insurance', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(502), ai_categorized: false, ai_confidence: null, notes: 'Monthly premium', attachments: '[]', created_at: '2025-12-10T09:00:00Z', updated_at: '2025-12-10T09:00:00Z' },
    { id: uuid(228), date: '2025-12-12', description: 'ConEd - Electric Bill', amount: '312.45', type: 'expense', account_id: uuid(1), category_id: uuid(102), category_name: 'Utilities', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: 'Winter heating increase', attachments: '[]', created_at: '2025-12-12T08:00:00Z', updated_at: '2025-12-12T08:00:00Z' },
    { id: uuid(229), date: '2025-12-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-12-15T10:00:00Z', updated_at: '2025-12-15T10:00:00Z' },
    { id: uuid(230), date: '2025-12-16', description: 'Gusto Payroll - Dec Period 2', amount: '8500.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-12-16T10:00:00Z', updated_at: '2025-12-16T10:00:00Z' },
    { id: uuid(231), date: '2025-12-18', description: 'Amazon - Printer Paper & Toner', amount: '124.50', type: 'expense', account_id: uuid(3), category_id: uuid(106), category_name: 'Office Supplies', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.80', notes: null, attachments: '[]', created_at: '2025-12-18T11:00:00Z', updated_at: '2025-12-18T11:00:00Z' },
    { id: uuid(232), date: '2025-12-20', description: 'Product Sale - Template Bundle', amount: '299.00', type: 'income', account_id: uuid(1), category_id: uuid(113), category_name: 'Product Sales', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.77', notes: null, attachments: '[]', created_at: '2025-12-20T16:00:00Z', updated_at: '2025-12-20T16:00:00Z' },
    { id: uuid(233), date: '2025-12-22', description: 'Holiday Team Dinner - Nobu', amount: '485.00', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.75', notes: 'Holiday party', attachments: '[]', created_at: '2025-12-22T20:00:00Z', updated_at: '2025-12-22T20:00:00Z' },
    { id: uuid(234), date: '2025-12-28', description: 'Interest Income - Business Savings', amount: '44.30', type: 'income', account_id: uuid(2), category_id: uuid(114), category_name: 'Interest Income', account_name: 'Business Savings', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2025-12-28T08:00:00Z', updated_at: '2025-12-28T08:00:00Z' },

    // ── January 2026 ──
    { id: uuid(235), date: '2026-01-01', description: 'Office Rent - January', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2026-01-01T09:00:00Z', updated_at: '2026-01-01T09:00:00Z' },
    { id: uuid(236), date: '2026-01-02', description: 'Gusto Payroll - Jan Period 1', amount: '8750.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'New year raise adjustments', attachments: '[]', created_at: '2026-01-02T10:00:00Z', updated_at: '2026-01-02T10:00:00Z' },
    { id: uuid(237), date: '2026-01-05', description: 'AWS Monthly - Cloud Hosting', amount: '498.55', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2026-01-05T08:00:00Z', updated_at: '2026-01-05T08:00:00Z' },
    { id: uuid(238), date: '2026-01-07', description: 'Payment from Acme Corp - Maintenance Contract', amount: '3500.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'Q1 maintenance', attachments: '[]', created_at: '2026-01-07T14:00:00Z', updated_at: '2026-01-07T14:00:00Z' },
    { id: uuid(239), date: '2026-01-08', description: 'Staples - Office Supplies', amount: '156.30', type: 'expense', account_id: uuid(3), category_id: uuid(106), category_name: 'Office Supplies', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.82', notes: null, attachments: '[]', created_at: '2026-01-08T13:00:00Z', updated_at: '2026-01-08T13:00:00Z' },
    { id: uuid(240), date: '2026-01-10', description: 'State Farm - Business Insurance Premium', amount: '475.00', type: 'expense', account_id: uuid(1), category_id: uuid(109), category_name: 'Insurance', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(502), ai_categorized: false, ai_confidence: null, notes: 'Monthly premium', attachments: '[]', created_at: '2026-01-10T09:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
    { id: uuid(241), date: '2026-01-12', description: 'Google Ads - January Campaign', amount: '950.00', type: 'expense', account_id: uuid(3), category_id: uuid(104), category_name: 'Marketing', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.95', notes: null, attachments: '[]', created_at: '2026-01-12T09:00:00Z', updated_at: '2026-01-12T09:00:00Z' },
    { id: uuid(242), date: '2026-01-14', description: 'DoorDash - Working Lunch', amount: '42.90', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.84', notes: null, attachments: '[]', created_at: '2026-01-14T12:00:00Z', updated_at: '2026-01-14T12:00:00Z' },
    { id: uuid(243), date: '2026-01-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
    { id: uuid(244), date: '2026-01-18', description: 'CPA Tax Prep - Quarterly Filing', amount: '850.00', type: 'expense', account_id: uuid(1), category_id: uuid(110), category_name: 'Professional Services', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.87', notes: 'Q4 2025 quarterly taxes', attachments: '[]', created_at: '2026-01-18T10:00:00Z', updated_at: '2026-01-18T10:00:00Z' },
    { id: uuid(245), date: '2026-01-20', description: 'Notion - Team Workspace', amount: '96.00', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: null, attachments: '[]', created_at: '2026-01-20T08:00:00Z', updated_at: '2026-01-20T08:00:00Z' },
    { id: uuid(246), date: '2026-01-22', description: 'ConEd - Electric Bill', amount: '298.60', type: 'expense', account_id: uuid(1), category_id: uuid(102), category_name: 'Utilities', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: null, attachments: '[]', created_at: '2026-01-22T08:00:00Z', updated_at: '2026-01-22T08:00:00Z' },
    { id: uuid(247), date: '2026-01-25', description: 'Product Sale - UI Kit License', amount: '149.00', type: 'income', account_id: uuid(1), category_id: uuid(113), category_name: 'Product Sales', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.78', notes: null, attachments: '[]', created_at: '2026-01-25T14:00:00Z', updated_at: '2026-01-25T14:00:00Z' },
    { id: uuid(248), date: '2026-01-28', description: 'Interest Income - Business Savings', amount: '45.80', type: 'income', account_id: uuid(2), category_id: uuid(114), category_name: 'Interest Income', account_name: 'Business Savings', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-01-28T08:00:00Z', updated_at: '2026-01-28T08:00:00Z' },

    // ── February 2026 ──
    { id: uuid(249), date: '2026-02-01', description: 'Office Rent - February', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
    { id: uuid(250), date: '2026-02-02', description: 'Gusto Payroll - Feb Period 1', amount: '8750.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-02-02T10:00:00Z', updated_at: '2026-02-02T10:00:00Z' },
    { id: uuid(251), date: '2026-02-04', description: 'Payment from Bright Ideas LLC - App Development Phase 2', amount: '10000.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: 'Phase 2 milestone', attachments: '[]', created_at: '2026-02-04T11:00:00Z', updated_at: '2026-02-04T11:00:00Z' },
    { id: uuid(252), date: '2026-02-05', description: 'AWS Monthly - Cloud Hosting', amount: '523.40', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2026-02-05T08:00:00Z', updated_at: '2026-02-05T08:00:00Z' },
    { id: uuid(253), date: '2026-02-07', description: 'Delta Airlines - NYC to Chicago', amount: '387.00', type: 'expense', account_id: uuid(3), category_id: uuid(107), category_name: 'Travel', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.91', notes: 'Client meeting travel', attachments: '[]', created_at: '2026-02-07T07:00:00Z', updated_at: '2026-02-07T07:00:00Z' },
    { id: uuid(254), date: '2026-02-08', description: 'Hilton Chicago - 2 Night Stay', amount: '456.00', type: 'expense', account_id: uuid(3), category_id: uuid(107), category_name: 'Travel', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.88', notes: 'Client meeting hotel', attachments: '[]', created_at: '2026-02-08T15:00:00Z', updated_at: '2026-02-08T15:00:00Z' },
    { id: uuid(255), date: '2026-02-10', description: 'State Farm - Business Insurance Premium', amount: '475.00', type: 'expense', account_id: uuid(1), category_id: uuid(109), category_name: 'Insurance', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(502), ai_categorized: false, ai_confidence: null, notes: 'Monthly premium', attachments: '[]', created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
    { id: uuid(256), date: '2026-02-12', description: 'Restaurant Depot - Team Lunch Supplies', amount: '89.50', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.72', notes: null, attachments: '[]', created_at: '2026-02-12T12:00:00Z', updated_at: '2026-02-12T12:00:00Z' },
    { id: uuid(257), date: '2026-02-14', description: 'ConEd - Electric Bill', amount: '275.30', type: 'expense', account_id: uuid(1), category_id: uuid(102), category_name: 'Utilities', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: null, attachments: '[]', created_at: '2026-02-14T08:00:00Z', updated_at: '2026-02-14T08:00:00Z' },
    { id: uuid(258), date: '2026-02-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-15T10:00:00Z' },
    { id: uuid(259), date: '2026-02-18', description: 'Meta Ads - February Campaign', amount: '1450.00', type: 'expense', account_id: uuid(3), category_id: uuid(104), category_name: 'Marketing', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.94', notes: null, attachments: '[]', created_at: '2026-02-18T09:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
    { id: uuid(260), date: '2026-02-20', description: 'Figma - Team Plan', amount: '75.00', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: uuid(503), ai_categorized: true, ai_confidence: '0.89', notes: null, attachments: '[]', created_at: '2026-02-20T08:00:00Z', updated_at: '2026-02-20T08:00:00Z' },
    { id: uuid(261), date: '2026-02-22', description: 'Amazon - Webcams & Headsets', amount: '234.80', type: 'expense', account_id: uuid(3), category_id: uuid(106), category_name: 'Office Supplies', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.76', notes: 'Remote work equipment', attachments: '[]', created_at: '2026-02-22T14:00:00Z', updated_at: '2026-02-22T14:00:00Z' },
    { id: uuid(262), date: '2026-02-25', description: 'Refund - Unused Software License', amount: '199.00', type: 'income', account_id: uuid(1), category_id: uuid(115), category_name: 'Refunds', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.85', notes: 'Canceled annual plan', attachments: '[]', created_at: '2026-02-25T10:00:00Z', updated_at: '2026-02-25T10:00:00Z' },
    { id: uuid(263), date: '2026-02-28', description: 'Interest Income - Business Savings', amount: '47.25', type: 'income', account_id: uuid(2), category_id: uuid(114), category_name: 'Interest Income', account_name: 'Business Savings', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-02-28T08:00:00Z', updated_at: '2026-02-28T08:00:00Z' },

    // ── March 2026 ──
    { id: uuid(264), date: '2026-03-01', description: 'Office Rent - March', amount: '3500.00', type: 'expense', account_id: uuid(1), category_id: uuid(101), category_name: 'Rent', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(501), ai_categorized: false, ai_confidence: null, notes: 'Monthly office lease', attachments: '[]', created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-01T09:00:00Z' },
    { id: uuid(265), date: '2026-03-02', description: 'Gusto Payroll - Mar Period 1', amount: '8750.00', type: 'expense', account_id: uuid(1), category_id: uuid(103), category_name: 'Payroll', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-03-02T10:00:00Z', updated_at: '2026-03-02T10:00:00Z' },
    { id: uuid(266), date: '2026-03-03', description: 'Payment from NovaTech - SEO Audit', amount: '4500.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-03-03T13:00:00Z', updated_at: '2026-03-03T13:00:00Z' },
    { id: uuid(267), date: '2026-03-05', description: 'AWS Monthly - Cloud Hosting', amount: '541.20', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.92', notes: null, attachments: '[]', created_at: '2026-03-05T08:00:00Z', updated_at: '2026-03-05T08:00:00Z' },
    { id: uuid(268), date: '2026-03-07', description: 'Starbucks - Morning Coffee', amount: '12.40', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.88', notes: null, attachments: '[]', created_at: '2026-03-07T08:30:00Z', updated_at: '2026-03-07T08:30:00Z' },
    { id: uuid(269), date: '2026-03-10', description: 'State Farm - Business Insurance Premium', amount: '475.00', type: 'expense', account_id: uuid(1), category_id: uuid(109), category_name: 'Insurance', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: uuid(502), ai_categorized: false, ai_confidence: null, notes: 'Monthly premium', attachments: '[]', created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-10T09:00:00Z' },
    { id: uuid(270), date: '2026-03-12', description: 'Google Ads - March Campaign', amount: '1100.00', type: 'expense', account_id: uuid(3), category_id: uuid(104), category_name: 'Marketing', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.95', notes: null, attachments: '[]', created_at: '2026-03-12T09:00:00Z', updated_at: '2026-03-12T09:00:00Z' },
    { id: uuid(271), date: '2026-03-14', description: 'Lyft - Airport Transfer', amount: '45.80', type: 'expense', account_id: uuid(3), category_id: uuid(107), category_name: 'Travel', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.86', notes: null, attachments: '[]', created_at: '2026-03-14T17:00:00Z', updated_at: '2026-03-14T17:00:00Z' },
    { id: uuid(272), date: '2026-03-15', description: 'Consulting - TechStart Inc Monthly Retainer', amount: '5000.00', type: 'income', account_id: uuid(1), category_id: uuid(112), category_name: 'Consulting Revenue', account_name: 'Business Checking', is_recurring: true, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
    { id: uuid(273), date: '2026-03-17', description: 'Vercel - Pro Plan', amount: '20.00', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.88', notes: null, attachments: '[]', created_at: '2026-03-17T08:00:00Z', updated_at: '2026-03-17T08:00:00Z' },
    { id: uuid(274), date: '2026-03-18', description: 'ConEd - Electric Bill', amount: '258.90', type: 'expense', account_id: uuid(1), category_id: uuid(102), category_name: 'Utilities', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.90', notes: null, attachments: '[]', created_at: '2026-03-18T08:00:00Z', updated_at: '2026-03-18T08:00:00Z' },
    { id: uuid(275), date: '2026-03-19', description: 'Grubhub - Team Lunch', amount: '58.25', type: 'expense', account_id: uuid(3), category_id: uuid(108), category_name: 'Meals & Entertainment', account_name: 'Chase Ink Credit Card', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.83', notes: null, attachments: '[]', created_at: '2026-03-19T12:30:00Z', updated_at: '2026-03-19T12:30:00Z' },
    { id: uuid(276), date: '2026-03-20', description: 'Payment from Acme Corp - Website Support Q1', amount: '6000.00', type: 'income', account_id: uuid(1), category_id: uuid(111), category_name: 'Client Payments', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: false, ai_confidence: null, notes: null, attachments: '[]', created_at: '2026-03-20T15:00:00Z', updated_at: '2026-03-20T15:00:00Z' },
    { id: uuid(277), date: '2026-03-21', description: 'Adobe Creative Cloud - Annual', amount: '659.88', type: 'expense', account_id: uuid(3), category_id: uuid(105), category_name: 'Software & SaaS', account_name: 'Chase Ink Credit Card', is_recurring: true, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.91', notes: 'Annual renewal', attachments: '[]', created_at: '2026-03-21T08:00:00Z', updated_at: '2026-03-21T08:00:00Z' },
    { id: uuid(278), date: '2026-03-22', description: 'Product Sale - Design System License', amount: '499.00', type: 'income', account_id: uuid(1), category_id: uuid(113), category_name: 'Product Sales', account_name: 'Business Checking', is_recurring: false, recurring_rule_id: null, ai_categorized: true, ai_confidence: '0.80', notes: null, attachments: '[]', created_at: '2026-03-22T11:00:00Z', updated_at: '2026-03-22T11:00:00Z' },
  ];

  // ── Invoices ──────────────────────────────────────────────
  const invoices = [
    {
      id: uuid(301),
      invoice_number: 'INV-001',
      client_name: 'Acme Corp',
      client_email: 'billing@acmecorp.com',
      items: JSON.stringify([
        { description: 'Website Redesign - Full Project', quantity: 1, rate: 12000, amount: 12000 }
      ]),
      subtotal: '12000.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '12000.00',
      status: 'paid',
      due_date: '2025-10-15',
      paid_date: '2025-10-03',
      notes: 'Thank you for your business!',
      created_at: '2025-09-20T10:00:00Z',
      updated_at: '2025-10-03T14:00:00Z'
    },
    {
      id: uuid(302),
      invoice_number: 'INV-002',
      client_name: 'Bright Ideas LLC',
      client_email: 'accounts@brightideas.co',
      items: JSON.stringify([
        { description: 'App Development - Phase 1', quantity: 1, rate: 8500, amount: 8500 },
        { description: 'UI/UX Design Consultation', quantity: 5, rate: 200, amount: 1000 }
      ]),
      subtotal: '9500.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '9500.00',
      status: 'paid',
      due_date: '2025-11-15',
      paid_date: '2025-11-04',
      notes: null,
      created_at: '2025-10-15T10:00:00Z',
      updated_at: '2025-11-04T11:00:00Z'
    },
    {
      id: uuid(303),
      invoice_number: 'INV-003',
      client_name: 'GreenLeaf Co',
      client_email: 'finance@greenleaf.com',
      items: JSON.stringify([
        { description: 'Brand Strategy & Guidelines', quantity: 1, rate: 7500, amount: 7500 }
      ]),
      subtotal: '7500.00',
      tax_rate: '8.875',
      tax_amount: '665.63',
      total: '8165.63',
      status: 'paid',
      due_date: '2025-12-15',
      paid_date: '2025-12-03',
      notes: 'Includes NYC sales tax',
      created_at: '2025-11-20T10:00:00Z',
      updated_at: '2025-12-03T15:00:00Z'
    },
    {
      id: uuid(304),
      invoice_number: 'INV-004',
      client_name: 'NovaTech',
      client_email: 'ap@novatech.io',
      items: JSON.stringify([
        { description: 'SEO Audit & Recommendations', quantity: 1, rate: 4500, amount: 4500 },
        { description: 'Technical SEO Implementation', quantity: 10, rate: 150, amount: 1500 }
      ]),
      subtotal: '6000.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '6000.00',
      status: 'sent',
      due_date: '2026-04-03',
      paid_date: null,
      notes: 'Net 30',
      created_at: '2026-03-03T10:00:00Z',
      updated_at: '2026-03-03T10:00:00Z'
    },
    {
      id: uuid(305),
      invoice_number: 'INV-005',
      client_name: 'Bright Ideas LLC',
      client_email: 'accounts@brightideas.co',
      items: JSON.stringify([
        { description: 'App Development - Phase 2', quantity: 1, rate: 10000, amount: 10000 },
        { description: 'QA Testing', quantity: 20, rate: 125, amount: 2500 }
      ]),
      subtotal: '12500.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '12500.00',
      status: 'overdue',
      due_date: '2026-03-10',
      paid_date: null,
      notes: 'Phase 2 - partial payment received',
      created_at: '2026-02-01T10:00:00Z',
      updated_at: '2026-03-10T00:00:00Z'
    },
  ];

  // ── Estimates ────────────────────────────────────────────
  const estimates = [
    {
      id: uuid(601),
      estimate_number: 'EST-001',
      client_name: 'TechVentures Inc',
      client_email: 'projects@techventures.com',
      items: JSON.stringify([
        { description: 'Custom CRM Development', quantity: 1, rate: 6500, amount: 6500 },
        { description: 'Data Migration & Setup', quantity: 1, rate: 2000, amount: 2000 }
      ]),
      subtotal: '8500.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '8500.00',
      status: 'accepted',
      valid_until: '2026-03-01',
      notes: 'Includes 30 days of post-launch support',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-02-01T14:00:00Z'
    },
    {
      id: uuid(602),
      estimate_number: 'EST-002',
      client_name: 'Sunrise Media',
      client_email: 'hello@sunrisemedia.co',
      items: JSON.stringify([
        { description: 'Social Media Strategy', quantity: 1, rate: 2200, amount: 2200 },
        { description: 'Content Calendar (3 months)', quantity: 1, rate: 1000, amount: 1000 }
      ]),
      subtotal: '3200.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '3200.00',
      status: 'sent',
      valid_until: '2026-04-15',
      notes: null,
      created_at: '2026-03-10T09:00:00Z',
      updated_at: '2026-03-10T09:00:00Z'
    },
    {
      id: uuid(603),
      estimate_number: 'EST-003',
      client_name: 'CloudFirst Solutions',
      client_email: 'procurement@cloudfirst.io',
      items: JSON.stringify([
        { description: 'Cloud Infrastructure Audit', quantity: 1, rate: 5000, amount: 5000 },
        { description: 'Migration Planning & Architecture', quantity: 1, rate: 4750, amount: 4750 },
        { description: 'Security Compliance Review', quantity: 1, rate: 6000, amount: 6000 }
      ]),
      subtotal: '15750.00',
      tax_rate: '0.00',
      tax_amount: '0.00',
      total: '15750.00',
      status: 'draft',
      valid_until: null,
      notes: 'Pending internal review before sending',
      created_at: '2026-03-20T11:00:00Z',
      updated_at: '2026-03-20T11:00:00Z'
    },
  ];

  // ── Insights ──────────────────────────────────────────────
  const insights = [
    {
      id: uuid(401),
      type: 'trend',
      title: 'Software costs trending up',
      description: 'Your SaaS subscriptions have increased 15% over the last 3 months, from $687 to $790 monthly. Consider auditing unused subscriptions.',
      severity: 'info',
      data: JSON.stringify({ increase_pct: 15, current_monthly: 790, previous_monthly: 687 }),
      is_read: false,
      created_at: '2026-03-20T08:00:00Z'
    },
    {
      id: uuid(402),
      type: 'anomaly',
      title: 'Unusual marketing spend in November',
      description: 'Marketing expenses in November ($1,800) were 50% higher than your 3-month average ($1,200). This was due to the holiday campaign push.',
      severity: 'warning',
      data: JSON.stringify({ month: 'November', amount: 1800, average: 1200 }),
      is_read: true,
      created_at: '2025-12-01T08:00:00Z'
    },
    {
      id: uuid(403),
      type: 'suggestion',
      title: 'Outstanding invoices need follow-up',
      description: 'You have 2 outstanding invoices totaling $18,500. INV-005 is overdue by 13 days. Consider sending a reminder to Bright Ideas LLC.',
      severity: 'warning',
      data: JSON.stringify({ outstanding_count: 2, total: 18500, overdue_count: 1 }),
      is_read: false,
      created_at: '2026-03-22T08:00:00Z'
    },
    {
      id: uuid(404),
      type: 'trend',
      title: 'Revenue growing steadily',
      description: 'Your monthly revenue has grown 12% quarter-over-quarter. Consulting retainers provide a stable $5,000/month baseline.',
      severity: 'info',
      data: JSON.stringify({ growth_pct: 12, stable_revenue: 5000 }),
      is_read: false,
      created_at: '2026-03-18T08:00:00Z'
    },
    {
      id: uuid(405),
      type: 'anomaly',
      title: 'Travel expenses spike in February',
      description: 'Travel costs in February ($888.80) were significantly higher than usual due to the Chicago client trip. This is 3x your monthly average.',
      severity: 'info',
      data: JSON.stringify({ month: 'February', amount: 888.80, average: 296 }),
      is_read: true,
      created_at: '2026-03-01T08:00:00Z'
    },
  ];

  // ── Rules ─────────────────────────────────────────────────
  const rules = [
    {
      id: uuid(601),
      name: 'Amazon purchases → Office Supplies',
      conditions: JSON.stringify([
        { field: 'description', operator: 'contains', value: 'Amazon' }
      ]),
      actions: JSON.stringify([
        { action: 'set_category', value: 'Office Supplies' }
      ]),
      is_active: true,
      priority: 10,
      created_at: '2025-09-15T10:00:00Z'
    },
    {
      id: uuid(602),
      name: 'Starbucks → Meals & Entertainment',
      conditions: JSON.stringify([
        { field: 'description', operator: 'contains', value: 'Starbucks' }
      ]),
      actions: JSON.stringify([
        { action: 'set_category', value: 'Meals & Entertainment' }
      ]),
      is_active: true,
      priority: 10,
      created_at: '2025-09-15T10:00:00Z'
    },
    {
      id: uuid(603),
      name: 'Large payments → Client Payments',
      conditions: JSON.stringify([
        { field: 'description', operator: 'contains', value: 'Payment from' },
        { field: 'amount', operator: 'greater_than', value: '1000' }
      ]),
      actions: JSON.stringify([
        { action: 'set_category', value: 'Client Payments' },
        { action: 'set_type', value: 'income' }
      ]),
      is_active: true,
      priority: 20,
      created_at: '2025-09-15T10:00:00Z'
    },
  ];

  // ── Recurring Transactions ────────────────────────────────
  const recurring_transactions = [
    {
      id: uuid(501),
      description: 'Office Rent',
      amount: '3500.00',
      type: 'expense',
      account_id: uuid(1),
      category_id: uuid(101),
      frequency: 'monthly',
      next_run: '2026-04-01',
      last_run: '2026-03-01',
      is_active: true,
      created_at: '2025-09-01T00:00:00Z'
    },
    {
      id: uuid(502),
      description: 'State Farm - Business Insurance Premium',
      amount: '475.00',
      type: 'expense',
      account_id: uuid(1),
      category_id: uuid(109),
      frequency: 'monthly',
      next_run: '2026-04-10',
      last_run: '2026-03-10',
      is_active: true,
      created_at: '2025-09-01T00:00:00Z'
    },
    {
      id: uuid(503),
      description: 'Figma - Team Plan',
      amount: '75.00',
      type: 'expense',
      account_id: uuid(3),
      category_id: uuid(105),
      frequency: 'monthly',
      next_run: '2026-04-20',
      last_run: '2026-03-20',
      is_active: true,
      created_at: '2025-09-01T00:00:00Z'
    },
  ];

  // ── AI Cache (empty initially) ────────────────────────────
  const ai_cache: Record<string, any>[] = [];

  // ── Budgets ─────────────────────────────────────────────
  const budgets = [
    { id: uuid(701), category_id: uuid(101), category_name: 'Rent', monthly_amount: '3500.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
    { id: uuid(702), category_id: uuid(103), category_name: 'Payroll', monthly_amount: '9000.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
    { id: uuid(703), category_id: uuid(104), category_name: 'Marketing', monthly_amount: '2000.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
    { id: uuid(704), category_id: uuid(105), category_name: 'Software & SaaS', monthly_amount: '800.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
    { id: uuid(705), category_id: uuid(107), category_name: 'Travel', monthly_amount: '500.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
    { id: uuid(706), category_id: uuid(108), category_name: 'Meals & Entertainment', monthly_amount: '200.00', period: '2026-03', created_at: '2026-03-01T00:00:00Z' },
  ];

  // ── Journal Entries (empty initially) ──────────────────
  const journal_entries: Record<string, any>[] = [];

  // ── Scanned Receipts (sample history) ──────────────────
  const scanned_receipts = [
    {
      id: uuid(801),
      file_name: 'starbucks-receipt.jpg',
      file_type: 'image/jpeg',
      file_size: 245000,
      extraction: {
        vendor: 'Starbucks',
        date: '2026-03-15',
        amount: 18.45,
        tax: 1.45,
        tip: 2.00,
        subtotal: 15.00,
        currency: 'USD',
        category: 'Meals & Entertainment',
        payment_method: 'credit',
        line_items: [
          { description: 'Grande Latte', quantity: 2, unit_price: 5.50, amount: 11.00 },
          { description: 'Blueberry Muffin', quantity: 1, unit_price: 4.00, amount: 4.00 },
        ],
        notes: null,
      },
      confidence: 0.94,
      status: 'saved',
      transaction_id: uuid(260),
      created_at: '2026-03-15T10:30:00Z',
    },
    {
      id: uuid(802),
      file_name: 'aws-invoice-march.png',
      file_type: 'image/png',
      file_size: 389000,
      extraction: {
        vendor: 'Amazon Web Services',
        date: '2026-03-05',
        amount: 512.47,
        tax: 0,
        tip: 0,
        subtotal: 512.47,
        currency: 'USD',
        category: 'Software & SaaS',
        payment_method: 'credit',
        line_items: [
          { description: 'EC2 Instances', quantity: 1, unit_price: 287.30, amount: 287.30 },
          { description: 'S3 Storage', quantity: 1, unit_price: 45.17, amount: 45.17 },
          { description: 'RDS PostgreSQL', quantity: 1, unit_price: 180.00, amount: 180.00 },
        ],
        notes: 'Monthly cloud infrastructure',
      },
      confidence: 0.97,
      status: 'saved',
      transaction_id: uuid(256),
      created_at: '2026-03-05T08:00:00Z',
    },
    {
      id: uuid(803),
      file_name: 'uber-ride.jpg',
      file_type: 'image/jpeg',
      file_size: 178000,
      extraction: {
        vendor: 'Uber',
        date: '2026-03-20',
        amount: 34.50,
        tax: 2.76,
        tip: 5.00,
        subtotal: 26.74,
        currency: 'USD',
        category: 'Travel',
        payment_method: 'credit',
        line_items: [
          { description: 'UberX - Downtown to Airport', quantity: 1, unit_price: 26.74, amount: 26.74 },
        ],
        notes: 'Client meeting travel',
      },
      confidence: 0.91,
      status: 'confirmed',
      transaction_id: null,
      created_at: '2026-03-20T14:00:00Z',
    },
  ];

  // ── Companies (one default demo company) ──────────────────
  // The seeded demo user is attached to this company. Fresh signups
  // create their own company row during signup.
  const companies = [
    {
      id: uuid(901),
      name: 'Ledgr Demo Co.',
      email: 'demo@ledgr.com',
      phone: null,
      address: null,
      tax_id: null,
      industry: 'Professional Services',
      fiscal_year_start: 'january',
      coa_template: 'standard',
      onboarded_at: '2025-09-01T00:00:00Z',
      created_at: '2025-09-01T00:00:00Z',
      updated_at: '2025-09-01T00:00:00Z',
    },
  ];

  // ── Users ─────────────────────────────────────────────────
  // password_hash format: scrypt:<saltHex>:<hashHex>
  // The seeded hash below is for the plaintext password "demo".
  // It's safe to commit because it's a demo account only.
  const users = [
    {
      id: uuid(801),
      email: 'demo@ledgr.com',
      name: 'Jane Doe',
      password_hash:
        'scrypt:96c3557e6b4a1d80591321af73208ddf:5d1945033f1e4a1057333f907db692f771d391dddd200ea21c528a9bbec37d50',
      company_id: uuid(901),
      role: 'owner',
      status: 'active',
      invite_token: null,
      is_demo: true,
      created_at: '2025-09-01T00:00:00Z',
      updated_at: '2025-09-01T00:00:00Z',
    },
  ];

  // ── Mileage ───────────────────────────────────────────────
  const mileage = [
    { id: uuid(1001), date: '2026-03-10', from_location: 'Office - 123 Main St', to_location: 'Client HQ - 456 Park Ave', miles: 14.2, purpose: 'business', rate_per_mile: 0.70, deduction_amount: 9.94, is_round_trip: false, notes: 'Quarterly review meeting', created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-10T09:00:00Z' },
    { id: uuid(1002), date: '2026-03-12', from_location: 'Home', to_location: 'Post Office', miles: 3.8, purpose: 'business', rate_per_mile: 0.70, deduction_amount: 2.66, is_round_trip: true, notes: 'Shipped contracts to client', created_at: '2026-03-12T11:00:00Z', updated_at: '2026-03-12T11:00:00Z' },
    { id: uuid(1003), date: '2026-03-18', from_location: 'Office', to_location: 'Airport - JFK', miles: 22.5, purpose: 'business', rate_per_mile: 0.70, deduction_amount: 15.75, is_round_trip: false, notes: 'Chicago conference trip', created_at: '2026-03-18T07:00:00Z', updated_at: '2026-03-18T07:00:00Z' },
    { id: uuid(1004), date: '2026-04-01', from_location: 'Office', to_location: 'Doctor - 789 Health Blvd', miles: 8.4, purpose: 'medical', rate_per_mile: 0.21, deduction_amount: 1.76, is_round_trip: true, notes: null, created_at: '2026-04-01T14:00:00Z', updated_at: '2026-04-01T14:00:00Z' },
    { id: uuid(1005), date: '2026-04-07', from_location: 'Home', to_location: 'TechStart Inc Office', miles: 19.0, purpose: 'business', rate_per_mile: 0.70, deduction_amount: 13.30, is_round_trip: true, notes: 'Monthly client strategy session', created_at: '2026-04-07T09:00:00Z', updated_at: '2026-04-07T09:00:00Z' },
  ];

  // ── Time Entries ──────────────────────────────────────────
  const time_entries = [
    { id: uuid(1101), date: '2026-04-01', client_name: 'Acme Corp', project_name: 'Website Redesign', description: 'Homepage mockups and design review', hours: 3, minutes: 30, is_billable: true, hourly_rate: 150, total_amount: 525.00, timer_start: null, timer_end: null, notes: null, created_at: '2026-04-01T17:30:00Z', updated_at: '2026-04-01T17:30:00Z' },
    { id: uuid(1102), date: '2026-04-02', client_name: 'TechStart Inc', project_name: 'API Integration', description: 'OAuth2 setup and endpoint testing', hours: 4, minutes: 0, is_billable: true, hourly_rate: 175, total_amount: 700.00, timer_start: null, timer_end: null, notes: null, created_at: '2026-04-02T18:00:00Z', updated_at: '2026-04-02T18:00:00Z' },
    { id: uuid(1103), date: '2026-04-03', client_name: 'Internal', project_name: 'Admin & Ops', description: 'Invoicing, email follow-ups', hours: 1, minutes: 15, is_billable: false, hourly_rate: 0, total_amount: 0, timer_start: null, timer_end: null, notes: null, created_at: '2026-04-03T12:15:00Z', updated_at: '2026-04-03T12:15:00Z' },
    { id: uuid(1104), date: '2026-04-07', client_name: 'Bright Ideas LLC', project_name: 'Mobile App', description: 'Sprint planning and architecture review', hours: 2, minutes: 45, is_billable: true, hourly_rate: 200, total_amount: 550.00, timer_start: null, timer_end: null, notes: 'Phase 2 kickoff', created_at: '2026-04-07T15:45:00Z', updated_at: '2026-04-07T15:45:00Z' },
    { id: uuid(1105), date: '2026-04-08', client_name: 'Acme Corp', project_name: 'Website Redesign', description: 'Responsive CSS implementation', hours: 5, minutes: 0, is_billable: true, hourly_rate: 150, total_amount: 750.00, timer_start: null, timer_end: null, notes: null, created_at: '2026-04-08T17:00:00Z', updated_at: '2026-04-08T17:00:00Z' },
  ];

  // ── Purchase Orders ───────────────────────────────────────
  const purchase_orders = [
    { id: uuid(1201), po_number: 'PO-001', vendor_name: 'Dell Technologies', vendor_email: 'orders@dell.com', items: JSON.stringify([{ description: 'Dell XPS 15 Laptop', quantity: 2, unit_price: 1899.00, amount: 3798.00 }, { description: 'USB-C Docking Station', quantity: 2, unit_price: 199.00, amount: 398.00 }]), subtotal: 4196.00, tax_rate: 8.875, tax_amount: 372.39, total: 4568.39, status: 'received', shipping_address: '123 Main St, New York, NY 10001', expected_date: '2026-02-15', notes: 'For new hires starting March', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
    { id: uuid(1202), po_number: 'PO-002', vendor_name: 'Staples Business', vendor_email: 'business@staples.com', items: JSON.stringify([{ description: 'Copy Paper Case (10 reams)', quantity: 3, unit_price: 49.99, amount: 149.97 }, { description: 'Printer Ink Cartridges', quantity: 2, unit_price: 34.99, amount: 69.98 }]), subtotal: 219.95, tax_rate: 8.875, tax_amount: 19.52, total: 239.47, status: 'closed', shipping_address: '123 Main St, New York, NY 10001', expected_date: '2026-03-05', notes: null, created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-08T11:00:00Z' },
    { id: uuid(1203), po_number: 'PO-003', vendor_name: 'AWS Marketplace', vendor_email: null, items: JSON.stringify([{ description: 'EC2 Reserved Instance 1yr', quantity: 1, unit_price: 2500.00, amount: 2500.00 }]), subtotal: 2500.00, tax_rate: 0, tax_amount: 0, total: 2500.00, status: 'sent', shipping_address: null, expected_date: '2026-04-20', notes: 'Annual cloud commitment', created_at: '2026-04-05T10:00:00Z', updated_at: '2026-04-05T10:00:00Z' },
    { id: uuid(1204), po_number: 'PO-004', vendor_name: 'Herman Miller', vendor_email: 'contracts@hermanmiller.com', items: JSON.stringify([{ description: 'Aeron Chair - Size B', quantity: 4, unit_price: 1675.00, amount: 6700.00 }]), subtotal: 6700.00, tax_rate: 8.875, tax_amount: 594.63, total: 7294.63, status: 'draft', shipping_address: '123 Main St, New York, NY 10001', expected_date: '2026-05-01', notes: 'Office expansion - new desks incoming', created_at: '2026-04-10T14:00:00Z', updated_at: '2026-04-10T14:00:00Z' },
  ];

  // ── Employees (seed data for payroll) ────────────────────
  const employees = [
    { id: uuid(1301), name: 'Sarah Johnson', email: 'sarah@mybusiness.com', role: 'Senior Developer', pay_type: 'salary', rate: 85000, tax_withholding_pct: 22, status: 'active', start_date: '2024-01-15', created_at: '2024-01-15T00:00:00Z' },
    { id: uuid(1302), name: 'Michael Chen', email: 'michael@mybusiness.com', role: 'Product Manager', pay_type: 'salary', rate: 95000, tax_withholding_pct: 24, status: 'active', start_date: '2023-06-01', created_at: '2023-06-01T00:00:00Z' },
    { id: uuid(1303), name: 'Emily Rodriguez', email: 'emily@mybusiness.com', role: 'Designer', pay_type: 'salary', rate: 72000, tax_withholding_pct: 22, status: 'active', start_date: '2025-03-10', created_at: '2025-03-10T00:00:00Z' },
    { id: uuid(1304), name: 'David Kim', email: 'david@mybusiness.com', role: 'Support Specialist', pay_type: 'hourly', rate: 28, tax_withholding_pct: 15, status: 'active', start_date: '2025-07-01', created_at: '2025-07-01T00:00:00Z' },
  ];

  // ── Payroll Runs ─────────────────────────────────────────
  const payroll_runs = [
    {
      id: uuid(1401),
      pay_period_start: '2026-03-01',
      pay_period_end: '2026-03-15',
      run_date: '2026-03-15',
      entries: [
        { employee_id: uuid(1301), employee_name: 'Sarah Johnson', gross: 3269.23, taxes: 718.23, deductions: 150, net: 2401 },
        { employee_id: uuid(1302), employee_name: 'Michael Chen', gross: 3653.85, taxes: 876.92, deductions: 150, net: 2626.93 },
        { employee_id: uuid(1303), employee_name: 'Emily Rodriguez', gross: 2769.23, taxes: 608.23, deductions: 100, net: 2061 },
      ],
      total_gross: 9692.31,
      total_taxes: 2203.38,
      total_net: 7088.93,
      status: 'completed',
    },
    {
      id: uuid(1402),
      pay_period_start: '2026-03-16',
      pay_period_end: '2026-03-31',
      run_date: '2026-03-31',
      entries: [
        { employee_id: uuid(1301), employee_name: 'Sarah Johnson', gross: 3269.23, taxes: 718.23, deductions: 150, net: 2401 },
        { employee_id: uuid(1302), employee_name: 'Michael Chen', gross: 3653.85, taxes: 876.92, deductions: 150, net: 2626.93 },
        { employee_id: uuid(1303), employee_name: 'Emily Rodriguez', gross: 2769.23, taxes: 608.23, deductions: 100, net: 2061 },
        { employee_id: uuid(1304), employee_name: 'David Kim', gross: 2240, taxes: 336, deductions: 0, net: 1904 },
      ],
      total_gross: 11932.31,
      total_taxes: 2539.38,
      total_net: 8992.93,
      status: 'completed',
    },
  ];

  // ── Contractors ──────────────────────────────────────────
  const contractors = [
    { id: uuid(1501), name: 'Alex Torres', email: 'alex@freelance.io', address: '45 Park Ave, New York, NY 10016', tax_id_last4: '5678', tax_id_type: 'SSN', payment_terms: 'net30', rate: 125, rate_type: 'hourly', total_paid_ytd: 8750, is_active: true, notes: 'Backend API specialist', created_at: '2025-10-01T00:00:00Z' },
    { id: uuid(1502), name: 'Priya Sharma', email: 'priya@designstudio.co', address: '78 Broadway, Brooklyn, NY 11249', tax_id_last4: '2345', tax_id_type: 'SSN', payment_terms: 'net15', rate: 95, rate_type: 'hourly', total_paid_ytd: 5700, is_active: true, notes: 'Brand + UI design', created_at: '2025-11-15T00:00:00Z' },
    { id: uuid(1503), name: 'Ramos Consulting LLC', email: 'billing@ramosconsulting.com', address: '200 West St, New York, NY 10282', tax_id_last4: '9012', tax_id_type: 'EIN', payment_terms: 'net30', rate: 5000, rate_type: 'project', total_paid_ytd: 15000, is_active: true, notes: 'Strategy & operations', created_at: '2026-01-05T00:00:00Z' },
    { id: uuid(1504), name: 'Jordan Blake', email: 'jordan@jbcontent.com', address: '321 Content Way, Austin, TX 73301', tax_id_last4: '4321', tax_id_type: 'SSN', payment_terms: 'net15', rate: 75, rate_type: 'hourly', total_paid_ytd: 450, is_active: false, notes: 'Content writer (inactive)', created_at: '2025-09-20T00:00:00Z' },
  ];

  // ── Projects ─────────────────────────────────────────────
  const projects = [
    { id: uuid(1601), name: 'Website Redesign', client_name: 'Acme Corp', client_id: null, status: 'active', budget: 18000, spent: 11250, billing_type: 'fixed', start_date: '2026-01-15', end_date: '2026-05-01', description: 'Full redesign of acmecorp.com — new brand, responsive, CMS migration.', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-10T00:00:00Z' },
    { id: uuid(1602), name: 'API Integration', client_name: 'TechStart Inc', client_id: null, status: 'active', budget: 12000, spent: 8400, billing_type: 'hourly', start_date: '2026-02-01', end_date: '2026-04-30', description: 'Build REST API endpoints and integrate with Salesforce CRM.', notes: null, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-04-12T00:00:00Z' },
    { id: uuid(1603), name: 'Mobile App', client_name: 'Bright Ideas LLC', client_id: null, status: 'active', budget: 35000, spent: 27800, billing_type: 'milestone', start_date: '2025-11-01', end_date: '2026-06-30', description: 'iOS + Android app with React Native. 4 milestone payments.', notes: 'Currently on milestone 3 of 4.', created_at: '2025-11-01T00:00:00Z', updated_at: '2026-04-08T00:00:00Z' },
    { id: uuid(1604), name: 'Brand Strategy', client_name: 'GreenLeaf Co', client_id: null, status: 'completed', budget: 8000, spent: 7500, billing_type: 'fixed', start_date: '2025-10-01', end_date: '2025-12-31', description: 'Brand positioning, visual identity, and messaging framework.', notes: 'Delivered and invoiced.', created_at: '2025-10-01T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
    { id: uuid(1605), name: 'Q3 Growth Campaign', client_name: 'Internal', client_id: null, status: 'on-hold', budget: 5000, spent: 2200, billing_type: 'fixed', start_date: '2026-03-01', end_date: '2026-09-30', description: 'Internal marketing campaign — LinkedIn ads + content calendar.', notes: 'On hold pending budget review.', created_at: '2026-03-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z' },
  ];

  // ── Bills / Accounts Payable ──────────────────────────────
  const bills = [
    {
      id: uuid(1701),
      bill_number: 'BILL-001',
      vendor_name: 'Digital Ocean',
      vendor_email: 'billing@digitalocean.com',
      items: JSON.stringify([
        { description: 'Droplet - App Server', category: 'Software & SaaS', quantity: 1, rate: 80.00, amount: 80.00 },
        { description: 'Managed Database', category: 'Software & SaaS', quantity: 1, rate: 50.00, amount: 50.00 },
      ]),
      subtotal: 130.00,
      tax_rate: 0,
      tax_amount: 0,
      total: 130.00,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 130.00,
      status: 'paid',
      bill_date: '2026-03-01',
      due_date: '2026-03-31',
      paid_date: '2026-03-15',
      payment_terms: 'net30',
      notes: 'March infrastructure bill',
      scheduled_payment_date: null,
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-03-15T10:00:00Z',
    },
    {
      id: uuid(1702),
      bill_number: 'BILL-002',
      vendor_name: 'Adobe Creative Cloud',
      vendor_email: 'invoices@adobe.com',
      items: JSON.stringify([
        { description: 'Creative Cloud All Apps - Annual Plan', category: 'Software & SaaS', quantity: 1, rate: 599.88, amount: 599.88 },
      ]),
      subtotal: 599.88,
      tax_rate: 0,
      tax_amount: 0,
      total: 599.88,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 599.88,
      status: 'paid',
      bill_date: '2026-01-15',
      due_date: '2026-02-14',
      paid_date: '2026-02-10',
      payment_terms: 'net30',
      notes: 'Annual subscription renewal',
      scheduled_payment_date: null,
      created_at: '2026-01-15T09:00:00Z',
      updated_at: '2026-02-10T14:00:00Z',
    },
    {
      id: uuid(1703),
      bill_number: 'BILL-003',
      vendor_name: 'Office Depot',
      vendor_email: 'billing@officedepot.com',
      items: JSON.stringify([
        { description: 'Printer Paper (Case of 10)', category: 'Office Supplies', quantity: 2, rate: 54.99, amount: 109.98 },
        { description: 'Stapler & Staples Set', category: 'Office Supplies', quantity: 3, rate: 12.99, amount: 38.97 },
        { description: 'Whiteboard Markers (Box)', category: 'Office Supplies', quantity: 2, rate: 8.99, amount: 17.98 },
      ]),
      subtotal: 166.93,
      tax_rate: 8.875,
      tax_amount: 14.82,
      total: 181.75,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 181.75,
      status: 'pending',
      bill_date: '2026-04-05',
      due_date: '2026-04-20',
      paid_date: null,
      payment_terms: 'net15',
      notes: null,
      scheduled_payment_date: null,
      created_at: '2026-04-05T10:00:00Z',
      updated_at: '2026-04-05T10:00:00Z',
    },
    {
      id: uuid(1704),
      bill_number: 'BILL-004',
      vendor_name: 'Shopify Partners',
      vendor_email: 'partners@shopify.com',
      items: JSON.stringify([
        { description: 'Theme Development - Acme Corp Store', category: 'Professional Services', quantity: 20, rate: 85.00, amount: 1700.00 },
      ]),
      subtotal: 1700.00,
      tax_rate: 0,
      tax_amount: 0,
      total: 1700.00,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 1700.00,
      status: 'overdue',
      bill_date: '2026-03-01',
      due_date: '2026-03-31',
      paid_date: null,
      payment_terms: 'net30',
      notes: 'Subcontractor invoice for Acme project',
      scheduled_payment_date: null,
      created_at: '2026-03-01T11:00:00Z',
      updated_at: '2026-04-01T08:00:00Z',
    },
    {
      id: uuid(1705),
      bill_number: 'BILL-005',
      vendor_name: 'Canva Pro',
      vendor_email: null,
      items: JSON.stringify([
        { description: 'Canva Pro Team (5 seats)', category: 'Software & SaaS', quantity: 1, rate: 54.99, amount: 54.99 },
      ]),
      subtotal: 54.99,
      tax_rate: 0,
      tax_amount: 0,
      total: 54.99,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 54.99,
      status: 'draft',
      bill_date: '2026-04-10',
      due_date: '2026-04-25',
      paid_date: null,
      payment_terms: 'net15',
      notes: null,
      scheduled_payment_date: null,
      created_at: '2026-04-10T08:00:00Z',
      updated_at: '2026-04-10T08:00:00Z',
    },
  ];

  return {
    accounts,
    categories,
    transactions,
    invoices,
    estimates,
    insights,
    rules,
    recurring_transactions,
    ai_cache,
    budgets,
    scanned_receipts,
    journal_entries,
    clients: [],
    inventory: [],
    users,
    companies,
    mileage,
    time_entries,
    purchase_orders,
    employees,
    payroll_runs,
    contractors,
    projects,
    bills,
    invite_tokens: [],
    subscriptions: [],
  };
}
