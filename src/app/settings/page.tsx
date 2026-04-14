"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, CreditCard, Shield, Bell, Database, Receipt, Users, Trash2, Mail } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { exportTransactions, exportInvoices } from "@/lib/export";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const sectionHeader = (icon: React.ReactNode, iconBg: string, title: string, desc: string) => (
  <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{title}</h3>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{desc}</p>
    </div>
  </div>
);

const settingRow = (title: string, desc: string, right: React.ReactNode, border = true) => (
  <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: border ? '1px solid #F1F5F9' : 'none' }}>
    <div style={{ minWidth: 0, flex: 1, marginRight: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{title}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{desc}</p>
    </div>
    {right}
  </div>
);

const badge = (text: string, variant: 'coming' | 'available' | 'active') => {
  const styles = {
    coming: { background: '#F1F5F9', color: '#64748B' },
    available: { background: '#ECFDF5', color: '#059669' },
    active: { background: '#EDE9FE', color: '#7C3AED' },
  };
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99, flexShrink: 0, ...styles[variant] }}>{text}</span>;
};

interface TeamMember {
  name: string;
  email: string;
  role: string;
}

// Fiscal month names to API values
const FISCAL_MONTHS = [
  { label: 'January', value: 'january' },
  { label: 'April', value: 'april' },
  { label: 'July', value: 'july' },
  { label: 'October', value: 'october' },
];

const TAX_SETTINGS_KEY = 'ledgr_tax_settings';

