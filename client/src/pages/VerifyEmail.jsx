import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

function VerifyEmail() {
  const { token } = useParams();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/api/auth/verify-email/${token}`);
        setMessage(response.data.message || "Email verified successfully!");
        setStatus("success");
      } catch (err) {
        setMessage(
          err.response?.data?.message ||
          "Verification failed. The link may be invalid or expired."
        );
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "#f8fafc",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        padding: "40px 32px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}>

        {status === "loading" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h1 style={{ fontSize: "1.4rem", color: "#0f172a", margin: "0 0 8px" }}>
              Verifying your email...
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
              Please wait a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ fontSize: "1.5rem", color: "#0f172a", margin: "0 0 10px" }}>
              Email Verified!
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.6 }}>
              {message}
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "11px 28px",
                background: "#2563eb",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Sign In Now →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ fontSize: "1.5rem", color: "#0f172a", margin: "0 0 10px" }}>
              Verification Failed
            </h1>
            <p style={{
              color: "#dc2626",
              fontSize: "0.9rem",
              margin: "0 0 24px",
              lineHeight: 1.6,
              background: "#fef2f2",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            }}>
              {message}
            </p>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "20px" }}>
              Need a new verification link?
            </p>
            <Link
              to="/register"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "#fff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.9rem",
                textDecoration: "none",
                marginRight: "12px",
              }}
            >
              Register Again
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "#2563eb",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
