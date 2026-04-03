import { NextResponse } from 'next/server';
import { getIntegrationStatus, registerWebhook, type EventType } from '@/lib/integrations';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  const status = getIntegrationStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const { action, url, events, secret } = await request.json();

    if (action === 'register_webhook') {
      if (!url || !events || !secret) {
        return NextResponse.json({ error: 'Missing url, events, or secret' }, { status: 400 });
      }
      const subscription = registerWebhook(url, events as EventType[], secret);
      return NextResponse.json(subscription);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
