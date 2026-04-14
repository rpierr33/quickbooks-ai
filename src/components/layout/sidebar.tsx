"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  Users,
  ScanLine,
  Receipt,
  DollarSign,
  CreditCard,
  BookOpen,
  Wallet,
  RefreshCcw,
  Package,
  Upload,
  FileCheck,
  Activity,
  Building2,
  Car,
  Clock,
  ShoppingCart,
  UserSquare2,
  Briefcase,
  CircleDollarSign,
} from "lucide-react";

interface NavSection {
  title: string;
  items: { href: string; icon: any; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    title: "Money In & Out",
    items: [
      { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
      { href: "/scanner", icon: ScanLine, label: "Scan Receipt" },
      { href: "/import", icon: Upload, label: "Import" },
      { href: "/invoices", icon: FileText, label: "Invoices" },
      { href: "/bills", icon: Building2, label: "Bills" },
      { href: "/estimates", icon: FileCheck, label: "Estimates" },
      { href: "/recurring", icon: Receipt, label: "Recurring" },
      { href: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { href: "/mileage", icon: Car, label: "Mileage" },
      { href: "/time-tracking", icon: Clock, label: "Time Tracking" },
    ],
  },
  {
    title: "Bookkeeping",
    items: [
      { href: "/accounts", icon: Wallet, label: "Accounts" },
      { href: "/journal", icon: BookOpen, label: "Journal Entries" },
      { href: "/reconciliation", icon: RefreshCcw, label: "Reconciliation" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/payroll", icon: CircleDollarSign, label: "Payroll" },
      { href: "/contractors", icon: UserSquare2, label: "Contractors" },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/clients", icon: Users, label: "Clients" },
      { href: "/projects", icon: Briefcase, label: "Projects" },
      { href: "/inventory", icon: Package, label: "Inventory" },
      { href: "/budgets", icon: DollarSign, label: "Budgets" },
      { href: "/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/billing", icon: CreditCard, label: "Billing" },
      { href: "/settings", icon: Settings, label: "Settings" },
      { href: "/activity", icon: Activity, label: "Activity Log" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col"
      style={{ width: 240, background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex', alignItems: 'center', height: 64,
          padding: '0 20px', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>L</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>Ledgr</span>
      </div>

      {/* Navigation — grouped sections */}
      <nav style={{ flex: 1, padding: '16px 12px 12px', overflowY: 'auto' }}>
        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#475569', padding: '0 14px 8px',
            }}>
              {section.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="cursor-pointer"
                    aria-current={active ? "page" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: active ? '10px 14px' : '10px 16px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                      background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                      color: active ? '#FFFFFF' : '#94A3B8',
                      borderLeft: active ? '3px solid #A78BFA' : '3px solid transparent',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#E2E8F0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94A3B8';
                      }
                    }}
                  >
                    <item.icon
                      className="shrink-0"
                      style={{ width: 18, height: 18, color: active ? '#A78BFA' : '#64748B' }}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AI Assistant CTA */}
      <div style={{ padding: '0 12px 20px' }}>
        <Link
          href="/ai"
          className="cursor-pointer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: pathname === "/ai"
              ? 'linear-gradient(135deg, #7C3AED, #9333EA)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(147,51,234,0.15))',
            color: pathname === "/ai" ? '#FFFFFF' : '#C4B5FD',
            border: pathname === "/ai" ? 'none' : '1px solid rgba(167,139,250,0.2)',
            textDecoration: 'none',
            boxShadow: pathname === "/ai" ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/ai") {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(147,51,234,0.25))';
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/ai") {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(147,51,234,0.15))';
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)';
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <Sparkles className="shrink-0" style={{ width: 18, height: 18 }} />
            {pathname !== "/ai" && (
              <span className="animate-pulse-subtle" style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#A78BFA' }} />
            )}
          </div>
          <span>AI Assistant</span>
        </Link>
      </div>
    </aside>
  );
}

const mobileItems = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Activity" },
  { href: "/scanner", icon: ScanLine, label: "Scan" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/ai", icon: Sparkles, label: "AI" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom"
      style={{ background: 'rgba(255,255,255,0.97)', borderTop: '1px solid #E2E8F0', backdropFilter: 'blur(12px)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 64, maxWidth: 420, margin: '0 auto' }}>
        {mobileItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 12px', textDecoration: 'none', position: 'relative',
                color: active ? '#7C3AED' : '#94A3B8',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: 99, background: '#7C3AED' }} />
              )}
              <item.icon style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
