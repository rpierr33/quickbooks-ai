/**
 * Payroll Calculator & Tracker
 *
 * This module calculates payroll taxes and withholdings based on 2026 tax tables.
 * It does NOT process actual payments — for that, integrate with:
 * - Gusto API (GUSTO_API_KEY)
 * - Check by Intuit (CHECK_API_KEY)
 * - Rippling API (RIPPLING_API_KEY)
 *
 * ACTIVATION (processing): Set GUSTO_API_KEY or CHECK_API_KEY for actual payroll processing
 * Without credentials, this works as a payroll calculator showing what to pay.
 */

// ── 2026 Tax Rates ─────────────────────────────────────────────

const FEDERAL_TAX_BRACKETS_2026 = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const FICA_RATES = {
  socialSecurity: { rate: 0.062, wageBase: 168600 }, // 2026 projected
  medicare: { rate: 0.0145, additionalRate: 0.009, additionalThreshold: 200000 },
};

const FUTA_RATE = 0.006; // After state credit
const FUTA_WAGE_BASE = 7000;

// ── Types ──────────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  email: string;
  salary: number; // Annual
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  filingStatus: 'single' | 'married' | 'head_of_household';
  allowances: number;
  state: string;
  startDate: string;
  isActive: boolean;
}

export interface PayrollCalculation {
  employee: string;
  grossPay: number;
  federalWithholding: number;
  socialSecurity: number;
  medicare: number;
  stateWithholding: number;
  totalDeductions: number;
  netPay: number;
  employerSSContribution: number;
  employerMedicareContribution: number;
  employerFUTA: number;
  totalEmployerCost: number;
}

export interface PayrollSummary {
  payPeriod: string;
  payDate: string;
  totalGross: number;
  totalNet: number;
  totalFederalTax: number;
  totalStateTax: number;
  totalFICA: number;
  totalEmployerTax: number;
  grandTotal: number; // Total cost to employer
  employees: PayrollCalculation[];
}

// ── Calculation Functions ──────────────────────────────────────

function getPeriodsPerYear(frequency: Employee['payFrequency']): number {
  switch (frequency) {
    case 'weekly': return 52;
    case 'biweekly': return 26;
    case 'semimonthly': return 24;
    case 'monthly': return 12;
  }
}

function calculateFederalWithholding(annualIncome: number, filingStatus: string): number {
  // Simplified — single filer brackets (married would use different brackets)
  const brackets = FEDERAL_TAX_BRACKETS_2026;
  let tax = 0;
  let remaining = annualIncome;

  // Standard deduction
  const standardDeduction = filingStatus === 'married' ? 30000 : filingStatus === 'head_of_household' ? 22500 : 15000;
  remaining = Math.max(0, remaining - standardDeduction);

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  return Math.round(tax * 100) / 100;
}

function calculateStateWithholding(annualIncome: number, state: string): number {
  // Simplified state tax rates (flat rate approximations)
  const stateRates: Record<string, number> = {
    'CA': 0.0725, 'NY': 0.0685, 'TX': 0, 'FL': 0, 'WA': 0, 'NV': 0,
    'IL': 0.0495, 'PA': 0.0307, 'OH': 0.04, 'GA': 0.055, 'NC': 0.0475,
    'NJ': 0.0637, 'VA': 0.0575, 'MA': 0.05, 'CO': 0.044, 'AZ': 0.025,
    'MI': 0.0425, 'IN': 0.0315, 'TN': 0, 'MO': 0.048, 'MD': 0.0575,
    'WI': 0.053, 'MN': 0.0685, 'OR': 0.09, 'SC': 0.065, 'CT': 0.05,
  };
  const rate = stateRates[state] ?? 0.05; // Default 5%
  return Math.round(annualIncome * rate * 100) / 100;
}

export function calculatePayroll(employee: Employee): PayrollCalculation {
  const periods = getPeriodsPerYear(employee.payFrequency);
  const grossPay = Math.round((employee.salary / periods) * 100) / 100;

  // Federal withholding (annualized then divided by periods)
  const annualFederal = calculateFederalWithholding(employee.salary, employee.filingStatus);
  const federalWithholding = Math.round((annualFederal / periods) * 100) / 100;

  // FICA — employee portion
  const socialSecurity = Math.round(grossPay * FICA_RATES.socialSecurity.rate * 100) / 100;
  const medicare = Math.round(grossPay * FICA_RATES.medicare.rate * 100) / 100;

  // State withholding
  const annualState = calculateStateWithholding(employee.salary, employee.state);
  const stateWithholding = Math.round((annualState / periods) * 100) / 100;

  const totalDeductions = Math.round((federalWithholding + socialSecurity + medicare + stateWithholding) * 100) / 100;
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

  // Employer contributions
  const employerSSContribution = socialSecurity; // Employer matches employee SS
  const employerMedicareContribution = medicare; // Employer matches employee Medicare
  const employerFUTA = Math.round(Math.min(grossPay, FUTA_WAGE_BASE / periods) * FUTA_RATE * 100) / 100;

  const totalEmployerCost = Math.round((grossPay + employerSSContribution + employerMedicareContribution + employerFUTA) * 100) / 100;

  return {
    employee: employee.name,
    grossPay,
    federalWithholding,
    socialSecurity,
    medicare,
    stateWithholding,
    totalDeductions,
    netPay,
    employerSSContribution,
    employerMedicareContribution,
    employerFUTA,
    totalEmployerCost,
  };
}

export function calculatePayrollSummary(employees: Employee[], payPeriod: string, payDate: string): PayrollSummary {
  const calculations = employees.filter(e => e.isActive).map(calculatePayroll);

  return {
    payPeriod,
    payDate,
    totalGross: calculations.reduce((s, c) => s + c.grossPay, 0),
    totalNet: calculations.reduce((s, c) => s + c.netPay, 0),
    totalFederalTax: calculations.reduce((s, c) => s + c.federalWithholding, 0),
    totalStateTax: calculations.reduce((s, c) => s + c.stateWithholding, 0),
    totalFICA: calculations.reduce((s, c) => s + c.socialSecurity + c.medicare, 0),
    totalEmployerTax: calculations.reduce((s, c) => s + c.employerSSContribution + c.employerMedicareContribution + c.employerFUTA, 0),
    grandTotal: calculations.reduce((s, c) => s + c.totalEmployerCost, 0),
    employees: calculations,
  };
}

// ── Gusto Integration (requires API key) ──────────────────────
// Uncomment after: set GUSTO_API_KEY env var
/*
export async function processPayrollViaGusto(
  companyId: string,
  payPeriod: { startDate: string; endDate: string }
): Promise<{ success: boolean; payrollId?: string; error?: string }> {
  const apiKey = process.env.GUSTO_API_KEY;
  if (!apiKey) return { success: false, error: 'GUSTO_API_KEY not set' };

  const response = await fetch(`https://api.gusto.com/v1/companies/${companyId}/payrolls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      off_cycle: false,
      start_date: payPeriod.startDate,
      end_date: payPeriod.endDate,
    }),
  });

  const data = await response.json();
  if (!response.ok) return { success: false, error: data.message };
  return { success: true, payrollId: data.uuid };
}
*/
