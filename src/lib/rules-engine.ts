import { Rule, RuleCondition, RuleAction } from '@/types';
import { query } from './db';

export async function applyRules(description: string, amount: number, type: string): Promise<{ matched: boolean; actions: RuleAction[] }> {
  const result = await query('SELECT * FROM rules WHERE is_active = true ORDER BY priority DESC');
  const rules: Rule[] = result.rows;

  for (const rule of rules) {
    const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
    const allMatch = conditions.every((condition: RuleCondition) => {
      const fieldValue = getFieldValue(condition.field, description, amount, type);
      return evaluateCondition(fieldValue, condition.operator, condition.value);
    });

    if (allMatch) {
      const actions = typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions;
      return { matched: true, actions };
    }
  }

  return { matched: false, actions: [] };
}

function getFieldValue(field: string, description: string, amount: number, type: string): string {
  switch (field) {
    case 'description': return description;
    case 'amount': return amount.toString();
    case 'type': return type;
    default: return '';
  }
}

function evaluateCondition(fieldValue: string, operator: string, conditionValue: string): boolean {
  const fv = fieldValue.toLowerCase();
  const cv = conditionValue.toLowerCase();

  switch (operator) {
    case 'contains': return fv.includes(cv);
    case 'equals': return fv === cv;
    case 'starts_with': return fv.startsWith(cv);
    case 'greater_than': return parseFloat(fieldValue) > parseFloat(conditionValue);
    case 'less_than': return parseFloat(fieldValue) < parseFloat(conditionValue);
    default: return false;
  }
}
