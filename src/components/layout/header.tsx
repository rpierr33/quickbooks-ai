"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const pageTitles: Record<string, string> = {
  "/":                "Dashboard",
  "/transactions":    "Transactions",
  "/invoices":        "Invoices",
  "/ai":              "Ask Ledgr",
  "/accounts":        "Chart of accounts",
  "/journal":         "Journal",
  "/reports":         "Reports",
  "/reconciliation":  "Reconciliation",
  "/budgets":         "Budgets",
  "/bills":           "Bills",
  "/estimates":       "Estimates",
  "/recurring":       "Recurring",
  "/purchase-orders": "Purchase orders",
  "/clients":         "Clients",
  "/contractors":     "Contractors",
  "/payroll":         "Payroll",
  "/scanner":         "Scan receipts",
  "/import":          "Import",
  "/inventory":       "Inventory",
  "/projects":        "Projects",
  "/mileage":         "Mileage",
  "/time-tracking":   "Time",
  "/activity":        "Activity",
  "/settings":        "Settings",
  "/billing":         "Subscription",
  "/onboarding":      "Get started",
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    const key = "/" + segments.join("/");
    if (pageTitles[key]) return pageTitles[key];
    segments.pop();
  }
  return "Ledgr";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = resolveTitle(pathname);
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showMenu) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu, handleOutsideClick]);

  useEffect(() => { setShowMenu(false); }, [pathname]);

  return (
    <div className="topbar">
      <div className="folio">
        <b>{title}</b>
      </div>
      <div className="spacer" />
      <div className="date" aria-hidden="true">{formatDate(new Date())}</div>
      <button
        type="button"
        className="icon-btn"
        onClick={() => router.push("/transactions")}
        aria-label="Search"
      >
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", marginRight: 4 }}>⌘K</span>
        Search
      </button>
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowMenu((s) => !s)}
          aria-label="Account menu"
          aria-expanded={showMenu}
          aria-haspopup="menu"
          style={{ position: "relative" }}
        >
          🔔
          <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, background: "var(--stamp)", borderRadius: "50%", border: "2px solid var(--paper)" }} />
        </button>
        {showMenu && (
          <div
            role="menu"
            aria-label="User menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)", right: 0,
              width: 240,
              background: "var(--paper-2)",
              border: "1px solid var(--rule-strong)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--rule)" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                {userName}
              </div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                {userEmail}
              </div>
            </div>
            <div style={{ padding: "4px" }}>
              <MenuRow label="Settings" onClick={() => { router.push("/settings"); setShowMenu(false); }} />
              <MenuRow label="Subscription" onClick={() => { router.push("/billing"); setShowMenu(false); }} />
            </div>
            <div style={{ borderTop: "1px solid var(--rule)", padding: "4px" }}>
              <MenuRow label="Sign out" danger onClick={() => signOut({ callbackUrl: "/login" })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuRow({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        fontFamily: "var(--sans)",
        fontSize: 13,
        color: danger ? "var(--stamp)" : "var(--ink)",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        borderRadius: "var(--radius)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}
