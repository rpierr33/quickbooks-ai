"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Bell, Database, Receipt, Users, Trash2, Mail, Link2, RefreshCcw, CheckCircle2, AlertCircle, Copy, UserCheck, Layers } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { exportTransactions, exportInvoices } from "@/lib/export";
import { PlaidLink } from "@/components/plaid-link";
import type { UserRole } from "@/lib/roles";
import { ROLE_LABELS, ALL_ROLES } from "@/lib/roles";
import { useSession } from "next-auth/react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

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
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending';
  is_demo?: boolean;
}

const FISCAL_MONTHS = [
  { label: 'January', value: 'january' },
  { label: 'April', value: 'april' },
  { label: 'July', value: 'july' },
  { label: 'October', value: 'october' },
];

// TAX_SETTINGS_KEY kept as constant for any lingering localStorage reads — settings now server-side

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner: { bg: '#FEF2F2', color: '#DC2626' },
  admin: { bg: '#FFF7ED', color: '#C2410C' },
  editor: { bg: '#EFF6FF', color: '#2563EB' },
  accountant: { bg: '#EDE9FE', color: '#7C3AED' },
  viewer: { bg: '#F1F5F9', color: '#64748B' },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  const actorRole = ((session?.user as { role?: UserRole } | undefined)?.role ?? 'owner') as UserRole;
  const canManage = actorRole === 'owner' || actorRole === 'admin';

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fiscalYearStart, setFiscalYearStart] = useState('january');
  const [savingCompany, setSavingCompany] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [taxEnabled, setTaxEnabled] = useState(true);
  const [defaultTaxRate, setDefaultTaxRate] = useState('8.875');
  const [taxName, setTaxName] = useState('Sales Tax');
  const [savingTax, setSavingTax] = useState(false);

  const [plaidConfigured, setPlaidConfigured] = useState<boolean | null>(null);
  const [plaidConnections, setPlaidConnections] = useState<number>(0);
  const [syncingPlaid, setSyncingPlaid] = useState(false);

  // White-label state
  const [wlEnabled, setWlEnabled] = useState(false);
  const [wlLogo, setWlLogo] = useState<string | null>(null);
  const [wlFooter, setWlFooter] = useState('');
  const [savingWl, setSavingWl] = useState(false);
  const wlFileRef = useRef<HTMLInputElement>(null);

  const loadPlaidStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/plaid');
      if (res.ok) {
        const data = await res.json();
        setPlaidConfigured(data.configured);
        setPlaidConnections(data.connections ?? 0);
      }
    } catch {
      setPlaidConfigured(false);
    }
  }, []);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setTeamError(err.error ?? 'Failed to load team');
      }
    } catch {
      setTeamError('Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      // Load company info
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
        // non-critical
      } finally {
        setLoadingCompany(false);
      }

      // Load tax + white-label settings from API
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.tax_name) setTaxName(data.tax_name);
          if (data.tax_rate !== undefined && data.tax_rate !== null) {
            setDefaultTaxRate(String(data.tax_rate));
            // If tax_rate > 0, treat tax as enabled
            if (parseFloat(String(data.tax_rate)) > 0) setTaxEnabled(true);
          }
          setWlEnabled(data.white_label_enabled ?? false);
          setWlLogo(data.white_label_logo ?? null);
          setWlFooter(data.white_label_footer ?? '');
        }
      } catch {
        // non-critical — UI keeps defaults
      }
    }
    loadAll();
    loadPlaidStatus();
    loadTeam();
  }, [loadPlaidStatus, loadTeam]);

  const saveCompanySettings = async () => {
    if (!companyName.trim()) { toast('Company name is required', 'error'); return; }
    setSavingCompany(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), email: email.trim() || undefined, fiscalYearStart }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      toast('Company settings saved');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save company settings', 'error');
    } finally { setSavingCompany(false); }
  };

  const saveTaxSettings = async () => {
    setSavingTax(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_name: taxName,
          tax_rate: taxEnabled ? parseFloat(defaultTaxRate) || 0 : 0,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      toast('Tax settings saved');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save tax settings', 'error');
    } finally {
      setSavingTax(false);
    }
  };

  const MAX_LOGO_BYTES = 150 * 1024; // 150 KB

  const handleWlLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return; }
    if (file.size > MAX_LOGO_BYTES) {
      toast('Logo must be under 150KB. Use SVG or a compressed PNG for best results.', 'error');
      // Reset the input so the user can try again
      if (e.target) e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setWlLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveWhiteLabel = async () => {
    setSavingWl(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          white_label_enabled: wlEnabled,
          white_label_logo: wlLogo,
          white_label_footer: wlFooter.trim() || null,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      toast('White-label settings saved');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save white-label settings', 'error');
    } finally {
      setSavingWl(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast('Enter an email address', 'error'); return; }
    setInviting(true);
    setInviteLink(null);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? 'Failed to create invite', 'error'); return; }
      setInviteLink(data.invite_url ?? null);
      setInviteEmail('');
      toast('Invite created — copy the link to share');
      await loadTeam();
    } catch { toast('Failed to send invite', 'error'); }
    finally { setInviting(false); }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? 'Failed to update role', 'error'); return; }
      setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
      toast('Role updated');
    } catch { toast('Failed to update role', 'error'); }
    finally { setUpdatingRole(null); }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/team/${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? 'Failed to remove member', 'error'); return; }
      setTeam(prev => prev.filter(m => m.id !== userId));
      toast('Team member removed');
    } catch { toast('Failed to remove member', 'error'); }
    finally { setRemovingId(null); }
  };

  const handleExportCSV = async () => {
    try {
      const [txRes, invRes] = await Promise.all([fetch('/api/transactions'), fetch('/api/invoices')]);
      if (txRes.ok) exportTransactions(await txRes.json());
      if (invRes.ok) exportInvoices(await invRes.json());
      toast('Export complete');
    } catch { toast('Export failed', 'error'); }
  };

  const assignableOptions = ALL_ROLES.filter(r => {
    if (actorRole === 'owner') return true;
    if (actorRole === 'admin') return r !== 'owner' && r !== 'admin';
    return false;
  });

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
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                      ))}
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
                  <Button onClick={saveCompanySettings} disabled={savingCompany} className="cursor-pointer" style={{ padding: '0 20px' }}>
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
              <button onClick={() => setTaxEnabled(!taxEnabled)} className="cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: taxEnabled ? '#7C3AED' : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 2, left: taxEnabled ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
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
                  <p style={{ fontSize: 12, color: '#64748B' }}>Tax will be calculated at <strong style={{ color: '#0F172A' }}>{defaultTaxRate}%</strong> ({taxName}) on all new invoices.</p>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <Button onClick={saveTaxSettings} disabled={savingTax} className="cursor-pointer" style={{ padding: '0 20px' }}>{savingTax ? 'Saving...' : 'Save Tax Settings'}</Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team & Roles */}
        <div style={card}>
          {sectionHeader(<Users style={{ width: 18, height: 18, color: '#2563EB' }} />, '#EFF6FF', 'Team & Roles', 'Manage who has access to your account')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {teamLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading team...</div>
            ) : teamError ? (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>{teamError}</div>
            ) : team.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No team members yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {team.map((member, i) => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: i < team.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7C3AED, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{member.name}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{member.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {member.status === 'pending' && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#FEF3C7', color: '#92400E' }}>Pending</span>
                      )}
                      {canManage && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          disabled={updatingRole === member.id}
                          onChange={e => handleRoleChange(member.id, e.target.value as UserRole)}
                          style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid #E2E8F0', background: ROLE_COLORS[member.role]?.bg ?? '#F1F5F9', color: ROLE_COLORS[member.role]?.color ?? '#64748B', cursor: 'pointer', textTransform: 'capitalize' }}
                        >
                          {assignableOptions.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', ...(ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer) }}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      )}
                      {canManage && member.role !== 'owner' && (
                        <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id} className="cursor-pointer" style={{ color: '#94A3B8', background: 'transparent', border: 'none', padding: 4, opacity: removingId === member.id ? 0.5 : 1 }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canManage && (
              <div style={{ padding: 16, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10 }}>Invite Team Member</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                  </div>
                  <Select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="w-36">
                    {assignableOptions.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </Select>
                  <Button onClick={handleInvite} disabled={inviting} className="cursor-pointer shrink-0" size="sm">
                    <Mail style={{ width: 14, height: 14, marginRight: 6 }} />
                    {inviting ? 'Inviting...' : 'Invite'}
                  </Button>
                </div>
                {inviteLink && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#EDE9FE', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserCheck style={{ width: 14, height: 14, color: '#7C3AED', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#6D28D9', flex: 1, wordBreak: 'break-all' }}>{inviteLink}</p>
                    <button onClick={() => { navigator.clipboard.writeText(inviteLink).then(() => toast('Invite link copied')); }} className="cursor-pointer" style={{ background: 'transparent', border: 'none', color: '#7C3AED', padding: 4, flexShrink: 0 }} title="Copy invite link">
                      <Copy style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: 12, borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, color: '#92400E' }}>
                <strong>Role permissions:</strong> Owner — full access. Admin — full access + manage users. Editor — create/edit records. Accountant — read + journal entries. Viewer — read-only.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Connections */}
        <div style={card}>
          {sectionHeader(<Link2 style={{ width: 18, height: 18, color: '#8B5CF6' }} />, '#F5F3FF', 'Bank Connections', 'Link your bank accounts for automatic transaction import')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plaidConfigured === false && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <AlertCircle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>Plaid API keys not configured</p>
                  <p style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Add <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>PLAID_CLIENT_ID</code> and <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>PLAID_SECRET</code> to <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>.env.local</code> to enable bank connections.</p>
                </div>
              </div>
            )}
            {plaidConfigured === true && plaidConnections > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: '#16A34A', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>{plaidConnections} bank connection{plaidConnections !== 1 ? 's' : ''} active</p>
                <button onClick={async () => { setSyncingPlaid(true); try { toast('Sync started — transactions will appear shortly'); } finally { setSyncingPlaid(false); } }} disabled={syncingPlaid} className="cursor-pointer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#16A34A', background: 'transparent', border: '1px solid #86EFAC', borderRadius: 6, padding: '4px 10px', opacity: syncingPlaid ? 0.6 : 1 }}>
                  <RefreshCcw style={{ width: 12, height: 12 }} />{syncingPlaid ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            )}
            <PlaidLink />
            <div style={{ paddingTop: 4, borderTop: '1px solid #F1F5F9' }}>
              {settingRow('CSV Import', 'Upload bank statements manually via the Import page', badge('Available', 'available'), false)}
            </div>
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
          {settingRow('Export All Data', 'Download all transactions and invoices as CSV', <Button variant="outline" size="sm" className="cursor-pointer shrink-0" onClick={handleExportCSV}>Export CSV</Button>, false)}
        </div>

        {/* White-Label Branding */}
        <div style={card}>
          {sectionHeader(<Layers style={{ width: 18, height: 18, color: '#6366F1' }} />, '#EEF2FF', 'White-Label Branding', 'Remove Ledgr branding from invoices and use your own')}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>Enable White-Label</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Remove &ldquo;Powered by Ledgr&rdquo; from invoice PDFs</p>
              </div>
              <button
                onClick={() => setWlEnabled(!wlEnabled)}
                className="cursor-pointer"
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: wlEnabled ? '#6366F1' : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: 2, left: wlEnabled ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              </button>
            </div>

            {wlEnabled && (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Custom Logo (optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {wlLogo && (
                      <img src={wlLogo} alt="Custom logo" style={{ height: 40, maxWidth: 160, objectFit: 'contain', border: '1px solid #E2E8F0', borderRadius: 6, background: '#F8FAFC', padding: 4 }} />
                    )}
                    <Button variant="outline" size="sm" className="cursor-pointer shrink-0" onClick={() => wlFileRef.current?.click()}>
                      {wlLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {wlLogo && (
                      <button onClick={() => setWlLogo(null)} className="cursor-pointer" style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>PNG, JPG, SVG — max 512 KB</p>
                  <input ref={wlFileRef} type="file" accept="image/*" onChange={handleWlLogoUpload} style={{ display: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Custom Footer Text (optional)</label>
                  <Input value={wlFooter} onChange={e => setWlFooter(e.target.value)} placeholder="e.g. Accounting services provided by Acme Corp" />
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Leave blank to show no footer.</p>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                  <p style={{ fontSize: 12, color: '#3730A3' }}>
                    <strong>Active:</strong>{' '}
                    {wlLogo ? 'Your custom logo will appear in the invoice header.' : 'Company name will appear as the header.'}
                    {!wlFooter.trim() ? ' No footer will be shown.' : ` Footer: "${wlFooter.trim()}"`}
                  </p>
                </div>
              </>
            )}

            <div style={{ paddingTop: 4 }}>
              <Button onClick={saveWhiteLabel} disabled={savingWl} className="cursor-pointer" style={{ padding: '0 20px' }}>
                {savingWl ? 'Saving...' : 'Save Branding Settings'}
              </Button>
            </div>
          </div>
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
