import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Stripe sends raw body — Next.js App Router gives us the request as-is
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Always require webhook secret — never process unverified events
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set. Rejecting request.');
    return NextResponse.json({ error: 'Webhook signature required' }, { status: 400 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Webhook signature required' }, { status: 400 });
  }

  let event: any;

  try {
    const rawBody = await request.text();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeModule = require('stripe');
    const Stripe = StripeModule.default || StripeModule;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        // Mark invoice paid if this is an invoice payment
        if (invoiceId && !invoiceId.startsWith('plan_')) {
          await markInvoicePaid(invoiceId);
          console.log(`[stripe-webhook] Invoice ${invoiceId} marked paid (checkout.session.completed)`);
        }

        // Track subscription if this is a plan upgrade
        if (companyId && planId) {
          await upsertSubscription({
            companyId,
            plan: planId,
            stripeCustomerId: session.customer ?? null,
            stripeSubscriptionId: session.subscription ?? null,
            status: 'active',
          });
          console.log(`[stripe-webhook] Subscription upserted: company=${companyId} plan=${planId}`);
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

async function upsertSubscription({
  companyId,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
}: {
  companyId: string;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
}) {
  const now = new Date().toISOString();

  await query(
    `INSERT INTO subscriptions (company_id, plan, stripe_customer_id, stripe_subscription_id, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (company_id) DO UPDATE SET
       plan = EXCLUDED.plan,
       stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
       stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
       status = EXCLUDED.status,
       updated_at = EXCLUDED.updated_at`,
    [companyId, plan, stripeCustomerId, stripeSubscriptionId, status, now]
  );
}
