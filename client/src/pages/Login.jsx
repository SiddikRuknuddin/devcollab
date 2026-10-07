import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
    if (verificationNeeded) setVerificationNeeded(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    setVerificationNeeded(null);

    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requiresVerification) {
        setVerificationNeeded({ email: data.email || formData.email.trim() });
      } else {
        setError(data?.message || "Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setVerificationNeeded(null);
    try {
      const response = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed.");
  };

  const handleResend = async () => {
    if (!verificationNeeded?.email) return;
    setResendLoading(true);
    setResendMsg("");
    try {
      await api.post("/api/auth/resend-verification", { email: verificationNeeded.email });
      setResendMsg("Verification email sent! Check your inbox.");
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "9px",
    border: `1px solid ${focusedField === field ? "var(--primary)" : "var(--border)"}`,
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    background: focusedField === field ? "var(--surface)" : "var(--surface-2)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "var(--font)",
    transition: "all 0.2s ease",
    boxShadow: focusedField === field ? "0 0 0 3px var(--primary-light)" : "none",
  });

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      background: "var(--bg)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "500px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "var(--surface)",
        borderRadius: "18px",
        border: "1px solid var(--border)",
        padding: "36px",
        boxShadow: "var(--shadow-lg), 0 0 0 1px var(--border)",
        position: "relative",
        zIndex: 1,
        animation: "fadeInUp 0.4s ease",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            fontSize: "22px",
          }}>
            👋
          </div>
          <h1 style={{
            margin: "0 0 6px", fontSize: "1.7rem", fontWeight: "800",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
          }}>
            Welcome Back
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Log in to your DevCollab account
          </p>
        </div>

        {/* Email verification banner */}
        {verificationNeeded && (
          <div style={{
            padding: "14px 16px",
            background: "var(--warning-bg)",
            border: "1px solid var(--warning-border)",
            borderRadius: "10px",
            marginBottom: "18px",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: "0.875rem", fontWeight: "700", color: "var(--warning)" }}>
              📧 Email verification required
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--warning)", lineHeight: 1.5, opacity: 0.85 }}>
              Please verify <strong>{verificationNeeded.email}</strong> before logging in.
            </p>
            {resendMsg ? (
              <p style={{
                margin: 0, fontSize: "0.82rem", fontWeight: "600",
                color: resendMsg.includes("sent") ? "var(--success)" : "var(--error)",
              }}>
                {resendMsg}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  padding: "6px 14px",
                  background: "var(--surface)",
                  border: "1px solid var(--warning-border)",
                  borderRadius: "7px",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "var(--warning)",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  opacity: resendLoading ? 0.7 : 1,
                  fontFamily: "var(--font)",
                }}
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px",
            background: "var(--error-bg)",
            border: "1px solid var(--error-border)",
            borderRadius: "9px",
            color: "var(--error)",
            fontSize: "0.875rem",
            marginBottom: "18px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="login-email" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Email Address
            </label>
            <input
              id="login-email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="developer@example.com" required autoComplete="email"
              style={inputStyle("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="login-password" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password" required autoComplete="current-password"
                style={{ ...inputStyle("password"), paddingRight: "46px" }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  borderRadius: "6px",
                  color: "var(--text-secondary)",
                  transition: "color 0.15s ease",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "var(--surface-2)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: loading ? "var(--text-muted)" : "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.95rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font)",
              transition: "all 0.2s ease",
              boxShadow: loading ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = loading ? "none" : "0 6px 20px rgba(99,102,241,0.4)";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{
                  width: "14px", height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Signing In...
              </span>
            ) : "Sign In →"}
          </button>

          {/* OR Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap" }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Google Sign In */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              theme={isDark ? "filled_black" : "outline"}
              size="large"
              text="signin_with"
              width="368"
            />
          </div>
        </form>

        <div style={{ marginTop: "22px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none" }}
            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
          >
            Sign Up Free
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;