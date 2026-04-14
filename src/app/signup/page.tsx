"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Building2, ArrowRight, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Account created — sign them in and send to onboarding.
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

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
          <span
            style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}
          >
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
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
              Create your account
            </h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              Start your books in under a minute.
            </p>
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
            <Field
              label="Business name"
              icon={<Building2 style={{ width: 16, height: 16, color: "#94A3B8" }} />}
              value={companyName}
              onChange={setCompanyName}
              placeholder="Acme Consulting LLC"
              type="text"
            />
            <Field
              label="Work email"
              icon={<Mail style={{ width: 16, height: 16, color: "#94A3B8" }} />}
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              type="email"
              required
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
                <span>Creating account…</span>
              ) : (
                <>
                  Create Account
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
}) {
  const { label, icon, value, onChange, placeholder, type = "text", required } = props;
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
          style={{
            width: "100%",
            padding: "12px 12px 12px 40px",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            fontSize: 14,
            color: "#0F172A",
            background: "#F8FAFC",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#7C3AED";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
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
