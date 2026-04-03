import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Stripe sends raw body — Next.js App Router gives us the request as-is
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set. Dev mode only.');
  }

  let event: any;

  try {
    const rawBody = await request.text();

    if (webhookSecret) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const StripeModule = require('stripe');
      const Stripe = StripeModule.default || StripeModule;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia' as any,
      });

      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
      }

      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // No webhook secret — parse JSON directly (development only)
      event = JSON.parse(rawBody);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    console.error('[stripe-webhook] Signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          await markInvoicePaid(invoiceId);
          console.log(`[stripe-webhook] Invoice ${invoiceId} marked paid (checkout.session.completed)`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const invoiceId = paymentIntent.metadata?.invoiceId;

        if (invoiceId) {
          await markInvoicePaid(invoiceId);
          console.log(`[stripe-webhook] Invoice ${invoiceId} marked paid (payment_intent.succeeded)`);
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge but don't process
        break;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook handler error';
    console.error('[stripe-webhook] Handler error:', message);
    // Return 200 so Stripe doesn't retry — the error is on our side
    return NextResponse.json({ received: true, warning: message });
  }

  return NextResponse.json({ received: true });
}

// ── Helpers ────────────────────────────────────────────────────────────

async function markInvoicePaid(invoiceId: string) {
  const now = new Date().toISOString();

  await query(
    `UPDATE invoices SET status = 'paid', paid_date = $1, updated_at = $2 WHERE id = $3`,
    [now, now, invoiceId]
  );
}
