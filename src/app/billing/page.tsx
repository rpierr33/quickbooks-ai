"use client";
import React, { useState } from "react";
import { Check, Zap, Building2, Rocket, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' };

const plans = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: '/mo',
    description: 'For freelancers and sole proprietors getting started.',
    icon: Zap,
    iconBg: '#F1F5F9',
    iconColor: '#64748B',
    features: [
      'Up to 5 clients',
      '20 invoices/month',
      'Basic financial reports (P&L, Balance Sheet)',
      'Transaction tracking',
      'CSV import',
      'AI categorization (50/month)',
      'Email support',
    ],
    cta: 'Current Plan',
    current: true,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    period: '/mo',
    description: 'For growing businesses that need full accounting power.',
    icon: Rocket,
    iconBg: 'linear-gradient(135deg, #7C3AED, #9333EA)',
    iconColor: '#FFFFFF',
    features: [
      'Unlimited clients & vendors',
      'Unlimited invoices & estimates',
      'All financial reports (P&L, Balance Sheet, Cash Flow, Aged Receivables, Trial Balance, Tax Summary, General Ledger)',
      'Bank reconciliation',
      'Recurring transactions',
      'Inventory management',
      'Budget tracking',
      'AI assistant & insights (unlimited)',
      'Receipt upload & OCR',
      'Multi-currency support',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    current: false,
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79,
    period: '/mo',
    description: 'For businesses with advanced needs and multiple users.',
    icon: Building2,
    iconBg: '#0F172A',
    iconColor: '#FFFFFF',
    features: [
      'Everything in Professional',
      'Up to 10 team members',
      'Role-based access control',
      'Audit log & compliance',
      'Custom chart of accounts templates',
      'API access',
      'Bank feed integration (Plaid)',
      'Payroll integration',
      'Custom report builder',
      'Dedicated account manager',
      'SSO / SAML',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    current: false,
    highlighted: false,
  },
];

export default function BillingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Choose your plan</h2>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>
          Start free, upgrade when you&apos;re ready. All plans include core accounting features.
        </p>
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

      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 16, alignItems: 'start' }}>
        {plans.map(plan => {
          const price = annual ? Math.round(plan.price * 0.8) : plan.price;
          return (
            <div
              key={plan.id}
              style={{
                ...card,
                border: plan.highlighted ? '2px solid #7C3AED' : '1px solid #E2E8F0',
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
              <div style={{ padding: 28 }}>
                {/* Plan icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: plan.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <plan.icon style={{ width: 20, height: 20, color: plan.iconColor }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                    ${price}
                  </span>
                  <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>{plan.period}</span>
                  {annual && plan.price > 0 && (
                    <span style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                      ${price * 12}/year (billed annually)
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>{plan.description}</p>

                {/* CTA */}
                <Button
                  className="w-full cursor-pointer"
                  variant={plan.current ? 'outline' : 'default'}
                  disabled={plan.current}
                  style={plan.highlighted && !plan.current ? {
                    background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                    border: 'none',
                  } : undefined}
                >
                  {plan.current && <CreditCard style={{ width: 14, height: 14, marginRight: 6 }} />}
                  {plan.cta}
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

      {/* FAQ */}
      <div style={{ ...card, padding: 28, maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Frequently Asked Questions</h3>
        {[
          { q: 'Can I switch plans at any time?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.' },
          { q: 'Is there a free trial for paid plans?', a: 'Yes! Both Professional and Enterprise plans come with a 14-day free trial. No credit card required.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) through our secure Stripe integration.' },
          { q: 'Can I cancel at any time?', a: 'Absolutely. Cancel anytime from your billing settings. Your data remains accessible on the Starter plan.' },
        ].map((faq, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{faq.q}</p>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
