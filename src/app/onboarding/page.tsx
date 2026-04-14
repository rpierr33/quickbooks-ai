"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  Briefcase,
  ShoppingBag,
  Heart,
  Check,
  Landmark,
  Upload,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  FlaskConical,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type CoaTemplate = "standard" | "service" | "retail" | "nonprofit";
type Industry = string;

// ─── CoA Templates ─────────────────────────────────────────────────────────────
const COA_TEMPLATES: {
  id: CoaTemplate;
  name: string;
  desc: string;
  accounts: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    id: "standard",
    name: "Standard Business",
    desc: "For most businesses",
    accounts: 45,
    icon: Building2,
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    id: "service",
    name: "Service Business",
    desc: "Consulting, agencies, freelancers",
    accounts: 38,
    icon: Briefcase,
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    id: "retail",
    name: "Retail / E-commerce",
    desc: "Products, inventory, shipping",
    accounts: 52,
    icon: ShoppingBag,
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    id: "nonprofit",
    name: "Nonprofit",
    desc: "Grants, donations, programs",
    accounts: 41,
    icon: Heart,
    color: "#DC2626",
    bg: "#FEF2F2",
  },
];

// ─── Industries ────────────────────────────────────────────────────────────────
const INDUSTRIES: Industry[] = [
  "Technology / SaaS",
  "Professional Services",
  "Consulting",
  "E-commerce / Retail",
  "Healthcare",
  "Real Estate",
  "Construction",
  "Food & Beverage",
  "Creative / Agency",
  "Education",
  "Nonprofit",
  "Other",
];

