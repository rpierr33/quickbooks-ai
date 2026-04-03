import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing rules-engine
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import { applyRules } from '@/lib/rules-engine';
import { query } from '@/lib/db';

const mockQuery = vi.mocked(query);

describe('applyRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches a rule with contains operator', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        name: 'Amazon → Office Supplies',
        conditions: JSON.stringify([
          { field: 'description', operator: 'contains', value: 'Amazon' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Office Supplies' }
        ]),
        is_active: true,
        priority: 10,
      }],
    });

    const result = await applyRules('Amazon Order #12345', 49.99, 'expense');
    expect(result.matched).toBe(true);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].action).toBe('set_category');
    expect(result.actions[0].value).toBe('Office Supplies');
  });

  it('returns no match when description does not match any rule', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        name: 'Amazon → Office Supplies',
        conditions: JSON.stringify([
          { field: 'description', operator: 'contains', value: 'Amazon' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Office Supplies' }
        ]),
        is_active: true,
        priority: 10,
      }],
    });

    const result = await applyRules('Starbucks Coffee', 5.50, 'expense');
    expect(result.matched).toBe(false);
    expect(result.actions).toHaveLength(0);
  });

  it('matches case-insensitively', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        conditions: JSON.stringify([
          { field: 'description', operator: 'contains', value: 'STARBUCKS' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Meals & Entertainment' }
        ]),
        is_active: true,
        priority: 10,
      }],
    });

    const result = await applyRules('starbucks coffee team meeting', 34.50, 'expense');
    expect(result.matched).toBe(true);
  });

  it('handles multiple conditions (all must match)', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
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
      }],
    });

    // Both conditions match
    const result = await applyRules('Payment from Acme Corp', 5000, 'income');
    expect(result.matched).toBe(true);
    expect(result.actions).toHaveLength(2);

    // Only one condition matches (amount too low)
    const result2 = await applyRules('Payment from Acme Corp', 500, 'income');
    expect(result2.matched).toBe(false);
  });

  it('handles equals operator', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        conditions: JSON.stringify([
          { field: 'type', operator: 'equals', value: 'income' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Revenue' }
        ]),
        is_active: true,
        priority: 5,
      }],
    });

    expect((await applyRules('Any transaction', 100, 'income')).matched).toBe(true);
    expect((await applyRules('Any transaction', 100, 'expense')).matched).toBe(false);
  });

  it('handles starts_with operator', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        conditions: JSON.stringify([
          { field: 'description', operator: 'starts_with', value: 'Invoice' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Client Payments' }
        ]),
        is_active: true,
        priority: 5,
      }],
    });

    expect((await applyRules('Invoice #123 payment', 1000, 'income')).matched).toBe(true);
    expect((await applyRules('Paid Invoice #123', 1000, 'income')).matched).toBe(false);
  });

  it('handles less_than operator', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        conditions: JSON.stringify([
          { field: 'amount', operator: 'less_than', value: '10' }
        ]),
        actions: JSON.stringify([
          { action: 'set_category', value: 'Petty Cash' }
        ]),
        is_active: true,
        priority: 5,
      }],
    });

    expect((await applyRules('Small purchase', 5, 'expense')).matched).toBe(true);
    expect((await applyRules('Big purchase', 500, 'expense')).matched).toBe(false);
  });

  it('returns no match when no rules exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await applyRules('Any transaction', 100, 'expense');
    expect(result.matched).toBe(false);
    expect(result.actions).toHaveLength(0);
  });

  it('handles already-parsed conditions (not stringified)', async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 'rule-1',
        conditions: [{ field: 'description', operator: 'contains', value: 'AWS' }],
        actions: [{ action: 'set_category', value: 'Software & SaaS' }],
        is_active: true,
        priority: 10,
      }],
    });

    const result = await applyRules('AWS Monthly Bill', 487, 'expense');
    expect(result.matched).toBe(true);
  });
});
