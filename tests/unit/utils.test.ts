import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateShort, getPercentageChange, generateId } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive whole number', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('handles string input from PostgreSQL DECIMAL', () => {
    expect(formatCurrency('3500.00')).toBe('$3,500.00');
  });

  it('handles string with extra decimals', () => {
    expect(formatCurrency('99.999')).toBe('$100.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('formats small cents-only values', () => {
    expect(formatCurrency(0.50)).toBe('$0.50');
  });
});

describe('formatDate', () => {
  it('formats ISO datetime string', () => {
    // Use full datetime to avoid timezone shifts
    const result = formatDate('2026-03-15T12:00:00Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2026/);
  });

  it('returns a non-empty string', () => {
    const result = formatDate('2025-12-25T12:00:00Z');
    expect(result).toMatch(/Dec/);
    expect(result).toMatch(/2025/);
  });

  it('formats various months', () => {
    expect(formatDate('2026-01-15T12:00:00Z')).toMatch(/Jan/);
    expect(formatDate('2026-06-15T12:00:00Z')).toMatch(/Jun/);
  });
});

describe('formatDateShort', () => {
  it('formats without year', () => {
    const result = formatDateShort('2026-03-15T12:00:00Z');
    expect(result).toMatch(/Mar/);
    expect(result).not.toMatch(/2026/);
  });
});

describe('getPercentageChange', () => {
  it('calculates positive growth', () => {
    expect(getPercentageChange(120, 100)).toBe(20);
  });

  it('calculates negative decline', () => {
    expect(getPercentageChange(80, 100)).toBe(-20);
  });

  it('returns 0 when both values are 0', () => {
    expect(getPercentageChange(0, 0)).toBe(0);
  });

  it('returns 100 when previous is 0 and current is positive', () => {
    expect(getPercentageChange(50, 0)).toBe(100);
  });

  it('returns 0 when current and previous are equal', () => {
    expect(getPercentageChange(100, 100)).toBe(0);
  });

  it('handles decimal precision correctly', () => {
    const result = getPercentageChange(103, 100);
    expect(result).toBe(3);
  });

  it('handles large percentage changes', () => {
    const result = getPercentageChange(1000, 100);
    expect(result).toBe(900);
  });
});

describe('generateId', () => {
  it('returns a valid UUID format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
