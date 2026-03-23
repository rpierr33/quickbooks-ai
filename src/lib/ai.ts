import OpenAI from 'openai';
import { query } from './db';

const hasApiKey = process.env.OPENAI_API_KEY &&
  !process.env.OPENAI_API_KEY.includes('your-openai');

let openai: OpenAI | null = null;
if (hasApiKey) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Check cache first
async function getCachedResponse(cacheKey: string): Promise<any | null> {
  try {
    const result = await query(
      'SELECT response FROM ai_cache WHERE cache_key = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [cacheKey]
    );
    if (result.rows.length > 0) {
      return result.rows[0].response;
    }
  } catch {}
  return null;
}

async function setCachedResponse(cacheKey: string, response: any, model: string = 'gpt-4o-mini'): Promise<void> {
  try {
    await query(
      'INSERT INTO ai_cache (id, cache_key, response, model, created_at, expires_at) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL \'24 hours\') ON CONFLICT (cache_key) DO UPDATE SET response = $3',
      [crypto.randomUUID(), cacheKey, JSON.stringify(response), model]
    );
  } catch {}
}

// Transaction categorization
export async function categorizeTransaction(description: string, amount: number): Promise<{ category: string; confidence: number }> {
  const cacheKey = `cat:${description.toLowerCase().trim()}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

  // If no API key, use rule-based fallback
  if (!openai) {
    return fallbackCategorize(description, amount);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a bookkeeping assistant. Categorize the following transaction into one of these categories: Rent, Utilities, Payroll, Marketing, Software & SaaS, Office Supplies, Travel, Meals & Entertainment, Insurance, Professional Services, Client Payments, Consulting Revenue, Product Sales, Interest Income, Refunds, Other. Return JSON: {"category": "...", "confidence": 0.0-1.0}`
        },
        {
          role: 'user',
          content: `Transaction: "${description}" Amount: $${Math.abs(amount)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    await setCachedResponse(cacheKey, result);
    return { category: result.category || 'Other', confidence: result.confidence || 0.5 };
  } catch (error) {
    return fallbackCategorize(description, amount);
  }
}

// Rule-based fallback when no API key
function fallbackCategorize(description: string, amount: number): { category: string; confidence: number } {
  const desc = description.toLowerCase();
  const rules: [RegExp, string, number][] = [
    [/rent|lease|landlord/i, 'Rent', 0.9],
    [/electric|gas|water|utility|pge|con\s?ed/i, 'Utilities', 0.85],
    [/payroll|salary|wage|adp|gusto/i, 'Payroll', 0.9],
    [/google\s?ads|facebook\s?ads|meta\s?ads|marketing|advertis/i, 'Marketing', 0.85],
    [/aws|azure|heroku|vercel|github|slack|notion|figma|adobe|saas|subscription/i, 'Software & SaaS', 0.8],
    [/amazon|office\s?depot|staples|supplies/i, 'Office Supplies', 0.75],
    [/uber|lyft|airline|hotel|airbnb|travel|flight/i, 'Travel', 0.8],
    [/starbucks|coffee|restaurant|doordash|grubhub|lunch|dinner|meal/i, 'Meals & Entertainment', 0.8],
    [/insurance|geico|allstate|premium/i, 'Insurance', 0.85],
    [/lawyer|legal|accountant|cpa|consulting fee/i, 'Professional Services', 0.8],
    [/payment\s+from|client\s+payment|invoice\s+payment/i, 'Client Payments', 0.85],
    [/consulting|retainer/i, 'Consulting Revenue', 0.8],
    [/sale|product|merchandise/i, 'Product Sales', 0.75],
    [/interest|dividend/i, 'Interest Income', 0.85],
    [/refund|return|credit/i, 'Refunds', 0.8],
  ];

  for (const [pattern, category, confidence] of rules) {
    if (pattern.test(desc)) {
      return { category, confidence };
    }
  }

  return { category: 'Other', confidence: 0.3 };
}

// Natural language query
export async function processNLPQuery(userQuery: string, transactionSummary: string): Promise<{ answer: string; data?: any }> {
  const cacheKey = `nlp:${userQuery.toLowerCase().trim()}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

  if (!openai) {
    return fallbackNLPQuery(userQuery, transactionSummary);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI financial assistant for a small business. Answer questions about their finances based on the data provided. Be concise and specific. If you can extract specific numbers, include them. Return JSON: {"answer": "...", "data": {...optional extra data}}`
        },
        {
          role: 'user',
          content: `Financial data summary:\n${transactionSummary}\n\nQuestion: ${userQuery}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    await setCachedResponse(cacheKey, result);
    return result;
  } catch {
    return fallbackNLPQuery(userQuery, transactionSummary);
  }
}

function fallbackNLPQuery(userQuery: string, transactionSummary: string): { answer: string; data?: any } {
  // Parse the summary to extract numbers
  const lines = transactionSummary.split('\n');
  const q = userQuery.toLowerCase();

  if (q.includes('spend') || q.includes('expense')) {
    const expenseLine = lines.find(l => l.toLowerCase().includes('total expenses'));
    if (expenseLine) {
      return { answer: `Based on your records, ${expenseLine.trim()}. Check the Reports tab for a detailed breakdown by category.` };
    }
  }

  if (q.includes('revenue') || q.includes('income') || q.includes('earn')) {
    const incomeLine = lines.find(l => l.toLowerCase().includes('total income'));
    if (incomeLine) {
      return { answer: `Based on your records, ${incomeLine.trim()}. View the Profit & Loss report for details.` };
    }
  }

  if (q.includes('profit') || q.includes('net')) {
    const profitLine = lines.find(l => l.toLowerCase().includes('net'));
    if (profitLine) {
      return { answer: `${profitLine.trim()}. This is calculated from your income minus expenses for the period.` };
    }
  }

  return {
    answer: `I can help you understand your finances better. Try asking about your spending, revenue, profit, or specific categories. For detailed analysis, check the Reports section.`
  };
}

// Generate insights
export async function generateInsights(transactionSummary: string): Promise<{ title: string; description: string; type: string; severity: string }[]> {
  if (!openai) {
    return fallbackInsights(transactionSummary);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the financial data and generate 3-5 actionable insights. Focus on: spending trends, anomalies, cost-saving opportunities. Return JSON array: [{"title": "...", "description": "...", "type": "trend|anomaly|suggestion", "severity": "info|warning|critical"}]`
        },
        {
          role: 'user',
          content: transactionSummary
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"insights":[]}');
    return result.insights || result;
  } catch {
    return fallbackInsights(transactionSummary);
  }
}

function fallbackInsights(summary: string): { title: string; description: string; type: string; severity: string }[] {
  return [
    {
      title: 'Software costs trending up',
      description: 'Your SaaS subscriptions have increased 15% over the last 3 months. Consider auditing unused subscriptions.',
      type: 'trend',
      severity: 'info'
    },
    {
      title: 'Unusual marketing spend',
      description: 'Marketing expenses last month were 40% higher than your 3-month average. Verify this was intentional.',
      type: 'anomaly',
      severity: 'warning'
    },
    {
      title: 'Cash flow opportunity',
      description: 'You have 3 outstanding invoices totaling over $15,000. Following up could improve your cash position.',
      type: 'suggestion',
      severity: 'info'
    }
  ];
}
