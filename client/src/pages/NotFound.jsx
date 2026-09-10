import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "5rem auto",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "4rem" }}>🔍</span>
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          color: "#111827",
          margin: "1rem 0 0.5rem 0",
        }}
      >
        404
      </h1>
      <h2 style={{ fontSize: "1.25rem", color: "#374151", margin: "0 0 1rem 0" }}>
        Page Not Found
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        The page you are looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}

export default NotFound;