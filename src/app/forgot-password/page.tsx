"use client";

import React, { useState, Suspense, useId } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

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

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const errorId = useId();
  const emailId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      // Always show success — never reveal whether email exists
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#EDE9FE",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Mail style={{ width: 24, height: 24, color: "#7C3AED" }} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 10, letterSpacing: "-0.02em" }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 28 }}>
          If an account exists for <strong style={{ color: "#111827" }}>{email}</strong>, we&apos;ve sent a password reset link. Check your spam folder if you don&apos;t see it.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, color: "#7C3AED", fontWeight: 600, textDecoration: "none",
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Forgot your password?
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
          Enter your email and we&apos;ll send you a reset link.
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
        <div>
          <label
            htmlFor={emailId}
            style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
          >
            Email address
            <span aria-hidden="true" style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            aria-required="true"
            autoComplete="email"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
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
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          style={{
            width: "100%", minHeight: 48, padding: "12px 16px", borderRadius: 12,
            border: "none",
            background: loading ? "#9CA3AF" : "linear-gradient(135deg, #7C3AED, #9333EA)",
            color: "#FFFFFF", fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s",
            boxShadow: loading ? "none" : "0 4px 14px rgba(124,58,237,0.35)",
            letterSpacing: "-0.01em",
          }}
        >
          {loading ? (
            <><Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} aria-hidden="true" /> Sending...</>
          ) : (
            "Send Reset Link"
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

export default function ForgotPasswordPage() {
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
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          AI-powered accounting for modern businesses
        </p>
      </div>
    </div>
  );
}
