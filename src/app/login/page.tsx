"use client";

import React, { useState, Suspense, useId } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

// ─── Logo ────────────────────────────────────────────────────────────────────
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
      <span style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
        Ledgr
      </span>
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  hasError,
  errorId,
  autoComplete,
  rightSlot,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  errorId?: string;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={errorId && hasError ? errorId : undefined}
          style={{
            width: "100%",
            padding: rightSlot ? "12px 44px 12px 14px" : "12px 14px",
            borderRadius: 10,
            border: hasError ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
            fontSize: 14,
            color: "#111827",
            background: disabled ? "#F9FAFB" : "#FFFFFF",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxSizing: "border-box",
            minHeight: 44,
            opacity: disabled ? 0.65 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = "#7C3AED";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = hasError ? "#DC2626" : "#D1D5DB";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {rightSlot && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PasswordField ────────────────────────────────────────────────────────────
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  hasError,
  errorId,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  errorId?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      hasError={hasError}
      errorId={errorId}
      autoComplete={autoComplete}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#6B7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 24,
            minHeight: 24,
            borderRadius: 4,
          }}
        >
          {visible ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
        </button>
      }
    />
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }} aria-hidden="true">
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
    </div>
  );
}

// ─── LoginForm (inner) ────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const verifiedParam = searchParams.get("verified");
  const resetParam = searchParams.get("reset");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const errorId = useId();
  const formErrorId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: "demo@ledgr.com",
      password: "demo",
      redirect: false,
    });
    if (result?.error) {
      setError("Demo login failed. Please try again.");
      setLoading(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const hasEmailError = !!error && !email;
  const hasPasswordError = !!error && !password;

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-purple-600"
      >
        Skip to login form
      </a>

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
          padding: "24px 16px",
        }}
      >
        {/* Background orbs */}
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: "8%", left: "5%",
            width: 450, height: 450, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", bottom: "8%", right: "5%",
            width: 550, height: 550, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
          <LedgrLogo />

          {/* Card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "36px 32px 32px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
                Sign in to your accounting dashboard
              </p>
            </div>

            {/* Email verified success banner */}
            {verifiedParam === "true" && (
              <div
                role="status"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  color: "#15803D",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7.5" stroke="#15803D" />
                  <path d="M5 8l2 2 4-4" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Email verified! You can now sign in.
              </div>
            )}

            {/* Password reset success banner */}
            {resetParam === "true" && (
              <div
                role="status"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  color: "#15803D",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7.5" stroke="#15803D" />
                  <path d="M5 8l2 2 4-4" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Password updated! Sign in with your new password.
              </div>
            )}

            {/* Invalid token error banner */}
            {errorParam === "invalid_token" && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7.5" stroke="#DC2626" />
                  <path d="M8 5v4M8 11v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                This link is invalid or has expired. Request a new one below.
              </div>
            )}

            {/* Demo button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              aria-label="Sign in with the demo account"
              style={{
                width: "100%",
                minHeight: 44,
                padding: "10px 16px",
                borderRadius: 12,
                border: "1.5px dashed #C4B5FD",
                background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
                color: "#7C3AED",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 24,
                transition: "all 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <><Loader2 style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }} aria-hidden="true" /> <span>Signing in...</span></>
              ) : (
                "Try Demo Account — Instant Access"
              )}
            </button>

            <Divider label="or sign in with email" />

            {/* Error summary (accessible) */}
            {error && (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 500,
                  marginTop: 20,
                  marginBottom: 4,
                }}
              >
                {error}
              </div>
            )}

            <form
              id="login-form"
              onSubmit={handleSubmit}
              noValidate
              aria-describedby={error ? formErrorId : undefined}
              style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: error ? 0 : 20 }}
            >
              <div>
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                  required
                  hasError={hasEmailError}
                  errorId={errorId}
                  autoComplete="email"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label
                    htmlFor="password"
                    style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    Password
                    <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
                    <span className="sr-only"> (required)</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    tabIndex={0}
                    style={{ fontSize: 12, color: "#7C3AED", fontWeight: 500, textDecoration: "none" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordField
                  id="password"
                  label=""
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  required
                  hasError={hasPasswordError}
                  errorId={errorId}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                style={{
                  marginTop: 4,
                  width: "100%",
                  minHeight: 48,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: loading
                    ? "#9CA3AF"
                    : "linear-gradient(135deg, #7C3AED, #9333EA)",
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(124,58,237,0.35)",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight style={{ width: 16, height: 16 }} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 20 }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }}>
                Start free trial
              </Link>
            </p>
          </div>

          {/* Social login (coming soon) */}
          <div
            style={{ marginTop: 20, opacity: 0.6 }}
            aria-label="Social login options — coming soon"
          >
            <Divider label="or continue with" />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {["Google", "Apple"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  disabled
                  aria-label={`Sign in with ${provider} — coming soon`}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {provider}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 99 }}>
                    Soon
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer tagline */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            AI-powered accounting for modern businesses
          </p>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
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
          .sr-only.focus\\:not-sr-only:focus {
            position: static;
            width: auto;
            height: auto;
            padding: inherit;
            margin: inherit;
            overflow: visible;
            clip: auto;
            white-space: normal;
          }
        `}</style>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
          }}
          aria-label="Loading"
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #9333EA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>L</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
