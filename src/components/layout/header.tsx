"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your finances" },
  "/transactions": { title: "Transactions", subtitle: "All income and expenses" },
  "/accounts": { title: "Chart of Accounts", subtitle: "Assets, liabilities & equity" },
  "/journal": { title: "Journal Entries", subtitle: "Manual double-entry adjustments" },
  "/reconciliation": { title: "Bank Reconciliation", subtitle: "Match bank statements" },
  "/invoices": { title: "Invoices", subtitle: "Manage client billing" },
  "/estimates": { title: "Estimates & Quotes", subtitle: "Proposals that convert to invoices" },
  "/recurring": { title: "Recurring", subtitle: "Scheduled transactions & invoices" },
  "/inventory": { title: "Inventory", subtitle: "Products, stock & COGS" },
  "/budgets": { title: "Budgets", subtitle: "Budget vs actual spending" },
  "/reports": { title: "Reports", subtitle: "Financial analysis & statements" },
  "/activity": { title: "Activity Log", subtitle: "Audit trail of all changes" },
  "/import": { title: "Import", subtitle: "Import transactions from CSV" },
  "/scanner": { title: "Receipt Scanner", subtitle: "AI-powered receipt & invoice scanning" },
  "/settings": { title: "Settings", subtitle: "Account preferences" },
  "/ai": { title: "AI Assistant", subtitle: "Ask anything about your data" },
  "/clients": { title: "Clients & Vendors", subtitle: "Manage contacts, balances & history" },
  "/billing": { title: "Billing & Plans", subtitle: "Subscription management" },
  "/onboarding": { title: "Get Started", subtitle: "Set up your Ledgr account" },
};

export function Header() {
  const pathname = usePathname();
  const config = pageConfig[pathname] || pageConfig["/"];
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get user initials from session
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0' }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64, paddingLeft: 32, paddingRight: 24,
        }}
      >
        {/* Left: page title */}
        <div className="flex items-center gap-3">
          <div
            className="flex md:hidden items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#7C3AED' }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>L</span>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{config.title}</h1>
            <p className="hidden sm:block" style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{config.subtitle}</p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <button
            className="cursor-pointer transition-colors"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, color: '#94A3B8', background: 'transparent', border: '1px solid transparent', fontSize: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            aria-label="Search"
          >
            <Search style={{ width: 16, height: 16 }} />
            <span className="hidden sm:inline" style={{ color: '#CBD5E1' }}>Search...</span>
            <kbd className="hidden sm:inline" style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#94A3B8', fontFamily: 'inherit', marginLeft: 8 }}>&#8984;K</kbd>
          </button>

          {/* Notifications */}
          <button
            className="relative cursor-pointer transition-colors"
            style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Notifications"
          >
            <Bell style={{ width: 18, height: 18 }} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: 99,
              background: '#EF4444',
              boxShadow: '0 0 0 2px white',
            }} />
          </button>

          {/* Avatar with dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="cursor-pointer"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(124,58,237,0.2)',
                border: 'none',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{initials}</span>
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute', top: 42, right: 0,
                  width: 240, background: '#FFFFFF',
                  borderRadius: 12, border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  overflow: 'hidden', zIndex: 50,
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{userName}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{userEmail}</p>
                </div>
                <div style={{ padding: 6 }}>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="cursor-pointer"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8, border: 'none',
                      background: 'transparent', color: '#EF4444', fontSize: 13,
                      fontWeight: 500, textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut style={{ width: 16, height: 16 }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
