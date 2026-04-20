"use client";

import React, { useState, Suspense, useId } from "react";
import Link from "next/link";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();

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
      setSubmitted(true);
    } catch {
      setError("Network trouble. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div className="eyebrow-stamp" style={{ marginBottom: 10 }}>Check your inbox</div>
        <h2 className="h2" style={{ fontSize: 28, marginBottom: 14 }}>Reset link <em>sent</em></h2>
        <p style={{ fontFamily: "var(--sans)", color: "var(--ink-2)", lineHeight: 1.55, fontSize: 14 }}>
          If an account exists for <b style={{ color: "var(--ink)" }}>{email}</b>, you'll find a reset link in your inbox.
        </p>
        <Link href="/login" style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp)", fontWeight: 500, display: "inline-block", marginTop: 20 }}>
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          style={{ border: "1px solid var(--stamp-soft)", background: "var(--stamp-soft)", padding: "12px 14px", marginBottom: 16, borderRadius: "var(--radius)", fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp-ink)" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="field">
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn stamp lg full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", textAlign: "center", marginTop: 20, fontSize: 14 }}>
        <Link href="/login" style={{ color: "var(--stamp)", fontWeight: 500, textDecoration: "none" }}>
          ← Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Link href="/" className="brand" style={{ textAlign: "center", marginBottom: 28, display: "block", borderBottom: "1px solid var(--rule)", paddingBottom: 22 }}>
          <div className="brand-word" style={{ fontSize: 40 }}>Ledgr</div>
          <div className="brand-sub">Smart accounting</div>
        </Link>

        <div className="eyebrow-stamp" style={{ textAlign: "center", marginBottom: 8 }}>Password reset</div>
        <h1 className="display-h1" style={{ fontSize: 40, textAlign: "center", marginBottom: 24 }}>
          Forgotten your <em>password?</em>
        </h1>

        <div className="lcard" style={{ padding: "28px 28px" }}>
          <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
            Enter your email and we'll send you a reset link.
          </p>
          <Suspense fallback={<div style={{ height: 200 }} aria-label="Loading" />}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
