"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Building2, ArrowRight, Sparkles, UserCheck } from "lucide-react";

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Invite state
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // If there's an invite token, validate it and prefill email
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

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (inviteToken && inviteValid) {
        // Accept invite flow: set name + password, activate existing pending user
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

        // Sign in with the newly activated credentials
        const signed = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signed?.error) {
          setError("Account activated — please sign in.");
          setLoading(false);
          router.push("/login");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        // Normal signup flow: create a new user + company
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, companyName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || "Sign up failed");
          setLoading(false);
          return;
        }

        const signed = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signed?.error) {
          setError("Account created — please sign in.");
          setLoading(false);
          router.push("/login");
          return;
        }
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  // Loading state while validating invite
  if (inviteToken && inviteLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #7C3AED", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontSize: 14, color: "#64748B" }}>Validating invite...</p>
      </div>
    );
  }

  // Invalid invite
  if (inviteToken && inviteError) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <span style={{ fontSize: 22, color: "#DC2626" }}>!</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Invalid Invite</h2>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>{inviteError}</p>
        <Link href="/login" style={{ color: "#7C3AED", fontWeight: 600, fontSize: 14 }}>Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {inviteToken && inviteValid ? (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, background: "#EDE9FE", marginBottom: 10 }}>
              <UserCheck style={{ width: 14, height: 14, color: "#7C3AED" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", textTransform: "capitalize" }}>
                Joining as {inviteRole}
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Accept your invite</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              Set your name and password to join the team.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Create your account</h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Start your books in under a minute.</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field
          label="Your name"
          icon={<User style={{ width: 16, height: 16, color: "#94A3B8" }} />}
          value={name}
          onChange={setName}
          placeholder="Jane Doe"
          type="text"
          required
        />
        {!inviteToken && (
          <Field
            label="Business name"
            icon={<Building2 style={{ width: 16, height: 16, color: "#94A3B8" }} />}
            value={companyName}
            onChange={setCompanyName}
            placeholder="Acme Consulting LLC"
            type="text"
          />
        )}
        <Field
          label="Work email"
          icon={<Mail style={{ width: 16, height: 16, color: "#94A3B8" }} />}
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          type="email"
          required
          disabled={!!(inviteToken && inviteValid)}
        />
        <Field
          label="Password"
          icon={<Lock style={{ width: 16, height: 16, color: "#94A3B8" }} />}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          type="password"
          required
        />
        <Field
          label="Confirm password"
          icon={<Lock style={{ width: 16, height: 16, color: "#94A3B8" }} />}
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter password"
          type="password"
          required
        />

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6,
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
          }}
        >
          {loading ? (
            <span>{inviteToken ? "Joining..." : "Creating account..."}</span>
          ) : (
            <>
              {inviteToken ? "Join Team" : "Create Account"}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </>
          )}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 18 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#7C3AED", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
        padding: 24,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #9333EA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>L</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Ledgr
          </span>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <Suspense fallback={<div style={{ height: 120 }} />}>
            <SignupForm />
          </Suspense>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#7C3AED" }} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            AI-powered accounting for modern businesses
          </span>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const { label, icon, value, onChange, placeholder, type = "text", required, disabled } = props;
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "12px 12px 12px 40px",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            fontSize: 14,
            color: "#0F172A",
            background: disabled ? "#F1F5F9" : "#F8FAFC",
            outline: "none",
            boxSizing: "border-box",
            opacity: disabled ? 0.7 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = "#7C3AED";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}
