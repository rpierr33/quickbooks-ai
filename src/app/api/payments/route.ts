import { NextRequest, NextResponse } from 'next/server';
import {
  isConfigured,
  createCheckoutSession,
  createPaymentIntent,
  getPaymentStatus,
} from '@/lib/stripe';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  // Gate: Stripe must be configured
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: 'Stripe not configured',
        setup:
          'Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variables',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    // ── Create Checkout Session ──────────────────────────────────────
    if (action === 'create_checkout') {
      const { invoiceId, amount, clientName, clientEmail, successUrl, cancelUrl } = body;

      if (!invoiceId || !amount || !clientName) {
        return NextResponse.json(
          { error: 'invoiceId, amount, and clientName are required' },
          { status: 400 }
        );
      }

      const origin = request.nextUrl.origin;
      const result = await createCheckoutSession(
        invoiceId,
        parseFloat(amount),
        clientName,
        clientEmail ?? null,
        successUrl || `${origin}/pay/${invoiceId}?status=success`,
        cancelUrl || `${origin}/pay/${invoiceId}?status=cancelled`
      );

      return NextResponse.json(result);
    }

    // ── Create Payment Intent ────────────────────────────────────────
    if (action === 'create_intent') {
      const { amount, currency, invoiceId, clientEmail } = body;

      if (!amount || !invoiceId) {
        return NextResponse.json(
          { error: 'amount and invoiceId are required' },
          { status: 400 }
        );
      }

      const result = await createPaymentIntent(
        parseFloat(amount),
        currency || 'usd',
        invoiceId,
        clientEmail
      );

      return NextResponse.json(result);
    }

    // ── Check Payment Status ─────────────────────────────────────────
    if (action === 'status') {
      const { paymentIntentId } = body;

      if (!paymentIntentId) {
        return NextResponse.json(
          { error: 'paymentIntentId is required' },
          { status: 400 }
        );
      }

      const result = await getPaymentStatus(paymentIntentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment request failed';
    console.error('[payments] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
