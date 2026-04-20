"use client";
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="brand" style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 20, marginBottom: 32, textAlign: "center", maxWidth: 360 }}>
        <div className="brand-word" style={{ fontSize: 40 }}>Ledgr</div>
        <div className="brand-sub">Smart accounting</div>
      </div>

      <div className="eyebrow-stamp" style={{ marginBottom: 12 }}>Offline</div>
      <h1 className="display-h1" style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>
        You're <em>offline</em>
      </h1>

      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", maxWidth: "54ch", lineHeight: 1.55, textAlign: "center", fontSize: 15 }}>
        Ledgr will sync your data the moment you're back online. Nothing is lost.
      </p>

      <button
        type="button"
        onClick={() => typeof window !== "undefined" && window.location.reload()}
        className="btn stamp lg"
        style={{ marginTop: 28 }}
      >
        Try again
      </button>
    </div>
  );
}
