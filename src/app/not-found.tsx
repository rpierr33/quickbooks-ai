import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 16,
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: '#1E293B',
          margin: 0,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        404
      </h2>
      <p style={{ color: '#64748B', fontSize: 16, margin: 0 }}>
        This page does not exist
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 24px',
          background: '#3B82F6',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 500,
          marginTop: 8,
          display: 'inline-block',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
