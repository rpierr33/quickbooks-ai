"use client";

import React, { useState, useEffect, useId, Suspense } from "react";
import { signIn } from "next-auth/react";
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const formErrorId = useId();
  const confirmErrorId = useId();

  useEffect(() => {
    if (!inviteToken) return;
    async function validateInvite() {
      try {
        const res = await fetch(`/api/team/accept?token=${inviteToken}`);
        const data = await res.json();
        if (!res.ok) {
          setInviteError(data.error ?? "Invalid invite link");
          setInviteLoading(false);
          return;
        }
        setEmail(data.email ?? "");
        setInviteRole(data.role ?? "viewer");
        setInviteValid(true);
      } catch {
        setInviteError("Could not validate invite link");
      } finally {
        setInviteLoading(false);
      }
    }
    validateInvite();
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Full name is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      if (inviteToken && inviteValid) {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken, name, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data?.error || "Failed to accept invite"); setLoading(false); return; }
        const signed = await signIn("credentials", { email, password, redirect: false });
        if (signed?.error) { router.push("/login"); return; }
        router.push("/");
        router.refresh();
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data?.error || "Sign up failed. Please try again."); setLoading(false); return; }

        if (data.emailVerificationSent) {
          setEmailSent(true);
          setLoading(false);
          return;
        }
        const signed = await signIn("credentials", { email, password, redirect: false });
        if (signed?.error) { router.push("/login"); return; }
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div className="eyebrow-stamp" style={{ marginBottom: 10 }}>Check your inbox</div>
        <h2 className="h2" style={{ fontSize: 28, marginBottom: 14 }}>Verification <em>sent</em></h2>
        <p style={{ fontFamily: "var(--sans)", color: "var(--ink-2)", lineHeight: 1.55, fontSize: 14, marginBottom: 20 }}>
          We sent a link to <b style={{ color: "var(--ink)" }}>{email}</b>. Click it to activate your account.
        </p>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
          Didn't arrive? Check spam, or{" "}
          <button type="button" onClick={() => setEmailSent(false)} style={{ color: "var(--stamp)", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline", fontWeight: 500 }}>
            try again
          </button>
        </p>
      </div>
    );
  }

  if (inviteToken && inviteLoading) {
    return <div className="empty">Validating your invite…</div>;
  }

  if (inviteToken && inviteError) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div className="eyebrow-stamp" style={{ marginBottom: 8 }}>Invite trouble</div>
        <h2 className="h2" style={{ fontSize: 24, marginBottom: 12 }}>Invite <em>not found</em></h2>
        <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", marginBottom: 18, fontSize: 14 }}>{inviteError}</p>
        <Link href="/login" style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp)", fontWeight: 500 }}>
          ← Back to sign in
        </Link>
      </div>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const strength = getPasswordStrength(password);

  return (
    <>
      {inviteToken && inviteValid && (
        <div role="status" style={{ border: "1px solid var(--stamp-soft)", background: "var(--stamp-soft)", padding: "12px 14px", marginBottom: 18, borderRadius: "var(--radius)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp-ink)", fontWeight: 500 }}>
            Joining as <b>{inviteRole}</b>
          </div>
        </div>
      )}

      {error && (
        <div
          id={formErrorId}
          role="alert"
          aria-live="assertive"
          style={{ border: "1px solid var(--stamp-soft)", background: "var(--stamp-soft)", padding: "12px 14px", marginBottom: 16, borderRadius: "var(--radius)", fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp-ink)" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="field">
          <label htmlFor="name" className="field-label">Full name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required autoComplete="name" disabled={loading} />
        </div>

        <div className="field">
          <label htmlFor="email" className="field-label">Work email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" disabled={loading || !!(inviteToken && inviteValid)} />
        </div>

        <div className="field">
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required autoComplete="new-password" disabled={loading} />
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
          <label htmlFor="confirm" className="field-label">Confirm password</label>
          <input id="confirm" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" required autoComplete="new-password" disabled={loading} aria-invalid={mismatch || undefined} aria-describedby={mismatch ? confirmErrorId : undefined} />
          {mismatch && (
            <p id={confirmErrorId} role="alert" style={{ marginTop: 6, fontFamily: "var(--sans)", fontSize: 13, color: "var(--stamp)" }}>
              Passwords don't match.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn stamp lg full"
          disabled={loading || mismatch}
          style={{ marginTop: 4 }}
        >
          {loading ? (inviteToken ? "Joining…" : "Creating account…") : (inviteToken ? "Join team" : "Start free trial")}
        </button>
      </form>

      <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-4)", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
        By continuing you agree to the{" "}
        <Link href="/terms" style={{ color: "var(--ink-3)" }}>terms</Link>
        {" "}and{" "}
        <Link href="/privacy" style={{ color: "var(--ink-3)" }}>privacy policy</Link>.
      </p>

      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", textAlign: "center", marginTop: 16, fontSize: 14 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--stamp)", fontWeight: 500, textDecoration: "none" }}>
          Sign in →
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <Link href="/" className="brand" style={{ textAlign: "center", marginBottom: 36, display: "block", borderBottom: "1px solid var(--ink)", paddingBottom: 24 }}>
          <div className="brand-word" style={{ fontSize: 40 }}>Ledgr</div>
          <div className="brand-sub">Smart accounting</div>
        </Link>

        <div className="eyebrow-stamp" style={{ textAlign: "center", marginBottom: 8 }}>Free trial</div>
        <h1 className="display-h1" style={{ fontSize: 40, textAlign: "center", marginBottom: 24 }}>
          Start using <em>Ledgr</em>
        </h1>

        <div className="lcard" style={{ padding: "28px 28px" }}>
          <Suspense fallback={<div style={{ height: 420 }} aria-label="Loading" />}>
            <SignupForm />
          </Suspense>
        </div>

        <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-4)", textAlign: "center", marginTop: 20 }}>
          14-day free trial · No card required
        </p>
      </div>
    </div>
  );
}
