"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1412",
          color: "#e8f0ee",
          fontFamily:
            '"DM Sans", system-ui, -apple-system, Segoe UI, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 28,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Ongevia
          </p>
          <h1 style={{ fontSize: 22, margin: "16px 0 8px" }}>
            This page couldn&apos;t load
          </h1>
          <p style={{ color: "#9ab0a8", fontSize: 14, margin: 0 }}>
            A server error occurred. Reload, or sign in again if this keeps
            happening.
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#0f766e",
                color: "#fff",
                border: 0,
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            {/* global-error replaces root layout; Link can fail here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/invalidate"
              style={{
                background: "transparent",
                color: "#e8f0ee",
                border: "1px solid #2a3d38",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in again
            </a>
          </div>
          {error.digest ? (
            <p style={{ marginTop: 20, fontSize: 11, color: "#6b7c76" }}>
              Ref {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
