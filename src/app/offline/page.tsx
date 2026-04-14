"use client";
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>L</span>
      </div>

      {/* Offline icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.1)",
          border: "2px solid rgba(239, 68, 68, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#F8FAFC",
          marginBottom: 12,
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        You&apos;re offline
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#94A3B8",
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Ledgr will sync your data automatically when you&apos;re back online. No
        changes have been lost.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "12px 28px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
