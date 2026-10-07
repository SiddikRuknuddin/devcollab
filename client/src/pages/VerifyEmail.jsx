import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    const verify = async () => {
      try {
        const res = await api.get(`/api/auth/verify-email/${token}`);
        setMessage(res.data.message || "Email verified successfully!");
        setStatus("success");
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification failed. The link may be invalid or expired.");
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      background: "var(--bg)",
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "var(--surface)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        padding: "48px 36px",
        boxShadow: "var(--shadow-lg)",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient top glow */}
        <div style={{
          position: "absolute", top: "-60px", left: "50%",
          transform: "translateX(-50%)",
          width: "200px", height: "200px", borderRadius: "50%",
          background: status === "success"
            ? "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)"
            : status === "error"
            ? "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {status === "loading" && (
          <>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}>⏳</div>
            <h1 style={{ fontSize: "1.4rem", color: "var(--text-primary)", margin: "0 0 10px", fontWeight: "800" }}>
              Verifying your email...
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Please wait a moment.
            </p>
            <div style={{
              marginTop: "24px",
              width: "40px", height: "40px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "24px auto 0",
            }} />
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
            }}>✓</div>
            <h1 style={{ fontSize: "1.6rem", color: "var(--text-primary)", margin: "0 0 12px", fontWeight: "800" }}>
              Email Verified!
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: "0 0 28px", lineHeight: 1.6 }}>
              {message}
            </p>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", borderRadius: "10px",
              fontWeight: "700", fontSize: "0.95rem", textDecoration: "none",
              boxShadow: "0 6px 20px rgba(16,185,129,0.4)",
              transition: "all 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Sign In Now →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
            }}>✕</div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--text-primary)", margin: "0 0 12px", fontWeight: "800" }}>
              Verification Failed
            </h1>
            <div style={{
              background: "var(--error-bg)", border: "1px solid var(--error-border)",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
              color: "var(--error)", fontSize: "0.875rem", lineHeight: 1.6,
            }}>
              {message}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "20px" }}>
              Need a new verification link?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" style={{
                padding: "10px 22px",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "9px", fontWeight: "700",
                fontSize: "0.9rem", textDecoration: "none",
              }}>
                Register Again
              </Link>
              <Link to="/login" style={{
                padding: "10px 22px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", borderRadius: "9px",
                fontWeight: "700", fontSize: "0.9rem", textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}>
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default VerifyEmail;
