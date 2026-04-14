"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Check, Building2, BarChart3, Landmark, Upload, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' };

const steps = [
  { id: 1, label: 'Company Info', icon: Building2 },
  { id: 2, label: 'Industry', icon: BarChart3 },
  { id: 3, label: 'Accounts', icon: Landmark },
  { id: 4, label: 'Import', icon: Upload },
  { id: 5, label: 'Done', icon: Sparkles },
];

const industries = [
  'Technology / SaaS', 'Professional Services', 'Consulting', 'E-commerce / Retail',
  'Healthcare', 'Real Estate', 'Construction', 'Food & Beverage',
  'Creative / Agency', 'Education', 'Nonprofit', 'Other',
];

const coaTemplates = [
  { id: 'standard', name: 'Standard Business', desc: 'General chart of accounts suitable for most businesses' },
  { id: 'service', name: 'Service Business', desc: 'Optimized for consulting, agencies, and freelancers' },
  { id: 'retail', name: 'Retail / E-commerce', desc: 'Includes inventory, COGS, and sales categories' },
  { id: 'nonprofit', name: 'Nonprofit', desc: 'Fund accounting with grants, donations, and programs' },
  { id: 'custom', name: 'Start from Scratch', desc: 'Build your own chart of accounts' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({ name: '', email: '', phone: '', address: '', taxId: '' });
  const [industry, setIndustry] = useState('');
  const [fiscalYear, setFiscalYear] = useState('january');
  const [coaTemplate, setCoaTemplate] = useState('standard');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function persistOnboarding(): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          email: company.email || undefined,
          phone: company.phone || undefined,
          address: company.address || undefined,
          taxId: company.taxId || undefined,
          industry: industry || undefined,
          fiscalYearStart: fiscalYear,
          coaTemplate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data?.error || 'Could not save — try again.');
        return false;
      }
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    // On step 4 ("Finish Setup") we save before transitioning to Done.
    if (step === 4) {
      const ok = await persistOnboarding();
      if (!ok) return;
    }
    setStep(s => Math.min(s + 1, 5));
  }
  const prev = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }} className="animate-fade-in">
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step > s.id ? '#059669' : step === s.id ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : '#F1F5F9',
              color: step >= s.id ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.2s',
              boxShadow: step === s.id ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
            }}>
              {step > s.id ? <Check style={{ width: 16, height: 16 }} /> : <s.icon style={{ width: 16, height: 16 }} />}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 2, borderRadius: 2, background: step > s.id ? '#059669' : '#E2E8F0', transition: 'all 0.3s' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ ...card, padding: 32 }}>
        {/* Step 1: Company Info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Welcome to Ledgr</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>Let&apos;s set up your business profile. This takes about 2 minutes.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Business Name *</label>
                <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} placeholder="Your Business LLC" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
                  <Input type="email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} placeholder="accounts@business.com" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Phone</label>
                  <Input value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Business Address</label>
                <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} placeholder="123 Business St, City, State 12345" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax ID / EIN</label>
                <Input value={company.taxId} onChange={e => setCompany({ ...company, taxId: e.target.value })} placeholder="XX-XXXXXXX" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>What&apos;s your industry?</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>This helps us configure your categories, tax settings, and AI recommendations.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8 }}>
              {industries.map(ind => (
                <button
                  key={ind}
                  className="cursor-pointer"
                  onClick={() => setIndustry(ind)}
                  style={{
                    padding: '14px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: industry === ind ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: industry === ind ? '#F5F3FF' : '#FFFFFF',
                    color: industry === ind ? '#7C3AED' : '#475569',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Fiscal Year Start</label>
              <Select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m.toLowerCase()}>{m}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Chart of Accounts */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Chart of Accounts</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>Choose a template to start with. You can customize everything later.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {coaTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  className="cursor-pointer"
                  onClick={() => setCoaTemplate(tpl.id)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, textAlign: 'left',
                    border: coaTemplate === tpl.id ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: coaTemplate === tpl.id ? '#F5F3FF' : '#FFFFFF',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: coaTemplate === tpl.id ? '#7C3AED' : '#0F172A' }}>{tpl.name}</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{tpl.desc}</p>
                    </div>
                    {coaTemplate === tpl.id && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check style={{ width: 14, height: 14, color: '#fff' }} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Import */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Import your data</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>Bring your existing financial data into Ledgr. You can always do this later.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="cursor-pointer"
                onClick={() => router.push('/import')}
                style={{
                  padding: '20px', borderRadius: 12, border: '2px dashed #E2E8F0',
                  background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 16,
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Upload style={{ width: 20, height: 20, color: '#7C3AED' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Import from CSV</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Upload bank statements or transaction exports</p>
                </div>
              </button>
              <div style={{
                padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0',
                background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 16,
                opacity: 0.6,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Landmark style={{ width: 20, height: 20, color: '#0284C7' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Connect Bank (Plaid)</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Automatically sync transactions — available on Pro & Enterprise</p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
              You can skip this step and import data later from Settings.
            </p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            }}>
              <Sparkles style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>You&apos;re all set!</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 1.6, maxWidth: 400, margin: '8px auto 0' }}>
              Your Ledgr account is configured and ready to go. Start by creating your first invoice or adding a transaction.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              <Button variant="outline" onClick={() => router.push('/transactions')} className="cursor-pointer">
                Add Transaction
              </Button>
              <Button onClick={() => router.push('/invoices')} className="cursor-pointer" style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)', border: 'none' }}>
                Create Invoice <ArrowRight style={{ width: 14, height: 14, marginLeft: 6 }} />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
            {saveError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {saveError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" onClick={prev} disabled={step === 1 || saving} className="cursor-pointer">
                Back
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                {step === 4 && (
                  <Button variant="outline" onClick={next} disabled={saving} className="cursor-pointer">Skip</Button>
                )}
                <Button
                  onClick={next}
                  disabled={(step === 1 && !company.name) || saving}
                  className="cursor-pointer"
                >
                  {saving ? 'Saving…' : step === 4 ? 'Finish Setup' : 'Continue'}{' '}
                  <ArrowRight style={{ width: 14, height: 14, marginLeft: 6 }} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
