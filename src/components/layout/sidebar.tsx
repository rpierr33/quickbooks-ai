"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}
interface Section {
  title: string;
  items: NavItem[];
}

const sections: Section[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/ai", label: "Ask Ledgr", badge: "NEW" },
      { href: "/activity", label: "Activity" },
    ],
  },
  {
    title: "Money flow",
    items: [
      { href: "/transactions", label: "Transactions" },
      { href: "/invoices", label: "Invoices" },
      { href: "/bills", label: "Bills" },
      { href: "/estimates", label: "Estimates" },
      { href: "/recurring", label: "Recurring" },
      { href: "/purchase-orders", label: "Purchase orders" },
      { href: "/scanner", label: "Scan receipts" },
      { href: "/import", label: "Import" },
    ],
  },
  {
    title: "Books",
    items: [
      { href: "/accounts", label: "Chart of accounts" },
      { href: "/journal", label: "Journal" },
      { href: "/reconciliation", label: "Reconciliation" },
      { href: "/reports", label: "Reports" },
      { href: "/budgets", label: "Budgets" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { href: "/mileage", label: "Mileage" },
      { href: "/time-tracking", label: "Time" },
      { href: "/inventory", label: "Inventory" },
      { href: "/projects", label: "Projects" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/clients", label: "Clients" },
      { href: "/contractors", label: "Contractors" },
      { href: "/payroll", label: "Payroll" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/billing", label: "Subscription" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link href="/" className="brand">
        <div className="brand-word">Ledgr</div>
        <div className="brand-sub">Smart accounting</div>
      </Link>

      <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sections.map((section) => (
          <React.Fragment key={section.title}>
            <div className="nav-section">
              <div className="nav-section-label">{section.title}</div>
            </div>
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={"nav-item " + (active ? "active" : "")}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="dot">{item.badge}</span>}
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="account-chip"
          aria-label="Sign out"
          style={{ width: "100%", textAlign: "left" }}
        >
          <div className="avatar" aria-hidden="true">{initial}</div>
          <div className="meta">
            <b>{userName}</b>
            <span>{userEmail || "Sign out"}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

const MOBILE_PRIMARY: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Trans" },
  { href: "/invoices", label: "Invoices" },
  { href: "/ai", label: "Ask" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primarySet = new Set(MOBILE_PRIMARY.map((i) => i.href));
  const isMoreActive = !MOBILE_PRIMARY.some((i) => isActive(pathname, i.href));

  return (
    <>
      <nav className="mobile-nav" aria-label="Bottom navigation">
        <div className="mobile-nav-inner">
          {MOBILE_PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={"mobile-nav-item " + (active ? "active" : "")}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={"mobile-nav-item " + (isMoreActive ? "active" : "")}
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(23,21,16,0.45)",
          }}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="All navigation"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 101,
          background: "var(--paper-2)",
          borderTop: "1px solid var(--rule)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
          maxHeight: "82dvh",
          overflowY: "auto",
          boxShadow: "0 -8px 32px rgba(23,21,16,0.12)",
        }}
      >
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--stamp)", fontWeight: 500, marginBottom: 4 }}>All sections</div>
            <div className="h2" style={{ fontSize: 24 }}>Navigate</div>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav aria-label="Extended navigation" style={{ padding: "8px 14px 20px" }}>
          {sections.map((section) => {
            const items = section.items.filter((i) => !primarySet.has(i.href));
            if (items.length === 0) return null;
            return (
              <div key={section.title} style={{ marginBottom: 10 }}>
                <div className="nav-section-label" style={{ padding: "12px 10px 6px" }}>
                  {section.title}
                </div>
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={"nav-item " + (active ? "active" : "")}
                    >
                      <span>{item.label}</span>
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
