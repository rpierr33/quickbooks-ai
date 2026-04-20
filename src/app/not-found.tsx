import Link from "next/link";

export default function NotFound() {
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
      <div className="eyebrow-stamp" style={{ marginBottom: 14 }}>Page not found</div>
      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(96px, 14vw, 180px)",
          fontWeight: 400,
          color: "var(--ink)",
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          margin: 0,
        }}
      >
        404
      </h1>
      <p style={{ fontFamily: "var(--sans)", color: "var(--ink-3)", fontSize: 17, marginTop: 18, maxWidth: "54ch", lineHeight: 1.5 }}>
        We couldn't find the page you're looking for. It may have moved, or the link led nowhere.
      </p>
      <Link href="/" className="btn stamp" style={{ marginTop: 28 }}>
        Back to dashboard
      </Link>
    </div>
  );
}
