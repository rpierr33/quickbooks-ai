"use client";
import React, { useState, useEffect } from "react";
import { Check, Zap, Building2, Rocket, CreditCard, Star, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

// ── Pricing tiers ─────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    monthlyPrice: 0,
    trialDays: 14,
    period: '14 days',
    description: 'Full access to all features. No credit card required.',
    icon: Zap,
    iconBg: '#F1F5F9',
    iconColor: '#64748B',
    features: [
      'All features unlocked for 14 days',
      'Unlimited invoices during trial',
      'AI categorization & assistant',
      'Bank reconciliation',
      'All financial reports',
      'CSV import & export',
      'No credit card required',
    ],
    cta: 'Start Free Trial',
    isTrial: true,
    highlighted: false,
    stripePriceId: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29.99,
    period: '/mo',
    description: 'For freelancers and small businesses getting their books in order.',
    icon: Rocket,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    features: [
      'Up to 10 clients',
      '50 invoices/month',
      'Basic reports (P&L, Balance Sheet)',
      'Transaction tracking',
      'Budget tracking',
      'AI categorization (200/month)',
      'CSV import',
      'Email support',
    ],
    cta: 'Get Starter',
    highlighted: false,
    stripePriceId: 'starter',
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 59.99,
    period: '/mo',
    description: 'For growing businesses that need full accounting power.',
    icon: Star,
    iconBg: 'linear-gradient(135deg, #7C3AED, #9333EA)',
    iconColor: '#FFFFFF',
    features: [
      'Unlimited clients & vendors',
      'Unlimited invoices & estimates',
      'All financial reports (P&L, Balance Sheet, Cash Flow, Aged Receivables, Trial Balance, Tax Summary, General Ledger)',
      'Bank reconciliation',
      'Recurring transactions',
      'Budget & goal tracking',
      'AI assistant & insights (unlimited)',
      'Receipt upload & OCR',
      'Multi-currency support',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
    stripePriceId: 'professional',
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 99.99,
    period: '/mo',
    description: 'For established businesses with teams and inventory needs.',
    icon: Briefcase,
    iconBg: '#0F172A',
    iconColor: '#FFFFFF',
    features: [
      'Everything in Professional',
      'Inventory management',
      'Up to 5 team members',
      'Role-based access control',
      'Bank feed integration (Plaid)',
      'Custom report builder',
      'API access',
      'Audit log',
      'Phone & priority support',
    ],
    cta: 'Get Business',
    highlighted: false,
    stripePriceId: 'business',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 139.99,
    period: '/mo',
    description: 'For enterprises with advanced compliance and multi-user needs.',
    icon: Building2,
    iconBg: 'linear-gradient(135deg, #1E293B, #334155)',
    iconColor: '#FFFFFF',
    features: [
      'Everything in Business',
      'Up to 25 team members',
      'Payroll integration',
      'Custom chart of accounts templates',
      'SSO / SAML',
      'Compliance & audit reports',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom onboarding & training',
    ],
    cta: 'Contact Sales',
    isEnterprise: true,
    highlighted: false,
    stripePriceId: 'enterprise',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { toast } = useToast();
  const [annual, setAnnual] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // Current user plan — default to free_trial for demo; in production fetch from session/DB
  const [currentPlan] = useState<string>('free_trial');

  // Check if Stripe is configured on mount
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    setStripeAvailable(Boolean(key && key.length > 0));
  }, []);

  const handlePlanClick = async (plan: typeof plans[0]) => {
    // Enterprise → mailto
    if (plan.isEnterprise) {
      window.location.href = 'mailto:sales@ledgr.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    // Free trial → no Stripe needed
    if (plan.isTrial) {
      toast('You already have access to a 14-day free trial. Sign up to activate it.');
      return;
    }

    // Current plan — do nothing
    if (plan.id === currentPlan) return;

    if (!stripeAvailable) {
      toast('Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.', 'error');
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const displayPrice = annual
        ? Math.round(plan.monthlyPrice * 0.8 * 100) / 100
        : plan.monthlyPrice;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_checkout',
          // For subscription plans we pass a synthetic invoice ID and the plan as metadata
          invoiceId: `plan_${plan.id}_${Date.now()}`,
          amount: annual ? displayPrice * 12 : displayPrice,
          clientName: plan.name,
          clientEmail: null,
          successUrl: `${window.location.origin}/billing?status=success&plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/billing?status=cancelled`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          toast('Stripe is not configured on this server. Add STRIPE_SECRET_KEY to your environment.', 'error');
          return;
        }
        throw new Error(data.error || 'Payment request failed');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast(message, 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Success / cancelled feedback from Stripe redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      toast('Plan activated! Welcome aboard.');
    } else if (status === 'cancelled') {
      toast('Upgrade cancelled. Your current plan is unchanged.', 'error');
    }
  }, [toast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Choose your plan</h2>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>
          Start with a 14-day free trial. No credit card required.
        </p>

        {/* Stripe not configured warning */}
        {stripeAvailable === false && (
          <div style={{
            marginTop: 16, padding: '10px 16px', borderRadius: 8,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            fontSize: 12, color: '#92400E', textAlign: 'left',
          }}>
            <strong>Payments not configured.</strong> Set <code>STRIPE_SECRET_KEY</code> and{' '}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in your environment to enable plan upgrades.
          </div>
        )}

        {/* Annual/Monthly toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 10, marginTop: 20 }}>
          <button
            className="cursor-pointer"
            onClick={() => setAnnual(false)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none',
              background: !annual ? '#FFFFFF' : 'transparent',
              color: !annual ? '#0F172A' : '#94A3B8',
              boxShadow: !annual ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            className="cursor-pointer"
            onClick={() => setAnnual(true)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none',
              background: annual ? '#FFFFFF' : 'transparent',
              color: annual ? '#0F172A' : '#94A3B8',
              boxShadow: annual ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Annual
            <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards — 2 rows: trial/starter/pro on top, business/enterprise on bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 16, alignItems: 'start' }}>
        {plans.slice(0, 3).map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isLoading = loadingPlan === plan.id;
          const displayPrice = plan.isTrial
            ? null
            : annual
              ? Math.round(plan.monthlyPrice * 0.8 * 100) / 100
              : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              style={{
                ...card,
                border: plan.highlighted ? '2px solid #7C3AED' : isCurrent ? '2px solid #059669' : '1px solid #E2E8F0',
                position: 'relative',
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)',
                  background: 'linear-gradient(135deg, #7C3AED, #9333EA)', color: '#fff',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '4px 16px', borderRadius: 99,
                }}>
                  Most Popular
                </div>
              )}
              {isCurrent && !plan.highlighted && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)',
                  background: '#059669', color: '#fff',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '4px 16px', borderRadius: 99,
                }}>
                  Current Plan
                </div>
              )}
              <div style={{ padding: 28 }}>
                {/* Icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: plan.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <plan.icon style={{ width: 20, height: 20, color: plan.iconColor }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{plan.name}</h3>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 12 }}>
                  {plan.isTrial ? (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Free</span>
                      <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, marginLeft: 6 }}>14-day trial</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        ${displayPrice}
                      </span>
                      <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>/mo</span>
                      {annual && (
                        <span style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                          ${Math.round((displayPrice as number) * 12 * 100) / 100}/year billed annually
                        </span>
                      )}
                    </>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>{plan.description}</p>

                {/* CTA */}
                <Button
                  className="w-full cursor-pointer"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || isLoading}
                  onClick={() => handlePlanClick(plan)}
                  style={plan.highlighted && !isCurrent ? {
                    background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                    border: 'none',
                  } : undefined}
                >
                  {isCurrent && <CreditCard style={{ width: 14, height: 14, marginRight: 6 }} />}
                  {isLoading ? 'Redirecting...' : isCurrent ? 'Current Plan' : plan.cta}
                </Button>

                {/* Features */}
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: plan.highlighted ? '#EDE9FE' : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check style={{ width: 10, height: 10, color: plan.highlighted ? '#7C3AED' : '#64748B' }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Second row: Business + Enterprise */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, alignItems: 'start', maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {plans.slice(3).map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isLoading = loadingPlan === plan.id;
          const displayPrice = annual
            ? Math.round(plan.monthlyPrice * 0.8 * 100) / 100
            : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              style={{
                ...card,
                border: isCurrent ? '2px solid #059669' : '1px solid #E2E8F0',
                position: 'relative',
              }}
            >
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)',
                  background: '#059669', color: '#fff',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '4px 16px', borderRadius: 99,
                }}>
                  Current Plan
                </div>
              )}
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: plan.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <plan.icon style={{ width: 20, height: 20, color: plan.iconColor }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{plan.name}</h3>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {plan.isEnterprise ? (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Custom</span>
                      <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400, marginLeft: 8 }}>contact sales</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        ${displayPrice}
                      </span>
                      <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>/mo</span>
                      {annual && (
                        <span style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                          ${Math.round(displayPrice * 12 * 100) / 100}/year billed annually
                        </span>
                      )}
                    </>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>{plan.description}</p>

                <Button
                  className="w-full cursor-pointer"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || isLoading}
                  onClick={() => handlePlanClick(plan)}
                  style={!isCurrent ? { background: '#0F172A', border: 'none' } : undefined}
                >
                  {isCurrent && <CreditCard style={{ width: 14, height: 14, marginRight: 6 }} />}
                  {isLoading ? 'Redirecting...' : isCurrent ? 'Current Plan' : plan.cta}
                </Button>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check style={{ width: 10, height: 10, color: '#64748B' }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ ...card, padding: 28, maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Frequently Asked Questions</h3>
        {[
          { q: 'Can I switch plans at any time?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.' },
          { q: 'Is there a free trial for paid plans?', a: 'Yes! Start with a 14-day free trial that gives you full access. No credit card required to start.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) through our secure Stripe integration.' },
          { q: 'Can I cancel at any time?', a: 'Absolutely. Cancel anytime from your billing settings. Your data remains accessible on the free tier.' },
          { q: 'Does annual billing save money?', a: 'Yes — annual billing gives you a 20% discount vs paying month-to-month. You pay once per year.' },
        ].map((faq, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{faq.q}</p>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
