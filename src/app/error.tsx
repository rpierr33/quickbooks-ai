'use client';

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
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 28 }}>!</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F172A', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ color: '#64748B', fontSize: 14, margin: 0, maxWidth: 400 }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          background: '#3B82F6',
          color: '#fff',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          marginTop: 8,
        }}
      >
        Try again
      </button>
    </div>
  );
}
