import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "var(--bg)",
    }}>
      <div style={{
        maxWidth: "480px",
        textAlign: "center",
        animation: "fadeInUp 0.4s ease",
      }}>
        {/* Glowing 404 */}
        <div style={{
          fontSize: "7rem",
          fontWeight: "900",
          lineHeight: 1,
          marginBottom: "0.5rem",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 40px rgba(99,102,241,0.4))",
        }}>
          404
        </div>

        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>

        <h2 style={{
          fontSize: "1.5rem", fontWeight: "700",
          color: "var(--text-primary)",
          margin: "0 0 0.75rem 0",
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: "var(--text-secondary)",
          marginBottom: "2rem",
          fontSize: "0.95rem",
          lineHeight: 1.6,
        }}>
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "0.95rem",
              boxShadow: "0 6px 20px rgba(99,102,241,0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4)";
            }}
          >
            ← Back to Home
          </Link>
          <Link
            to="/dashboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "0.95rem",
              border: "1px solid var(--border)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.borderColor = "var(--primary-border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default NotFound;