export default function SettingsPage() {
  const { toast } = useToast();

  // Company info state
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fiscalYearStart, setFiscalYearStart] = useState('january');
  const [savingCompany, setSavingCompany] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Tax settings state
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [defaultTaxRate, setDefaultTaxRate] = useState('8.875');
  const [taxName, setTaxName] = useState('Sales Tax');
  const [savingTax, setSavingTax] = useState(false);

  // Team state
  const [team, setTeam] = useState<TeamMember[]>([
    { name: 'John Doe', email: 'john@mybusiness.com', role: 'admin' },
    { name: 'Sarah Chen', email: 'sarah@mybusiness.com', role: 'accountant' },
    { name: 'Mike Wilson', email: 'mike@mybusiness.com', role: 'viewer' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  // Load company data on mount
  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch('/api/onboarding');
        if (res.ok) {
          const data = await res.json();
          const c = data.company;
          if (c) {
            setCompanyName(c.name || '');
            setEmail(c.email || '');
            setFiscalYearStart(c.fiscal_year_start || 'january');
          }
        }
      } catch {
        // Non-critical — fields stay empty
      } finally {
        setLoadingCompany(false);
      }
    }
    loadCompany();

    // Load tax settings from localStorage
    const stored = localStorage.getItem(TAX_SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed.taxEnabled === 'boolean') setTaxEnabled(parsed.taxEnabled);
        if (parsed.defaultTaxRate) setDefaultTaxRate(parsed.defaultTaxRate);
        if (parsed.taxName) setTaxName(parsed.taxName);
      } catch {
        // Ignore malformed storage
      }
    }
  }, []);

  const saveCompanySettings = async () => {
    if (!companyName.trim()) {
      toast('Company name is required', 'error');
      return;
    }
    setSavingCompany(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim() || undefined,
          fiscalYearStart,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      toast('Company settings saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save company settings';
      toast(message, 'error');
    } finally {
      setSavingCompany(false);
    }
  };

  const saveTaxSettings = () => {
    setSavingTax(true);
    try {
      localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify({ taxEnabled, defaultTaxRate, taxName }));
      toast('Tax settings saved');
    } catch {
      toast('Failed to save tax settings', 'error');
    } finally {
      setSavingTax(false);
    }
  };

  const addTeamMember = () => {
    if (!inviteEmail.trim()) return;
    setTeam([...team, { name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
    setInviteRole('viewer');
    toast('Teammate added');
  };

  const removeTeamMember = (idx: number) => {
    if (team[idx].role === 'admin' && team.filter(m => m.role === 'admin').length <= 1) return;
    setTeam(team.filter((_, i) => i !== idx));
  };

  const handleExportCSV = async () => {
    try {
      // Fetch both transactions and invoices for export
      const [txRes, invRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/invoices'),
      ]);
      if (txRes.ok) {
        const transactions = await txRes.json();
        exportTransactions(transactions);
      }
      if (invRes.ok) {
        const invoices = await invRes.json();
        exportInvoices(invoices);
      }
      toast('Export complete');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const roleColors: Record<string, { bg: string; color: string }> = {
    admin: { bg: '#FEF2F2', color: '#DC2626' },
    accountant: { bg: '#EDE9FE', color: '#7C3AED' },
    viewer: { bg: '#F1F5F9', color: '#64748B' },
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Company Info */}
        <div style={card}>
          {sectionHeader(<Building2 style={{ width: 18, height: 18, color: '#7C3AED' }} />, '#EDE9FE', 'Company Information', 'Basic details about your business')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingCompany ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Company Name</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="My Business" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@mybusiness.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Currency</label>
                    <Select value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="CAD">CAD — Canadian Dollar</option>
                    </Select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Fiscal Year Start</label>
                    <Select value={fiscalYearStart} onChange={e => setFiscalYearStart(e.target.value)}>
                      {FISCAL_MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <Button
                    onClick={saveCompanySettings}
                    disabled={savingCompany}
                    className="cursor-pointer"
                    style={{ padding: '0 20px' }}
                  >
                    {savingCompany ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sales Tax */}
        <div style={card}>
          {sectionHeader(<Receipt style={{ width: 18, height: 18, color: '#059669' }} />, '#ECFDF5', 'Sales Tax', 'Configure tax rates for invoices and transactions')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>Enable Sales Tax</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Automatically apply tax to new invoices</p>
              </div>
              <button
                onClick={() => setTaxEnabled(!taxEnabled)}
                className="cursor-pointer"
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  background: taxEnabled ? '#7C3AED' : '#E2E8F0',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: taxEnabled ? 22 : 2,
                  width: 20, height: 20, borderRadius: 10, background: '#FFFFFF',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }} />
              </button>
            </div>
            {taxEnabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax Name</label>
                    <Input value={taxName} onChange={e => setTaxName(e.target.value)} placeholder="Sales Tax" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Default Rate (%)</label>
                    <Input type="number" step="0.001" value={defaultTaxRate} onChange={e => setDefaultTaxRate(e.target.value)} />
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: 12, color: '#64748B' }}>
                    Tax will be calculated at <strong style={{ color: '#0F172A' }}>{defaultTaxRate}%</strong> ({taxName}) on all new invoices. You can override the rate per invoice.
                  </p>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <Button
                    onClick={saveTaxSettings}
                    disabled={savingTax}
                    className="cursor-pointer"
                    style={{ padding: '0 20px' }}
                  >
                    {savingTax ? 'Saving...' : 'Save Tax Settings'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team & Roles */}
        <div style={card}>
          {sectionHeader(<Users style={{ width: 18, height: 18, color: '#2563EB' }} />, '#EFF6FF', 'Team & Roles', 'Manage who has access to your account')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current team */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {team.map((member, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 0', borderBottom: i < team.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{member.name}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{member.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize',
                      ...roleColors[member.role] || roleColors.viewer,
                    }}>
                      {member.role}
                    </span>
                    {member.role !== 'admin' && (
                      <button onClick={() => removeTeamMember(i)} className="cursor-pointer" style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: 4 }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite new member */}
            <div style={{ padding: 16, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10 }}>Invite Team Member</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <Select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-32">
                  <option value="viewer">Viewer</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </Select>
                <Button onClick={addTeamMember} className="cursor-pointer shrink-0" size="sm">
                  <Mail style={{ width: 14, height: 14, marginRight: 6 }} /> Invite
                </Button>
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, color: '#92400E' }}>
                <strong>Role permissions:</strong> Admin — full access. Accountant — manage transactions, invoices, reports. Viewer — read-only access to dashboards and reports.
              </p>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div style={card}>
          {sectionHeader(<CreditCard style={{ width: 18, height: 18, color: '#8B5CF6' }} />, '#F5F3FF', 'Connected Accounts', 'Link your bank accounts for automatic import')}
          <div>
            {settingRow('Bank Connection', 'Connect via Plaid for automatic transaction import', badge('Coming Soon', 'coming'))}
            {settingRow('CSV Import', 'Upload bank statements manually', badge('Available', 'available'), false)}
          </div>
        </div>

        {/* Notifications */}
        <div style={card}>
          {sectionHeader(<Bell style={{ width: 18, height: 18, color: '#D97706' }} />, '#FEF3C7', 'Notifications', 'Configure how and when you receive alerts')}
          <div>
            {settingRow('Invoice Reminders', 'Automatically email clients when invoices are overdue', badge('Coming Soon', 'coming'))}
            {settingRow('Spending Alerts', 'AI-powered alerts for unusual spending patterns', badge('Coming Soon', 'coming'), false)}
          </div>
        </div>

        {/* Data & Export */}
        <div style={card}>
          {sectionHeader(<Database style={{ width: 18, height: 18, color: '#059669' }} />, '#ECFDF5', 'Data & Export', 'Export your data or manage backups')}
          {settingRow(
            'Export All Data',
            'Download all transactions and invoices as CSV',
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer shrink-0"
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>,
            false
          )}
        </div>

        {/* Security */}
        <div style={card}>
          {sectionHeader(<Shield style={{ width: 18, height: 18, color: '#F59E0B' }} />, '#FFFBEB', 'Security', 'Authentication and access control')}
          <div>
            {settingRow('Two-Factor Authentication', 'Add an extra layer of security to your account', badge('Coming Soon', 'coming'))}
            {settingRow('Session Management', 'View and manage active sessions', badge('Coming Soon', 'coming'), false)}
          </div>
        </div>
      </div>
    </div>
  );
}
