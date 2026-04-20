"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="eyebrow-stamp" style={{ marginBottom: 14 }}>Something went wrong</div>
      <h1
        className="display-h1"
        style={{ fontSize: 56, margin: 0 }}
      >
        Unexpected <em>error</em>
      </h1>
      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", fontSize: 15, marginTop: 18, maxWidth: "54ch", lineHeight: 1.5 }}>
        {error.message || "An unexpected error occurred. Try the page again, or head back to the dashboard."}
      </p>
      <button onClick={reset} className="btn stamp" style={{ marginTop: 28 }}>
        Try again
      </button>
    </div>
  );
}
