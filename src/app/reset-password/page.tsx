"use client";

import React, { useState, Suspense, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getPasswordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[Math.min(4, score)] };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorId = useId();

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div className="eyebrow-stamp" style={{ marginBottom: 10 }}>Invalid link</div>
        <h2 className="h2" style={{ fontSize: 24, marginBottom: 14 }}>Missing <em>reset token</em></h2>
        <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
          Request a fresh reset link to continue.
        </p>
        <Link href="/forgot-password" className="btn stamp">Request new link</Link>
      </div>
    );
  }

  const strength = getPasswordStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't reset password. Try again.");
        setLoading(false);
        return;
      }
      router.push("/login?reset=true");
    } catch {
      setError("Network trouble. Please try again.");
      setLoading(false);
    }
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
          <label htmlFor="new-password" className="field-label">New password</label>
          <input
            id="new-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            disabled={loading}
          />
          {password && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 3, flex: 1 }}>
                {[1, 2, 3, 4].map((lvl) => (
                  <div key={lvl} style={{ flex: 1, height: 3, background: lvl <= strength.score ? "var(--stamp)" : "var(--rule-soft)", borderRadius: 2 }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirm-password" className="field-label">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            required
            autoComplete="new-password"
            disabled={loading}
          />
          {mismatch && (
            <p role="alert" style={{ marginTop: 6, fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp)" }}>
              Passwords don't match.
            </p>
          )}
        </div>

        <button type="submit" className="btn stamp lg full" disabled={loading || mismatch} style={{ marginTop: 4 }}>
          {loading ? "Updating…" : "Update password"}
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

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Link href="/" className="brand" style={{ textAlign: "center", marginBottom: 28, display: "block", borderBottom: "1px solid var(--rule)", paddingBottom: 22 }}>
          <div className="brand-word" style={{ fontSize: 40 }}>Ledgr</div>
          <div className="brand-sub">Smart accounting</div>
        </Link>

        <div className="eyebrow-stamp" style={{ textAlign: "center", marginBottom: 8 }}>New password</div>
        <h1 className="display-h1" style={{ fontSize: 40, textAlign: "center", marginBottom: 24 }}>
          Set a <em>new password</em>
        </h1>

        <div className="lcard" style={{ padding: "28px 28px" }}>
          <Suspense fallback={<div style={{ height: 240 }} aria-label="Loading" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
