"use client";

import React, { useState, Suspense, useId } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const formErrorId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Email or password is incorrect. Try again.");
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

  return (
    <>
      {verifiedParam === "true" && (
        <div role="status" style={{ border: "1px solid var(--pencil-soft)", background: "var(--pencil-soft)", padding: "12px 14px", marginBottom: 18, borderRadius: "var(--radius)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--pencil)", fontWeight: 500 }}>
            Email verified. Sign in below.
          </div>
        </div>
      )}
      {resetParam === "true" && (
        <div role="status" style={{ border: "1px solid var(--pencil-soft)", background: "var(--pencil-soft)", padding: "12px 14px", marginBottom: 18, borderRadius: "var(--radius)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--pencil)", fontWeight: 500 }}>
            Password updated. Sign in with your new password.
          </div>
        </div>
      )}
      {errorParam === "invalid_token" && (
        <div role="alert" style={{ border: "1px solid var(--stamp-soft)", background: "var(--stamp-soft)", padding: "12px 14px", marginBottom: 18, borderRadius: "var(--radius)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp-ink)", fontWeight: 500 }}>
            This link has expired. Request a new one below.
          </div>
        </div>
      )}

      {error && (
        <div
          id={formErrorId}
          role="alert"
          aria-live="assertive"
          style={{ border: "1px solid var(--stamp-soft)", background: "var(--stamp-soft)", padding: "12px 14px", marginBottom: 16, borderRadius: "var(--radius)", fontFamily: "var(--sans)", color: "var(--stamp-ink)", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-describedby={error ? formErrorId : undefined} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor="password" className="field-label">Password</label>
            <Link href="/forgot-password" style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--stamp)", fontWeight: 500, textDecoration: "none" }}>
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn stamp lg full"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, borderTop: "1px solid var(--rule)" }} />
        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-4)" }}>or</span>
        <div style={{ flex: 1, borderTop: "1px solid var(--rule)" }} />
      </div>

      <button type="button" className="btn full" onClick={handleDemoLogin} disabled={loading}>
        Try demo account
      </button>

      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", textAlign: "center", marginTop: 20, fontSize: 14 }}>
        New to Ledgr?{" "}
        <Link href="/signup" style={{ color: "var(--stamp)", fontWeight: 500, textDecoration: "none" }}>
          Start a free trial →
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Link href="/" className="brand" style={{ textAlign: "center", marginBottom: 36, display: "block", borderBottom: "1px solid var(--ink)", paddingBottom: 24 }}>
          <div className="brand-word" style={{ fontSize: 40 }}>Ledgr</div>
          <div className="brand-sub">Smart accounting</div>
        </Link>

        <div className="eyebrow-stamp" style={{ textAlign: "center", marginBottom: 8 }}>Welcome back</div>
        <h1 className="display-h1" style={{ fontSize: 40, textAlign: "center", marginBottom: 24 }}>
          Sign in to <em>Ledgr</em>
        </h1>

        <div className="lcard" style={{ padding: "28px 28px" }}>
          <Suspense fallback={<div style={{ height: 320 }} aria-label="Loading" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-4)", textAlign: "center", marginTop: 20 }}>
          AI-powered accounting · Made with care
        </p>
      </div>
    </div>
  );
}
