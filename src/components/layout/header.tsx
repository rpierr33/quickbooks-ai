"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut, Settings, ChevronDown, CreditCard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

/**
 * Route → title + subtitle mapping.
 * Dynamic routes (e.g. /invoices/123) fall back to the nearest match.
 */
const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  "/":               { title: "Dashboard",         subtitle: "Financial overview" },
  "/transactions":   { title: "Transactions",       subtitle: "All income and expenses" },
  "/accounts":       { title: "Chart of Accounts",  subtitle: "Assets, liabilities & equity" },
  "/journal":        { title: "Journal Entries",    subtitle: "Double-entry adjustments" },
  "/reconciliation": { title: "Reconciliation",     subtitle: "Match bank statements" },
  "/invoices":       { title: "Invoices",           subtitle: "Client billing" },
  "/estimates":      { title: "Estimates",          subtitle: "Proposals and quotes" },
  "/recurring":      { title: "Recurring",          subtitle: "Scheduled transactions" },
  "/inventory":      { title: "Inventory",          subtitle: "Products & stock" },
  "/budgets":        { title: "Budgets",            subtitle: "Budget vs actual" },
  "/reports":        { title: "Reports",            subtitle: "Financial statements" },
  "/activity":       { title: "Activity Log",       subtitle: "Audit trail" },
  "/import":         { title: "Import Data",        subtitle: "CSV import" },
  "/scanner":        { title: "Receipt Scanner",    subtitle: "AI-powered scanning" },
  "/settings":       { title: "Settings",           subtitle: "Account preferences" },
  "/ai":             { title: "AI Assistant",       subtitle: "Ask anything about your data" },
  "/clients":        { title: "Clients",            subtitle: "Contacts & balances" },
  "/billing":        { title: "Billing",            subtitle: "Subscription management" },
  "/onboarding":     { title: "Get Started",        subtitle: "Set up your account" },
  "/projects":       { title: "Projects",           subtitle: "Track project profitability" },
  "/payroll":        { title: "Payroll",            subtitle: "Employee payments" },
  "/contractors":    { title: "Contractors",        subtitle: "1099 management" },
  "/bills":          { title: "Bills",              subtitle: "Accounts payable" },
  "/time-tracking":  { title: "Time Tracking",      subtitle: "Billable hours" },
  "/mileage":        { title: "Mileage",            subtitle: "Vehicle expense tracking" },
  "/purchase-orders":{ title: "Purchase Orders",    subtitle: "PO management" },
};

function resolvePageConfig(pathname: string) {
  // Exact match
  if (pageConfig[pathname]) return pageConfig[pathname];
  // Nearest prefix match (e.g. /invoices/new → /invoices)
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 0) {
    const key = '/' + segments.join('/');
    if (pageConfig[key]) return pageConfig[key];
    segments.pop();
  }
  return { title: "Ledgr", subtitle: undefined };
}

export function Header() {
  const pathname   = usePathname();
  const router     = useRouter();
  const config     = resolvePageConfig(pathname);
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);

  const userName  = session?.user?.name  || "User";
  const userEmail = session?.user?.email || "";
  const initials  = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu, handleOutsideClick]);

  // Close on route change
  useEffect(() => { setShowMenu(false); }, [pathname]);

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(248, 250, 252, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          paddingLeft: 28,
          paddingRight: 20,
        }}
      >
        {/* ── Left: Mobile logo + page title ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mobile logo (hidden on md+) */}
          <div
            aria-hidden="true"
            className="flex md:hidden"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 1px 4px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>L</span>
          </div>

          {/* Page title */}
          <div>
            <h1 style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}>
              {config.title}
            </h1>
            {config.subtitle && (
              <p
                className="hidden sm:block"
                style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, lineHeight: 1 }}
              >
                {config.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Search, notifications, user ──────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Search button — ⌘K shortcut placeholder */}
          <button
            className="cursor-pointer hidden sm:flex"
            onClick={() => {
              // Global search — navigates to transactions as the search hub for now
              router.push('/transactions');
            }}
            aria-label="Search transactions (⌘K)"
            style={{
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              color: '#94A3B8',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1,
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              cursor: 'text',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD5E1';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <Search style={{ width: 13, height: 13, flexShrink: 0 }} />
            <span style={{ color: '#CBD5E1', whiteSpace: 'nowrap' }}>Search...</span>
            <kbd style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 4,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#94A3B8',
              fontFamily: 'inherit',
              marginLeft: 4,
              lineHeight: 1.6,
            }}>
              &#8984;K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            className="cursor-pointer relative"
            aria-label="Notifications"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              background: 'transparent',
              border: 'none',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
              (e.currentTarget as HTMLButtonElement).style.color = '#334155';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
            }}
          >
            <Bell aria-hidden="true" style={{ width: 16, height: 16 }} />
            {/* Unread indicator */}
            <span
              aria-label="3 unread notifications"
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 0 2px rgba(248, 250, 252, 0.9)',
              }}
            />
          </button>

          {/* User avatar + dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(s => !s)}
              className="cursor-pointer"
              aria-label="User menu"
              aria-expanded={showMenu}
              aria-haspopup="menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px 4px 4px',
                borderRadius: 8,
                background: showMenu ? '#F1F5F9' : 'transparent',
                border: '1px solid',
                borderColor: showMenu ? '#E2E8F0' : 'transparent',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                if (!showMenu) {
                  el.style.background = '#F1F5F9';
                  el.style.borderColor = '#E2E8F0';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                if (!showMenu) {
                  el.style.background = 'transparent';
                  el.style.borderColor = 'transparent';
                }
              }}
            >
              {/* Avatar */}
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{initials}</span>
              </div>
              <span
                className="hidden sm:block"
                style={{ fontSize: 13, fontWeight: 500, color: '#334155', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {userName.split(' ')[0]}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="hidden sm:block"
                style={{
                  width: 13,
                  height: 13,
                  color: '#94A3B8',
                  transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div
                role="menu"
                aria-label="User menu"
                className="animate-slide-up"
                style={{
                  position: 'absolute',
                  top: 42,
                  right: 0,
                  width: 220,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.08), 0 10px 32px -4px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}
              >
                {/* User info */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName}
                  </p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userEmail}
                  </p>
                </div>

                {/* Menu items */}
                <div style={{ padding: '4px 6px' }}>
                  <MenuButton
                    icon={<Settings aria-hidden="true" style={{ width: 14, height: 14 }} />}
                    label="Settings"
                    onClick={() => { router.push('/settings'); setShowMenu(false); }}
                  />
                  <MenuButton
                    icon={<CreditCard aria-hidden="true" style={{ width: 14, height: 14 }} />}
                    label="Billing"
                    onClick={() => { router.push('/billing'); setShowMenu(false); }}
                  />
                </div>

                {/* Sign out — separated */}
                <div style={{ padding: '4px 6px 6px', borderTop: '1px solid #F1F5F9' }}>
                  <MenuButton
                    icon={<LogOut aria-hidden="true" style={{ width: 14, height: 14 }} />}
                    label="Sign Out"
                    danger
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Small internal component ──────────────────────────────────────────────────

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuButton({ icon, label, onClick, danger = false }: MenuButtonProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="cursor-pointer w-full"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 7,
        border: 'none',
        background: 'transparent',
        color: danger ? '#EF4444' : '#334155',
        fontSize: 13,
        fontWeight: 400,
        textAlign: 'left',
        transition: 'background 150ms ease',
        width: '100%',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? '#FEF2F2' : '#F1F5F9';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}
