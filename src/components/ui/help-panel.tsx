"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, HelpCircle, Lightbulb, ChevronRight, PlayCircle } from "lucide-react";
import { HELP_CONTENT } from "@/lib/help-content";
import { clearTourSeen, hasTourBeenSeen } from "@/components/ui/product-tour";

/** Map pathname → tourId for the Restart Tour button */
const TOUR_IDS: Record<string, string> = {
  '/':             'dashboard',
  '/transactions': 'transactions',
  '/invoices':     'invoices',
  '/reports':      'reports',
  '/ai':           'ai-chat',
  '/settings':     'settings',
};

const SEEN_KEY = "ledgr_help_seen";

function getSeenPages(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markPageSeen(path: string) {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenPages();
    if (!seen.includes(path)) {
      seen.push(path);
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    }
  } catch {
    // ignore
  }
}

function hasSeenPage(path: string): boolean {
  return getSeenPages().includes(path);
}

// Normalise pathname to the key used in HELP_CONTENT
function normalisePath(pathname: string): string {
  // Strip trailing slashes, query params already stripped by usePathname
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

export function HelpPanel() {
  const pathname = usePathname();
  const normPath = normalisePath(pathname);
  const content = HELP_CONTENT[normPath];
  const tourId = TOUR_IDS[normPath] ?? null;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tourSeen, setTourSeen] = useState(true); // optimistic default

  // On mount + route change, auto-open if first visit and content exists
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tour-seen state so the button label is accurate
  useEffect(() => {
    if (!mounted || !tourId) return;
    setTourSeen(hasTourBeenSeen(tourId));
  }, [mounted, tourId, normPath]);

  useEffect(() => {
    if (!mounted) return;
    if (!content) {
      setOpen(false);
      return;
    }
    if (!hasSeenPage(normPath)) {
      // Delay slightly so the page content renders first
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [normPath, content, mounted]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    markPageSeen(normPath);
  }, [normPath]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  // Don't render on public/auth pages
  if (!mounted) return null;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/pay") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  if (isPublic) return null;

  return (
    <>
      {/* ── Floating "?" button ─────────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        aria-label="Open help guide"
        style={{
          position: "fixed",
          bottom: 88, // above mobile nav (which is ~56px + 16px padding)
          right: 20,
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: open ? "#1D4ED8" : "#3B82F6",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(59,130,246,0.40)",
          transition: "background 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#1D4ED8";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.07)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = open ? "#1D4ED8" : "#3B82F6";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        <HelpCircle style={{ width: 22, height: 22 }} aria-hidden="true" />
      </button>

      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      {open && (
        <div
          aria-hidden="true"
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 51,
            background: "rgba(15,23,42,0.25)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            animation: "fadeIn 180ms ease",
          }}
        />
      )}

      {/* ── Slide-in panel ──────────────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={content ? `Help: ${content.title}` : "Help"}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 52,
          width: "min(380px, 100vw)",
          background: "#FFFFFF",
          boxShadow: "-4px 0 32px rgba(15,23,42,0.12)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {content ? (
          <PanelContent
            content={content}
            onClose={handleClose}
            tourId={tourId}
            tourSeen={tourSeen}
            onRestartTour={() => {
              if (!tourId) return;
              clearTourSeen(tourId);
              setTourSeen(false);
              handleClose();
              // Reload the page so the ProductTour useEffect re-runs
              window.location.reload();
            }}
          />
        ) : (
          <NoContentView onClose={handleClose} tourId={tourId} onRestartTour={() => {
            if (!tourId) return;
            clearTourSeen(tourId);
            handleClose();
            window.location.reload();
          }} />
        )}
      </aside>

      {/* ── Animation keyframes (injected once) ─────────────────────────────── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes helpStepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ── Panel content when a matching page is found ────────────────────────────────

function PanelContent({
  content,
  onClose,
  tourId,
  tourSeen,
  onRestartTour,
}: {
  content: NonNullable<(typeof HELP_CONTENT)[string]>;
  onClose: () => void;
  tourId: string | null;
  tourSeen: boolean;
  onRestartTour: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#3B82F6",
                marginBottom: 4,
              }}
            >
              How-To Guide
            </div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {content.title}
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 3, lineHeight: 1.4 }}>
              {content.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help panel"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.7)")}
          >
            <X style={{ width: 15, height: 15, color: "#64748B" }} aria-hidden="true" />
          </button>
        </div>

        {/* Benefit callout */}
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.75)",
            borderRadius: 10,
            border: "1px solid rgba(59,130,246,0.15)",
          }}
        >
          <p style={{ fontSize: 12, color: "#1D4ED8", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            {content.benefit}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "16px 20px 0", flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "#94A3B8",
            marginBottom: 10,
          }}
        >
          Step by Step
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {content.steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 8px",
                borderRadius: 10,
                animation: `helpStepIn 200ms ${i * 50}ms both ease`,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#F8FAFC")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              {/* Step number + emoji */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                  aria-hidden="true"
                >
                  {step.icon}
                </div>
                {i < content.steps.length - 1 && (
                  <div style={{ width: 1, height: 14, background: "#E2E8F0" }} aria-hidden="true" />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: i < content.steps.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#3B82F6",
                      background: "#EFF6FF",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{step.title}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        {content.tips.length > 0 && (
          <div style={{ marginTop: 14, marginBottom: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#94A3B8",
                marginBottom: 8,
              }}
            >
              Pro Tips
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {content.tips.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#FFFBEB",
                    borderRadius: 10,
                    border: "1px solid #FDE68A",
                  }}
                >
                  <Lightbulb
                    aria-hidden="true"
                    style={{ width: 14, height: 14, color: "#D97706", flexShrink: 0, marginTop: 1 }}
                  />
                  <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: "16px 20px 24px", flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            background: "#3B82F6",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1D4ED8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3B82F6")}
        >
          Got it, let me explore
          <ChevronRight style={{ width: 15, height: 15 }} aria-hidden="true" />
        </button>

        {/* Restart Tour button — only shown when tour exists for this page */}
        {tourId && (
          <button
            onClick={onRestartTour}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: "transparent",
              color: "#475569",
              border: "1px solid #E2E8F0",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9";
              (e.currentTarget as HTMLButtonElement).style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#475569";
            }}
          >
            <PlayCircle style={{ width: 15, height: 15 }} aria-hidden="true" />
            {tourSeen ? "Restart Interactive Tour" : "Start Interactive Tour"}
          </button>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
          Click the <strong style={{ color: "#3B82F6" }}>?</strong> button anytime to reopen this guide
        </p>
      </div>
    </>
  );
}

// ── Fallback when no content defined for this route ───────────────────────────

function NoContentView({
  onClose,
  tourId,
  onRestartTour,
}: {
  onClose: () => void;
  tourId: string | null;
  onRestartTour: () => void;
}) {
  return (
    <>
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Help & Guides</h2>
        <button
          onClick={onClose}
          aria-label="Close help panel"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#F1F5F9",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X style={{ width: 15, height: 15, color: "#64748B" }} aria-hidden="true" />
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <HelpCircle style={{ width: 36, height: 36, color: "#CBD5E1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
            No guide for this page yet
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
            Navigate to any main section of Ledgr for a step-by-step guide.
          </p>
          {tourId && (
            <button
              onClick={onRestartTour}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 10,
                background: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <PlayCircle style={{ width: 15, height: 15 }} aria-hidden="true" />
              Start Interactive Tour
            </button>
          )}
        </div>
      </div>
    </>
  );
}
