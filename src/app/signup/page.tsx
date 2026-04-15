"use client";

import React, { useState, useEffect, useId, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, UserCheck, Mail } from "lucide-react";

// ─── Logo (shared pattern) ────────────────────────────────────────────────────
function LedgrLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
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

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            height: 4,
            borderRadius: 99,
            width: i < current ? 28 : 20,
            background: i < current
              ? "linear-gradient(90deg, #7C3AED, #9333EA)"
              : "rgba(255,255,255,0.2)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
      <span className="sr-only">Step {current} of {total}</span>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────
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
          padding: "12px 14px",
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
    </div>
  );
}

// ─── PasswordField with show/hide ─────────────────────────────────────────────
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
  showHint,
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
  showHint?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const strength = getPasswordStrength(value);
  const hintId = `${id}-hint`;

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
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={[errorId && hasError ? errorId : null, showHint && value ? hintId : null].filter(Boolean).join(" ") || undefined}
          style={{
            width: "100%",
            padding: "12px 44px 12px 14px",
            borderRadius: 10,
            border: hasError ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
            fontSize: 14,
            color: "#111827",
            background: "#FFFFFF",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxSizing: "border-box",
            minHeight: 44,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#7C3AED";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = hasError ? "#DC2626" : "#D1D5DB";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: "#6B7280", display: "flex", alignItems: "center", minWidth: 28, minHeight: 28,
            borderRadius: 4,
          }}
        >
          {visible ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* Password strength bar */}
      {showHint && value && (
        <div style={{ marginTop: 8 }} id={hintId}>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }} aria-hidden="true">
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
          <p style={{ fontSize: 11, color: strength.textColor, fontWeight: 500 }}>
            {strength.label}
          </p>
          <span className="sr-only">Password strength: {strength.label}</span>
        </div>
      )}

      {/* Requirements */}
      {showHint && (
        <ul style={{ marginTop: 8, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          {[
            { test: value.length >= 8, label: "At least 8 characters" },
            { test: /[A-Z]/.test(value), label: "One uppercase letter" },
            { test: /[0-9]/.test(value), label: "One number" },
          ].map(({ test, label }) => (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: test ? "#059669" : "#9CA3AF" }}>
              <CheckCircle2 style={{ width: 12, height: 12, flexShrink: 0, color: test ? "#059669" : "#D1D5DB" }} aria-hidden="true" />
              {label}
              {test && <span className="sr-only"> ✓</span>}
            </li>
          ))}
        </ul>
      )}
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

// ─── SignupForm ────────────────────────────────────────────────────────────────
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

  // Invite state
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

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      if (inviteToken && inviteValid) {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken, name, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || "Failed to accept invite");
          setLoading(false);
          return;
        }
        const signed = await signIn("credentials", { email, password, redirect: false });
        if (signed?.error) {
          router.push("/login");
          return;
        }
        router.push("/");
        router.refresh();
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || "Sign up failed. Please try again.");
          setLoading(false);
          return;
        }

        // If email service is configured, show "check your email" message
        if (data.emailVerificationSent) {
          setEmailSent(true);
          setLoading(false);
          return;
        }

        // Email service not configured — auto-verified, proceed to sign in
        const signed = await signIn("credentials", { email, password, redirect: false });
        if (signed?.error) {
          router.push("/login");
          return;
        }
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setLoading(false);
    }
  }

  // Email verification sent — show check-your-email screen
  if (emailSent) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
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
          Check your email
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
          We sent a verification link to <strong style={{ color: "#111827" }}>{email}</strong>.
          Click the link to activate your account.
        </p>
        <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            style={{ color: "#7C3AED", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 }}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  if (inviteToken && inviteLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
        <Loader2 style={{ width: 28, height: 28, color: "#7C3AED", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
        <p style={{ fontSize: 14, color: "#6B7280" }}>Validating your invite...</p>
      </div>
    );
  }

  if (inviteToken && inviteError) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span style={{ fontSize: 22, color: "#DC2626" }} aria-hidden="true">!</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Invite Not Found</h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>{inviteError}</p>
        <Link href="/login" style={{ color: "#7C3AED", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  return (
    <>
      {/* Invite banner */}
      {inviteToken && inviteValid && (
        <div
          role="status"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 10,
            background: "#EDE9FE", border: "1px solid #C4B5FD",
            marginBottom: 20,
          }}
        >
          <UserCheck style={{ width: 16, height: 16, color: "#7C3AED", flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6D28D9", textTransform: "capitalize" }}>
            You&apos;ve been invited — joining as {inviteRole}
          </span>
        </div>
      )}

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
          {inviteToken ? "Accept your invite" : "Start your free trial"}
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6, lineHeight: 1.5 }}>
          {inviteToken
            ? "Set your name and password to join the team."
            : "Up and running in under 60 seconds. No credit card required."}
        </p>
      </div>

      {/* Error summary */}
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
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={error ? formErrorId : undefined}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <Field
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Jane Doe"
          required
          autoComplete="name"
        />

        <Field
          id="email"
          label="Work email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          required
          disabled={!!(inviteToken && inviteValid)}
          autoComplete="email"
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
          showHint
        />

        <div>
          <Field
            id="confirm"
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter password"
            required
            hasError={passwordMismatch}
            errorId={confirmErrorId}
            autoComplete="new-password"
          />
          {passwordMismatch && (
            <p id={confirmErrorId} role="alert" style={{ marginTop: 6, fontSize: 12, color: "#DC2626" }}>
              Passwords don&apos;t match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || passwordMismatch}
          aria-busy={loading}
          style={{
            marginTop: 6,
            width: "100%",
            minHeight: 48,
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: loading || passwordMismatch
              ? "#9CA3AF"
              : "linear-gradient(135deg, #7C3AED, #9333EA)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || passwordMismatch ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.15s",
            boxShadow: loading || passwordMismatch ? "none" : "0 4px 14px rgba(124,58,237,0.35)",
            letterSpacing: "-0.01em",
          }}
        >
          {loading ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
              {inviteToken ? "Joining..." : "Creating account..."}
            </>
          ) : (
            <>
              {inviteToken ? "Join Team" : "Start Free Trial"}
              <ArrowRight style={{ width: 16, height: 16 }} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {/* ToS */}
      <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
        By continuing, you agree to our{" "}
        <Link href="/terms" style={{ color: "#7C3AED", textDecoration: "none" }}>Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" style={{ color: "#7C3AED", textDecoration: "none" }}>Privacy Policy</Link>.
      </p>

      <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 16 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
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
      `}</style>

      {/* Background orbs */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", right: "8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <LedgrLogo />

        {/* Step indicator: signup = step 1 of 2 (onboarding is step 2) */}
        <StepIndicator current={1} total={2} />

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          }}
        >
          <Suspense fallback={<div style={{ height: 320 }} aria-label="Loading form" />}>
            <SignupForm />
          </Suspense>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          AI-powered accounting for modern businesses
        </p>
      </div>
    </div>
  );
}
