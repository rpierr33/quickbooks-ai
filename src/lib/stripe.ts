// ACTIVATION: npm install stripe && set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY env vars

// ---------- Types ----------

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PaymentStatusResult {
  status: string;
  amount: number;
  currency: string;
  receiptEmail: string | null;
}

export interface CustomerResult {
  customerId: string;
  email: string;
  name: string | null;
}

// ---------- Stripe instance (lazy, dynamic) ----------

let stripeInstance: any = null;

const getStripe = async (): Promise<any> => {
  if (stripeInstance) return stripeInstance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe').default || require('stripe');
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
    return stripeInstance;
  } catch {
    throw new Error('Stripe package not installed. Run: npm install stripe');
  }
};

// ---------- Configuration check ----------

export function isConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

// ---------- Payment Intent ----------

export async function createPaymentIntent(
  amount: number,
  currency: string,
  invoiceId: string,
  clientEmail?: string
): Promise<PaymentIntentResult> {
  const stripe = await getStripe();

  const params: Record<string, unknown> = {
    amount: Math.round(amount * 100), // Convert dollars to cents
    currency: currency.toLowerCase(),
    metadata: { invoiceId },
    automatic_payment_methods: { enabled: true },
  };

  if (clientEmail) {
    params.receipt_email = clientEmail;
  }

  const paymentIntent = await stripe.paymentIntents.create(params);

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

// ---------- Checkout Session ----------

export async function createCheckoutSession(
  invoiceId: string,
  amount: number,
  clientName: string,
  clientEmail: string | null,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResult> {
  const stripe = await getStripe();

  const params: Record<string, unknown> = {
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice payment — ${clientName}`,
            description: `Invoice ${invoiceId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  if (clientEmail) {
    params.customer_email = clientEmail;
  }

  const session = await stripe.checkout.sessions.create(params);

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

// ---------- Payment status ----------

export async function getPaymentStatus(
  paymentIntentId: string
): Promise<PaymentStatusResult> {
  const stripe = await getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    status: pi.status,
    amount: pi.amount / 100,
    currency: pi.currency,
    receiptEmail: pi.receipt_email ?? null,
  };
}

// ---------- Customer ----------

export async function createCustomer(
  email: string,
  name: string
): Promise<CustomerResult> {
  const stripe = await getStripe();
  const customer = await stripe.customers.create({ email, name });

  return {
    customerId: customer.id,
    email: customer.email!,
    name: customer.name ?? null,
  };
}
