"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Rocket,
} from "lucide-react";

interface ChecklistProps {
  hasTransactions: boolean;
  hasInvoices: boolean;
  hasVisitedReports: boolean;
  accountCreatedAt?: string | null; // ISO date string
}

const DISMISSED_KEY = "ledgr_checklist_dismissed";
const REPORTS_VISITED_KEY = "ledgr_reports_visited";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function setDismissed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // ignore
  }
}

export function markReportsVisited() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REPORTS_VISITED_KEY, "true");
  } catch {
    // ignore
  }
}

function hasVisitedReportsLocally(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REPORTS_VISITED_KEY) === "true";
  } catch {
    return false;
  }
}

// Show for first 60 days
function isWithin60Days(createdAt?: string | null): boolean {
  if (!createdAt) return true; // show if unknown
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 60;
}

export function GettingStartedChecklist({
  hasTransactions,
  hasInvoices,
  hasVisitedReports,
  accountCreatedAt,
}: ChecklistProps) {
  const [dismissed, setDismissedState] = useState(true); // true initially avoids flash
  const [mounted, setMounted] = useState(false);
  const [reportsVisited, setReportsVisited] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissedState(isDismissed());
    setReportsVisited(hasVisitedReportsLocally() || hasVisitedReports);
  }, [hasVisitedReports]);

  if (!mounted) return null;
  if (dismissed) return null;
  if (!isWithin60Days(accountCreatedAt)) return null;

  const steps: {
    id: string;
    label: string;
    description: string;
    done: boolean;
    href: string;
    cta: string;
  }[] = [
    {
      id: "account",
      label: "Create your account",
      description: "You're signed in and ready to go.",
      done: true,
      href: "#",
      cta: "",
    },
    {
      id: "company",
      label: "Set up your company",
      description: "Add your business name, logo, and details.",
      done: true, // completed via onboarding
      href: "/settings",
      cta: "Update details",
    },
    {
      id: "accounts",
      label: "Review your chart of accounts",
      description: "Your default accounts are set up. Customise them for your business.",
      done: true, // always set up from seed
      href: "/accounts",
      cta: "View accounts",
    },
    {
      id: "transaction",
      label: "Add your first transaction",
      description: "Record income or an expense to start tracking your finances.",
      done: hasTransactions,
      href: "/transactions",
      cta: "Add Transaction",
    },
    {
      id: "invoice",
      label: "Create your first invoice",
      description: "Send a professional invoice to a client and get paid.",
      done: hasInvoices,
      href: "/invoices",
      cta: "Create Invoice",
    },
    {
      id: "reports",
      label: "Review your first report",
      description: "See your P&L and understand your financial position.",
      done: reportsVisited,
      href: "/reports",
      cta: "View Reports",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progressPct = Math.round((completedCount / total) * 100);
  const allDone = completedCount === total;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        overflow: "hidden",
        marginBottom: 20,
        animation: "helpStepIn 300ms ease both",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid #F1F5F9",
          background: allDone
            ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
            : "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: allDone ? "#059669" : "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Rocket style={{ width: 16, height: 16, color: "#fff" }} aria-hidden="true" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {allDone ? "You're all set up!" : "Getting Started with Ledgr"}
            </h3>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
              {allDone
                ? "You've completed all setup steps. Your books are ready."
                : `${completedCount} of ${total} steps complete — you're making great progress`}
            </p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => {
            setDismissed();
            setDismissedState(true);
          }}
          aria-label="Dismiss getting started checklist"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid #E2E8F0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#fff")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.6)")
          }
        >
          <X style={{ width: 13, height: 13, color: "#64748B" }} aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "10px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginBottom: 5, fontWeight: 500 }}>
          <span>{progressPct}% complete</span>
          <span>{completedCount}/{total} steps</span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 99,
            background: "#F1F5F9",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              borderRadius: 99,
              background: allDone
                ? "#059669"
                : "linear-gradient(90deg, #3B82F6, #7C3AED)",
              transition: "width 600ms ease",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "8px 12px 12px" }}>
        {steps.map((step, i) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "9px 8px",
              borderRadius: 9,
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) =>
              !step.done &&
              ((e.currentTarget as HTMLDivElement).style.background = "#F8FAFC")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "transparent")
            }
          >
            {/* Check icon */}
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {step.done ? (
                <CheckCircle2
                  style={{ width: 18, height: 18, color: "#059669" }}
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  style={{ width: 18, height: 18, color: "#CBD5E1" }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Label + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: step.done ? 500 : 600,
                  color: step.done ? "#64748B" : "#0F172A",
                  margin: 0,
                  textDecoration: step.done ? "line-through" : "none",
                  textDecorationColor: "#CBD5E1",
                }}
              >
                {step.label}
              </p>
              {!step.done && (
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1, lineHeight: 1.4 }}>
                  {step.description}
                </p>
              )}
            </div>

            {/* CTA link */}
            {!step.done && step.cta && (
              <Link
                href={step.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#3B82F6",
                  background: "#EFF6FF",
                  padding: "4px 10px",
                  borderRadius: 7,
                  textDecoration: "none",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#DBEAFE")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#EFF6FF")
                }
              >
                {step.cta}
                <ChevronRight style={{ width: 11, height: 11 }} aria-hidden="true" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      {!allDone && (
        <div
          style={{
            padding: "0 20px 14px",
            fontSize: 11,
            color: "#94A3B8",
            textAlign: "center",
          }}
        >
          This checklist disappears after 60 days or when you click the X above.
        </div>
      )}

      <style>{`
        @keyframes helpStepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
