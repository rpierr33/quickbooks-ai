"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Scale,
  Settings,
  Sparkles,
  Landmark,
  Repeat,
  Clock,
  FileCheck,
  Target,
  Upload,
  BookOpen,
  Package,
  Users,
  CreditCard,
  ScanLine,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/scanner", icon: ScanLine, label: "Receipt Scanner" },
  { href: "/clients", icon: Users, label: "Clients & Vendors" },
  { href: "/accounts", icon: Landmark, label: "Accounts" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/reconciliation", icon: Scale, label: "Reconcile" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/estimates", icon: FileCheck, label: "Estimates" },
  { href: "/recurring", icon: Repeat, label: "Recurring" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/activity", icon: Clock, label: "Activity Log" },
  { href: "/import", icon: Upload, label: "Import" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

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

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '20px 12px 12px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', padding: '0 14px 10px' }}>
          Menu
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="cursor-pointer"
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: isActive ? '10px 14px' : '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                  background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  borderLeft: isActive ? '3px solid #A78BFA' : '3px solid transparent',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#E2E8F0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <item.icon
                  className="shrink-0"
                  style={{ width: 18, height: 18, color: isActive ? '#A78BFA' : '#64748B' }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant CTA — prominent */}
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
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 12px', textDecoration: 'none', position: 'relative',
                color: isActive ? '#7C3AED' : '#94A3B8',
              }}
            >
              {isActive && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: 99, background: '#7C3AED' }} />
              )}
              <item.icon style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