// ─── Step transitions ──────────────────────────────────────────────────────────
const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};
const SPRING = { type: "spring" as const, stiffness: 350, damping: 32 };

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Step {step} of {total}
        </span>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>
          {pct}% complete
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${step} of ${total}`}
        style={{ width: "100%", height: 4, borderRadius: 99, background: "#E5E7EB", overflow: "hidden" }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={SPRING}
          style={{
            height: "100%",
            borderRadius: 99,
            background: "linear-gradient(90deg, #7C3AED, #9333EA)",
          }}
        />
      </div>
      {/* Step labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {["Your Business", "Choose Template", "Get Started"].map((label, i) => {
          const done = step > i + 1;
          const active = step === i + 1;
          return (
            <span
              key={label}
              aria-hidden="true"
              style={{
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: done ? "#059669" : active ? "#7C3AED" : "#9CA3AF",
                transition: "color 0.2s",
              }}
            >
              {done ? "✓ " : ""}{label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Your Business ─────────────────────────────────────────────────────
function Step1({
  companyName,
  setCompanyName,
  industry,
  setIndustry,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Tell us about your business
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
          This helps us set up the right accounts for your business type.
        </p>
      </div>

      {/* Company name */}
      <div>
        <label
          htmlFor="onb-company"
          style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}
        >
          Company name
          <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          id="onb-company"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Consulting LLC"
          required
          autoComplete="organization"
          aria-required="true"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1.5px solid #D1D5DB",
            fontSize: 14,
            color: "#111827",
            background: "#FFFFFF",
            outline: "none",
            boxSizing: "border-box",
            minHeight: 44,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#7C3AED";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#D1D5DB";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Industry */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
          Industry <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
        </p>
        <div
          role="radiogroup"
          aria-label="Select your industry"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))",
            gap: 8,
          }}
        >
          {INDUSTRIES.map((ind) => {
            const selected = industry === ind;
            return (
              <button
                key={ind}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setIndustry(selected ? "" : ind)}
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: selected ? 600 : 400,
                  border: selected ? "1.5px solid #7C3AED" : "1.5px solid #E5E7EB",
                  background: selected ? "#F5F3FF" : "#FAFAFA",
                  color: selected ? "#7C3AED" : "#374151",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  minHeight: 44,
                }}
              >
                {ind}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Chart of Accounts ─────────────────────────────────────────────────
function Step2({
  selected,
  setSelected,
}: {
  selected: CoaTemplate;
  setSelected: (v: CoaTemplate) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Pick your account template
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
          Choose the template that best fits your business. You can customize accounts later.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Select chart of accounts template"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
        className="coa-grid"
      >
        {COA_TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id;
          const Icon = tpl.icon;
          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(tpl.id)}
              style={{
                padding: "18px 16px",
                borderRadius: 14,
                border: isSelected ? `2px solid ${tpl.color}` : "1.5px solid #E5E7EB",
                background: isSelected ? tpl.bg : "#FFFFFF",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                position: "relative",
                boxShadow: isSelected ? `0 0 0 4px ${tpl.color}20` : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {/* Checkmark */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: tpl.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-hidden="true"
                >
                  <Check style={{ width: 12, height: 12, color: "#fff" }} />
                </div>
              )}

              {/* Icon */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isSelected ? `${tpl.color}22` : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
                aria-hidden="true"
              >
                <Icon style={{ width: 20, height: 20, color: isSelected ? tpl.color : "#6B7280" }} />
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: isSelected ? tpl.color : "#111827", marginBottom: 3, lineHeight: 1.3 }}>
                {tpl.name}
              </p>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4, marginBottom: 8 }}>
                {tpl.desc}
              </p>
              <p style={{ fontSize: 11, color: isSelected ? tpl.color : "#9CA3AF", fontWeight: 600 }}>
                {tpl.accounts} accounts included
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Get Started ──────────────────────────────────────────────────────
function Step3({
  loadSampleData,
  setLoadSampleData,
  onNavigate,
}: {
  loadSampleData: boolean;
  setLoadSampleData: (v: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>
          How do you want to start?
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
          Pick the best starting point — you can always do the others later.
        </p>
      </div>

      {/* Sample data toggle */}
      <button
        type="button"
        onClick={() => setLoadSampleData(!loadSampleData)}
        aria-pressed={loadSampleData}
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          border: loadSampleData ? "2px solid #7C3AED" : "1.5px dashed #D1D5DB",
          background: loadSampleData ? "#F5F3FF" : "#FAFAFA",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          cursor: "pointer",
          transition: "all 0.15s",
          width: "100%",
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: loadSampleData ? "#EDE9FE" : "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }} aria-hidden="true">
          <FlaskConical style={{ width: 18, height: 18, color: loadSampleData ? "#7C3AED" : "#9CA3AF" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: loadSampleData ? "#7C3AED" : "#111827", marginBottom: 2 }}>
            Load sample data to explore
          </p>
          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
            3 months of realistic data — great for trying AI features and reports
          </p>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: loadSampleData ? "#7C3AED" : "#E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "all 0.15s",
        }} aria-hidden="true">
          {loadSampleData && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
        </div>
      </button>

      {/* Action cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          {
            icon: Landmark,
            iconColor: "#0284C7",
            iconBg: "#F0F9FF",
            title: "Connect Your Bank",
            desc: "Auto-sync transactions via Plaid",
            badge: "Pro",
            badgeColor: "#0284C7",
            disabled: true,
            onClick: () => {},
          },
          {
            icon: Upload,
            iconColor: "#7C3AED",
            iconBg: "#F5F3FF",
            title: "Import Existing Data",
            desc: "Upload bank statements or CSV exports",
            badge: null,
            disabled: false,
            onClick: () => onNavigate("/import"),
          },
          {
            icon: ArrowRight,
            iconColor: "#059669",
            iconBg: "#ECFDF5",
            title: "Start Fresh",
            desc: "Go to your dashboard and add data manually",
            badge: null,
            disabled: false,
            onClick: () => onNavigate("/"),
          },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1.5px solid #E5E7EB",
              background: item.disabled ? "#FAFAFA" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 14,
              textAlign: "left",
              cursor: item.disabled ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: item.disabled ? 0.55 : 1,
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.borderColor = "#C4B5FD";
                e.currentTarget.style.background = "#FAFAFA";
              }
            }}
            onMouseLeave={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.background = "#FFFFFF";
              }
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: item.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }} aria-hidden="true">
              <item.icon style={{ width: 20, height: 20, color: item.iconColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.title}</p>
                {item.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: item.badgeColor,
                    background: `${item.badgeColor}15`,
                    padding: "2px 6px", borderRadius: 99, letterSpacing: "0.04em",
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
            {!item.disabled && (
              <ArrowRight style={{ width: 16, height: 16, color: "#9CA3AF", flexShrink: 0 }} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Done screen ───────────────────────────────────────────────────────────────
function DoneScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
          background: "linear-gradient(135deg, #7C3AED, #9333EA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
        }}
        aria-hidden="true"
      >
        <Sparkles style={{ width: 32, height: 32, color: "#fff" }} />
      </motion.div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 10 }}>
        You&apos;re all set!
      </h2>
      <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 32px" }}>
        Your Ledgr account is configured and ready. Let&apos;s get your books started.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onNavigate("/transactions")}
          style={{
            padding: "12px 24px", borderRadius: 12, minHeight: 44,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          Add Transaction
        </button>
        <button
          type="button"
          onClick={() => onNavigate("/invoices")}
          style={{
            padding: "12px 24px", borderRadius: 12, minHeight: 44,
            border: "none",
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          Create Invoice <ArrowRight style={{ width: 14, height: 14 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Main onboarding component ────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<Industry>("");
  const [coaTemplate, setCoaTemplate] = useState<CoaTemplate>("standard");
  const [loadSampleData, setLoadSampleData] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const TOTAL_STEPS = 3;

  function goForward() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function finish(navigationPath?: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || "My Business",
          industry: industry || undefined,
          coaTemplate,
          fiscalYearStart: "january",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data?.error || "Could not save — please try again.");
        setSaving(false);
        return;
      }

      // Best-effort sample data seeding
      if (loadSampleData) {
        try {
          await fetch("/api/onboarding/seed-demo", { method: "POST" });
        } catch {
          // Non-fatal
        }
      }

      if (navigationPath) {
        router.push(navigationPath);
        router.refresh();
      } else {
        setDone(true);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSaving(false);
    }
  }

  function handleNavigate(path: string) {
    finish(path);
  }

  // Done screen
  if (done) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "40px 32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "1px solid #E5E7EB",
          }}
        >
          <DoneScreen onNavigate={(path) => router.push(path)} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @media (max-width: 480px) {
          .coa-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 580 }}>
        {/* Header: logo + step counter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              aria-hidden="true"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>L</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>Ledgr</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#9CA3AF", fontWeight: 500,
              padding: "6px 10px", borderRadius: 8,
              minHeight: 36, minWidth: 36,
            }}
            aria-label="Skip onboarding and go to dashboard"
          >
            Skip for now
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "36px 32px 32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <ProgressBar step={step} total={TOTAL_STEPS} />

          {/* Animated step content */}
          <div style={{ minHeight: 380, position: "relative" }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {step === 1 && (
                  <Step1
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    industry={industry}
                    setIndustry={setIndustry}
                  />
                )}
                {step === 2 && (
                  <Step2 selected={coaTemplate} setSelected={setCoaTemplate} />
                )}
                {step === 3 && (
                  <Step3
                    loadSampleData={loadSampleData}
                    setLoadSampleData={setLoadSampleData}
                    onNavigate={handleNavigate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          {saveError && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid #F3F4F6",
            }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || saving}
              aria-label="Go to previous step"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 10, minHeight: 44,
                border: "1.5px solid #E5E7EB", background: "#FFFFFF",
                color: "#374151", fontSize: 14, fontWeight: 600,
                cursor: step === 1 || saving ? "not-allowed" : "pointer",
                opacity: step === 1 ? 0 : saving ? 0.5 : 1,
                pointerEvents: step === 1 ? "none" : "auto",
                transition: "all 0.15s",
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} aria-hidden="true" />
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {step === 1 && (
                  <button
                    type="button"
                    onClick={goForward}
                    disabled={saving}
                    style={{
                      padding: "10px 16px", borderRadius: 10, minHeight: 44,
                      border: "none", background: "transparent",
                      color: "#9CA3AF", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                    aria-label="Skip this step"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={goForward}
                  disabled={(step === 1 && !companyName.trim()) || saving}
                  aria-label={`Continue to step ${step + 1}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 24px", borderRadius: 10, minHeight: 44,
                    border: "none",
                    background: step === 1 && !companyName.trim()
                      ? "#E5E7EB"
                      : "linear-gradient(135deg, #7C3AED, #9333EA)",
                    color: step === 1 && !companyName.trim() ? "#9CA3AF" : "#FFFFFF",
                    fontSize: 14, fontWeight: 700,
                    cursor: step === 1 && !companyName.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    boxShadow: step === 1 && !companyName.trim() ? "none" : "0 4px 12px rgba(124,58,237,0.3)",
                  }}
                >
                  Continue
                  <ArrowRight style={{ width: 15, height: 15 }} aria-hidden="true" />
                </button>
              </div>
            ) : (
              // Step 3: "Finish Setup" only needed if they didn't click an action card
              <button
                type="button"
                onClick={() => finish()}
                disabled={saving}
                aria-busy={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 10, minHeight: 44,
                  border: "none",
                  background: saving ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #9333EA)",
                  color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  boxShadow: saving ? "none" : "0 4px 12px rgba(124,58,237,0.3)",
                }}
              >
                {saving ? (
                  <>
                    <svg
                      aria-hidden="true"
                      style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }}
                      viewBox="0 0 24 24" fill="none"
                    >
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2 A10 10 0 0 1 22 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight style={{ width: 15, height: 15 }} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9CA3AF" }}>
          Step {step} of {TOTAL_STEPS} — you can always update these settings later
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
