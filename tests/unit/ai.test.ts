import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db and OpenAI before importing
vi.mock('@/lib/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

// Mock OpenAI env var to be empty so fallbacks run
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.OPENAI_API_KEY;
});

import { categorizeTransaction, processNLPQuery, generateInsights, extractReceiptData } from '@/lib/ai';

describe('categorizeTransaction (fallback mode)', () => {
  it('categorizes rent-related transactions', async () => {
    const result = await categorizeTransaction('Office Rent - January', 3500);
    expect(result.category).toBe('Rent');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('categorizes SaaS subscriptions', async () => {
    const result = await categorizeTransaction('AWS Monthly Cloud Hosting', 487);
    expect(result.category).toBe('Software & SaaS');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('categorizes payroll', async () => {
    const result = await categorizeTransaction('Gusto Payroll - October', 8500);
    expect(result.category).toBe('Payroll');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('categorizes meals', async () => {
    const result = await categorizeTransaction('Starbucks - Team Meeting', 34.50);
    expect(result.category).toBe('Meals & Entertainment');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('categorizes travel', async () => {
    const result = await categorizeTransaction('Uber ride to airport', 45);
    expect(result.category).toBe('Travel');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('categorizes marketing', async () => {
    const result = await categorizeTransaction('Google Ads Campaign', 1200);
    expect(result.category).toBe('Marketing');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('categorizes insurance', async () => {
    const result = await categorizeTransaction('State Farm Insurance Premium', 475);
    expect(result.category).toBe('Insurance');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('categorizes client payments', async () => {
    const result = await categorizeTransaction('Payment from Acme Corp', 12000);
    expect(result.category).toBe('Client Payments');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('falls back to Other for unknown descriptions', async () => {
    const result = await categorizeTransaction('XYZ Random Transaction ABC', 100);
    expect(result.category).toBe('Other');
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  it('is case-insensitive', async () => {
    const result = await categorizeTransaction('AMAZON OFFICE SUPPLIES', 50);
    expect(result.category).toBe('Office Supplies');
  });
});

describe('processNLPQuery (fallback mode)', () => {
  const summary = `Total Income: $45,000
Total Expenses: $32,000
Net Profit: $13,000
Top Categories: Payroll, Rent, Software`;

  it('answers spending questions', async () => {
    const result = await processNLPQuery('How much did we spend?', summary);
    expect(result.answer).toContain('Total Expenses');
  });

  it('answers revenue questions', async () => {
    const result = await processNLPQuery('What is our total revenue?', summary);
    expect(result.answer).toContain('Total Income');
  });

  it('answers profit questions', async () => {
    const result = await processNLPQuery('What is our net profit?', summary);
    expect(result.answer).toContain('Net');
  });

  it('returns generic guidance for unknown questions', async () => {
    const result = await processNLPQuery('When is the next full moon?', summary);
    expect(result.answer).toBeTruthy();
    expect(result.answer.length).toBeGreaterThan(20);
  });
});

describe('generateInsights (fallback mode)', () => {
  it('returns an array of insights', async () => {
    const insights = await generateInsights('Summary data here');
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThanOrEqual(1);
  });

  it('each insight has required fields', async () => {
    const insights = await generateInsights('Summary data here');
    for (const insight of insights) {
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('description');
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('severity');
      expect(['trend', 'anomaly', 'suggestion']).toContain(insight.type);
      expect(['info', 'warning', 'critical']).toContain(insight.severity);
    }
  });
});

describe('extractReceiptData (fallback mode)', () => {
  it('returns fallback data when no API key', async () => {
    const result = await extractReceiptData('base64data', 'image/jpeg');
    expect(result.vendor).toContain('manually');
    expect(result.amount).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.currency).toBe('USD');
    expect(result.category).toBe('Other');
  });

  it('fallback includes all expected fields', async () => {
    const result = await extractReceiptData('base64data', 'image/jpeg');
    expect(result).toHaveProperty('vendor');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('amount');
    expect(result).toHaveProperty('tax');
    expect(result).toHaveProperty('tip');
    expect(result).toHaveProperty('subtotal');
    expect(result).toHaveProperty('currency');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('payment_method');
    expect(result).toHaveProperty('line_items');
    expect(result).toHaveProperty('notes');
    expect(result).toHaveProperty('confidence');
  });

  it('fallback date is today', async () => {
    const result = await extractReceiptData('base64data', 'image/png');
    const today = new Date().toISOString().split('T')[0];
    expect(result.date).toBe(today);
  });

  it('fallback line_items is empty array', async () => {
    const result = await extractReceiptData('base64data', 'image/jpeg');
    expect(Array.isArray(result.line_items)).toBe(true);
    expect(result.line_items).toHaveLength(0);
  });
});
