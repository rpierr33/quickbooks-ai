"use client";
import React, { useState } from "react";
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
  MoreHorizontal,
  X,
  ChevronRight,
} from "lucide-react";

interface NavSection {
  title: string;
  items: { href: string; icon: React.ElementType; label: string }[];
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

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col"
      style={{ width: 240, background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)" }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        style={{
          display: "flex", alignItems: "center", height: 64,
          padding: "0 20px", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>L</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Ledgr</span>
      </div>

      {/* Navigation */}
      <nav
        style={{ flex: 1, padding: "16px 12px 12px", overflowY: "auto" }}
        aria-label="Sidebar navigation"
      >
        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.12em", color: "#475569", padding: "0 14px 8px",
              }}
              aria-hidden="true"
            >
              {section.title}
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: active ? "10px 14px" : "10px 16px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        transition: "all 0.15s",
                        background: active ? "rgba(124,58,237,0.15)" : "transparent",
                        color: active ? "#FFFFFF" : "#94A3B8",
                        borderLeft: active ? "3px solid #A78BFA" : "3px solid transparent",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.color = "#E2E8F0";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#94A3B8";
                        }
                      }}
                    >
                      <item.icon
                        aria-hidden="true"
                        style={{ width: 18, height: 18, color: active ? "#A78BFA" : "#64748B", flexShrink: 0 }}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* AI Assistant CTA */}
      <div style={{ padding: "0 12px 20px" }}>
        <Link
          href="/ai"
          aria-current={pathname === "/ai" ? "page" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
            background: pathname === "/ai"
              ? "linear-gradient(135deg, #7C3AED, #9333EA)"
              : "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(147,51,234,0.15))",
            color: pathname === "/ai" ? "#FFFFFF" : "#C4B5FD",
            border: pathname === "/ai" ? "none" : "1px solid rgba(167,139,250,0.2)",
            textDecoration: "none",
            boxShadow: pathname === "/ai" ? "0 4px 12px rgba(124,58,237,0.3)" : "none",
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/ai") {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(147,51,234,0.25))";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/ai") {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(147,51,234,0.15))";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)";
            }
          }}
        >
          <div style={{ position: "relative" }} aria-hidden="true">
            <Sparkles style={{ width: 18, height: 18 }} />
            {pathname !== "/ai" && (
              <span
                style={{
                  position: "absolute", top: -2, right: -2,
                  width: 6, height: 6, borderRadius: "50%", background: "#A78BFA",
                }}
              />
            )}
          </div>
          <span>AI Assistant</span>
        </Link>
      </div>
    </aside>
  );
}

// ─── Mobile Nav primary items ─────────────────────────────────────────────────
const MOBILE_PRIMARY: { href: string; icon: React.ElementType; label: string }[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/scanner", icon: ScanLine, label: "Scan" },
];

const primaryHrefSet = new Set(MOBILE_PRIMARY.map((i) => i.href));

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMoreActive = !MOBILE_PRIMARY.some((i) => isActive(i.href)) && pathname !== "/ai";

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderTop: "1px solid #E5E7EB",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Bottom navigation"
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-around",
            height: 56,
            maxWidth: 480,
            margin: "0 auto",
            padding: "0 4px",
          }}
        >
          {/* Primary items */}
          {MOBILE_PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 3, padding: "4px 8px",
                  textDecoration: "none",
                  color: active ? "#7C3AED" : "#9CA3AF",
                  flex: 1, position: "relative",
                  minWidth: 44,
                }}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute", top: 0, left: "50%",
                      transform: "translateX(-50%)",
                      width: 24, height: 3, borderRadius: "0 0 4px 4px",
                      background: "#7C3AED",
                    }}
                  />
                )}
                <item.icon aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: "-0.01em" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* AI */}
          <Link
            href="/ai"
            aria-current={pathname === "/ai" ? "page" : undefined}
            aria-label="AI Assistant"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, padding: "4px 8px",
              textDecoration: "none",
              color: pathname === "/ai" ? "#7C3AED" : "#9CA3AF",
              flex: 1, minWidth: 44,
            }}
          >
            <Sparkles aria-hidden="true" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 10, fontWeight: pathname === "/ai" ? 700 : 400 }}>AI</span>
          </Link>

          {/* More */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, padding: "4px 8px",
              background: "none", border: "none", cursor: "pointer",
              color: isMoreActive ? "#7C3AED" : "#9CA3AF",
              flex: 1, minWidth: 44,
            }}
          >
            <MoreHorizontal aria-hidden="true" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 10, fontWeight: isMoreActive ? 700 : 400 }}>More</span>
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {moreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
          }}
          className="md:hidden"
        />
      )}

      {/* More sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All navigation options"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 101,
          background: "#FFFFFF",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
          maxHeight: "80dvh",
          overflowY: "auto",
        }}
        className="md:hidden"
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 99, background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 4px",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>All Features</h2>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#F3F4F6", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 44, minHeight: 44,
            }}
          >
            <X aria-hidden="true" style={{ width: 16, height: 16, color: "#374151" }} />
          </button>
        </div>

        {/* Grouped items */}
        <nav aria-label="Extended navigation" style={{ padding: "8px 12px 8px" }}>
          {navSections.map((section) => {
            const sectionItems = section.items.filter(
              (i) => !primaryHrefSet.has(i.href)
            );
            if (sectionItems.length === 0) return null;
            return (
              <div key={section.title} style={{ marginBottom: 8 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#9CA3AF",
                  padding: "4px 10px 6px",
                }}>
                  {section.title}
                </p>
                {sectionItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 10px", borderRadius: 12,
                        color: active ? "#7C3AED" : "#111827",
                        background: active ? "#F5F3FF" : "transparent",
                        textDecoration: "none", minHeight: 48,
                        fontSize: 15, fontWeight: active ? 600 : 400,
                        transition: "background 0.1s",
                      }}
                    >
                      <item.icon
                        aria-hidden="true"
                        style={{ width: 20, height: 20, color: active ? "#7C3AED" : "#6B7280", flexShrink: 0 }}
                      />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <ChevronRight
                        aria-hidden="true"
                        style={{ width: 14, height: 14, color: "#D1D5DB", flexShrink: 0 }}
                      />
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
