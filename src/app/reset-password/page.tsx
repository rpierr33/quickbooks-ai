"use client";

import React, { useState, Suspense, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function LedgrLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36 }}>
      <div
        aria-hidden="true"
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, #7C3AED, #9333EA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>L</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>Ledgr</span>
    </div>
  );
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string; textColor: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { score: 1, label: "Weak", color: "#EF4444", textColor: "#DC2626" },
    { score: 2, label: "Fair", color: "#F59E0B", textColor: "#D97706" },
    { score: 3, label: "Good", color: "#3B82F6", textColor: "#2563EB" },
    { score: 4, label: "Strong", color: "#10B981", textColor: "#059669" },
  ];
  return map[Math.max(0, score - 1)] ?? { score: 0, label: "Too short", color: "#E5E7EB", textColor: "#9CA3AF" };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errorId = useId();
  const pwHintId = useId();

  const strength = getPasswordStrength(password);
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  // No token in URL — show error
  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#FEF2F2",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <span style={{ fontSize: 24, color: "#DC2626" }} aria-hidden="true">!</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Invalid reset link</h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
          This link is missing a reset token. Please request a new password reset link.
        </p>
        <Link href="/forgot-password" style={{ color: "#7C3AED", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Request new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to reset password. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/login?reset=true");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Set new password
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          style={{
            padding: "10px 14px", borderRadius: 10,
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", fontSize: 13, fontWeight: 500, marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Password field */}
        <div>
          <label htmlFor="new-password" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            New password
            <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              aria-required="true"
              autoComplete="new-password"
              aria-describedby={password ? pwHintId : undefined}
              style={{
                width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                border: "1.5px solid #D1D5DB", fontSize: 14, color: "#111827",
                background: "#FFFFFF", outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box", minHeight: 44,
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
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: "#6B7280", display: "flex", alignItems: "center", minWidth: 28, minHeight: 28, borderRadius: 4,
              }}
            >
              {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>

          {/* Password strength */}
          {password && (
            <div style={{ marginTop: 8 }} id={pwHintId}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }} aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: level <= strength.score ? strength.color : "#E5E7EB",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: strength.textColor, fontWeight: 500 }}>{strength.label}</p>
              <span className="sr-only">Password strength: {strength.label}</span>
            </div>
          )}

          {/* Requirements */}
          <ul style={{ marginTop: 8, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {[
              { test: password.length >= 8, label: "At least 8 characters" },
              { test: /[A-Z]/.test(password), label: "One uppercase letter" },
              { test: /[0-9]/.test(password), label: "One number" },
            ].map(({ test, label }) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: test ? "#059669" : "#9CA3AF" }}>
                <CheckCircle2 style={{ width: 12, height: 12, flexShrink: 0, color: test ? "#059669" : "#D1D5DB" }} aria-hidden="true" />
                {label}
                {test && <span className="sr-only"> ✓</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm-password" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Confirm new password
            <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              aria-required="true"
              aria-invalid={passwordMismatch || undefined}
              autoComplete="new-password"
              style={{
                width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                border: passwordMismatch ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
                fontSize: 14, color: "#111827", background: "#FFFFFF", outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box", minHeight: 44,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = passwordMismatch ? "#DC2626" : "#7C3AED";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = passwordMismatch ? "#DC2626" : "#D1D5DB";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: "#6B7280", display: "flex", alignItems: "center", minWidth: 28, minHeight: 28, borderRadius: 4,
              }}
            >
              {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          {passwordMismatch && (
            <p role="alert" style={{ marginTop: 6, fontSize: 12, color: "#DC2626" }}>
              Passwords don&apos;t match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || passwordMismatch}
          aria-busy={loading}
          style={{
            width: "100%", minHeight: 48, padding: "12px 16px", borderRadius: 12,
            border: "none",
            background: loading || passwordMismatch ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #9333EA)",
            color: "#FFFFFF", fontSize: 15, fontWeight: 700,
            cursor: loading || passwordMismatch ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s",
            boxShadow: loading || passwordMismatch ? "none" : "0 4px 14px rgba(124,58,237,0.35)",
            letterSpacing: "-0.01em",
          }}
        >
          {loading ? (
            <><Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} aria-hidden="true" /> Updating...</>
          ) : (
            "Update Password"
          )}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 20 }}>
        <Link href="/login" style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft style={{ width: 13, height: 13 }} aria-hidden="true" />
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0;
          margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border-width: 0;
        }
      `}</style>

      <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "8%", left: "5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "8%", right: "5%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <LedgrLogo />
        <div
          style={{
            background: "#FFFFFF", borderRadius: 20,
            padding: "36px 32px 32px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <Suspense fallback={<div style={{ height: 300 }} />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          AI-powered accounting for modern businesses
        </p>
      </div>
    </div>
  );
}
