import crypto from 'crypto';

/**
 * Third-Party Integrations Framework
 *
 * Webhook event system + pre-built integration connectors.
 * Each integration requires its own API credentials.
 *
 * ACTIVATION:
 * - Slack: Set SLACK_WEBHOOK_URL
 * - Zapier: Set ZAPIER_WEBHOOK_URL
 * - Google Sheets: Set GOOGLE_SHEETS_CREDENTIALS (service account JSON)
 * - QuickBooks: Set QB_CLIENT_ID and QB_CLIENT_SECRET
 */

// ── Event Types ────────────────────────────────────────────────

export type EventType =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'payment.received'
  | 'estimate.accepted'
  | 'estimate.converted'
  | 'reconciliation.completed'
  | 'budget.exceeded'
  | 'anomaly.detected';

interface WebhookEvent {
  id: string;
  type: EventType;
  timestamp: string;
  data: Record<string, unknown>;
}

interface WebhookSubscription {
  id: string;
  url: string;
  events: EventType[];
  secret: string;
  isActive: boolean;
  createdAt: string;
}

// ── Webhook Dispatch ───────────────────────────────────────────

const subscriptions: WebhookSubscription[] = [];

export function registerWebhook(url: string, events: EventType[], secret: string): WebhookSubscription {
  const sub: WebhookSubscription = {
    id: crypto.randomUUID(),
    url,
    events,
    secret,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  subscriptions.push(sub);
  return sub;
}

export async function dispatchEvent(type: EventType, data: Record<string, unknown>): Promise<void> {
  const event: WebhookEvent = {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  // Dispatch to registered webhooks
  const matchingSubs = subscriptions.filter(s => s.isActive && s.events.includes(type));
  await Promise.allSettled(matchingSubs.map(sub => deliverWebhook(sub, event)));

  // Dispatch to built-in integrations
  await Promise.allSettled([
    notifySlack(event),
    notifyZapier(event),
  ]);
}

async function deliverWebhook(sub: WebhookSubscription, event: WebhookEvent): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    const signature = crypto.createHmac('sha256', sub.secret).update(payload).digest('hex');
    await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ledgr-Event': event.type,
        'X-Ledgr-Signature': `sha256=${signature}`,
      },
      body: payload,
    });
  } catch {
    // Log failure — in production, implement retry with exponential backoff
    console.error(`Webhook delivery failed to ${sub.url} for event ${event.type}`);
  }
}

// ── Slack Integration ──────────────────────────────────────────

export function isSlackConfigured(): boolean {
  return !!process.env.SLACK_WEBHOOK_URL;
}

async function notifySlack(event: WebhookEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const messages: Record<string, (data: Record<string, unknown>) => string> = {
    'transaction.created': (d) => `New transaction: ${d.description} — $${Number(d.amount).toFixed(2)} (${d.type})`,
    'invoice.created': (d) => `New invoice ${d.invoice_number} for ${d.client_name} — $${Number(d.total).toFixed(2)}`,
    'invoice.paid': (d) => `Invoice ${d.invoice_number} paid by ${d.client_name} — $${Number(d.total).toFixed(2)}`,
    'invoice.overdue': (d) => `Invoice ${d.invoice_number} is overdue — ${d.client_name} owes $${Number(d.total).toFixed(2)}`,
    'payment.received': (d) => `Payment received: $${Number(d.amount).toFixed(2)} from ${d.client_name}`,
    'budget.exceeded': (d) => `Budget alert: ${d.category} spending exceeded budget by $${Number(d.overage).toFixed(2)}`,
    'anomaly.detected': (d) => `Spending anomaly detected: ${d.description}`,
  };

  const formatter = messages[event.type];
  if (!formatter) return;

  const text = formatter(event.data);
  const emoji = event.type.includes('paid') || event.type.includes('received') ? ':white_check_mark:' :
    event.type.includes('overdue') || event.type.includes('exceeded') || event.type.includes('anomaly') ? ':warning:' : ':ledger:';

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} *Ledgr* | ${text}`,
        username: 'Ledgr',
        icon_emoji: ':ledger:',
      }),
    });
  } catch {
    console.error('Slack notification failed');
  }
}

// ── Zapier Integration ─────────────────────────────────────────

export function isZapierConfigured(): boolean {
  return !!process.env.ZAPIER_WEBHOOK_URL;
}

async function notifyZapier(event: WebhookEvent): Promise<void> {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: event.type,
        timestamp: event.timestamp,
        ...event.data,
      }),
    });
  } catch {
    console.error('Zapier webhook failed');
  }
}

// ── Google Sheets Sync ─────────────────────────────────────────
// Uncomment after: npm install googleapis && set GOOGLE_SHEETS_CREDENTIALS
/*
export async function syncToGoogleSheets(
  spreadsheetId: string,
  sheetName: string,
  data: string[][]
): Promise<{ success: boolean; error?: string }> {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credentials) return { success: false, error: 'GOOGLE_SHEETS_CREDENTIALS not set' };

  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: data },
  });

  return { success: true };
}
*/

// ── Integration Status ─────────────────────────────────────────

export function getIntegrationStatus(): Record<string, { configured: boolean; envVar: string }> {
  return {
    plaid: { configured: !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET), envVar: 'PLAID_CLIENT_ID, PLAID_SECRET' },
    stripe: { configured: !!process.env.STRIPE_SECRET_KEY, envVar: 'STRIPE_SECRET_KEY' },
    email: { configured: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY), envVar: 'RESEND_API_KEY or SENDGRID_API_KEY' },
    slack: { configured: !!process.env.SLACK_WEBHOOK_URL, envVar: 'SLACK_WEBHOOK_URL' },
    zapier: { configured: !!process.env.ZAPIER_WEBHOOK_URL, envVar: 'ZAPIER_WEBHOOK_URL' },
    google_sheets: { configured: !!process.env.GOOGLE_SHEETS_CREDENTIALS, envVar: 'GOOGLE_SHEETS_CREDENTIALS' },
    gusto_payroll: { configured: !!process.env.GUSTO_API_KEY, envVar: 'GUSTO_API_KEY' },
    tax1099: { configured: !!process.env.TAX1099_API_KEY, envVar: 'TAX1099_API_KEY' },
  };
}
