import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";


function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(null); // { email }
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

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


  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.75rem", color: "#0f172a" }}>
            Welcome Back 👋
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
            Log in to your DevCollab account
          </p>
        </div>

        {/* Email verification banner */}
        {verificationNeeded && (
          <div style={{
            padding: "14px 16px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            marginBottom: "16px",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.875rem", fontWeight: "600", color: "#92400e" }}>
              📧 Email verification required
            </p>
            <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5 }}>
              Please verify <strong>{verificationNeeded.email}</strong> before logging in.
            </p>
            {resendMsg ? (
              <p style={{ margin: 0, fontSize: "0.82rem", color: resendMsg.includes("sent") ? "#059669" : "#dc2626", fontWeight: "500" }}>
                {resendMsg}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  padding: "6px 14px",
                  background: "#fff",
                  border: "1px solid #fde68a",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "#d97706",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  opacity: resendLoading ? 0.7 : 1,
                }}
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="login-email" style={labelStyle}>Email Address</label>
            <input
              id="login-email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="developer@example.com" required autoComplete="email"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="login-password" style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password" required autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute", right: "10px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent", border: "none",
                  cursor: "pointer", fontSize: "14px", padding: "4px", lineHeight: 1,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Inter', sans-serif",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "500", whiteSpace: "nowrap" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Google Sign In */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              theme="outline"
              size="large"
              text="signin_with"
              width="360"
            />
          </div>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.875rem", color: "#64748b" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

const outerStyle = {
  minHeight: "calc(100vh - 60px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  background: "#f8fafc",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  padding: "32px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
};

const errorStyle = {
  padding: "10px 14px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  color: "#dc2626",
  fontSize: "0.875rem",
  marginBottom: "16px",
};

const labelStyle = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: "#0f172a",
  marginBottom: "5px",
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "7px",
  border: "1px solid #e2e8f0",
  fontSize: "0.9rem",
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Inter', sans-serif",
};

export default Login;