import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null); // { message, email, emailSent }
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (score === 3) return { label: "Good", color: "#10b981", width: "75%" };
    return { label: "Strong", color: "#059669", width: "100%" };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessData({
        message: response.data.message,
        email: formData.email.trim(),
        emailSent: response.data.emailSent,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const response = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-up failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up was cancelled or failed.");
  };
  const handleResend = async () => {
    if (!successData?.email) return;
    setResendLoading(true);
    setResendMsg("");
    try {
      await api.post("/api/auth/resend-verification", { email: successData.email });
      setResendMsg("Verification email resent! Check your inbox.");
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Success State — Email Verification Needed ───────────────────────────────
  if (successData) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>📧</div>
            <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", color: "#0f172a" }}>
              Check your email
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {successData.emailSent
                ? <>We sent a verification link to <strong>{successData.email}</strong>. Click the link to activate your account.</>
                : "Your account was created. Email verification is temporarily unavailable — contact support if needed."}
            </p>
          </div>

          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: "0.875rem", color: "#1e40af", lineHeight: 1.8 }}>
              <li>Check your inbox (and spam folder)</li>
              <li>The link expires in <strong>24 hours</strong></li>
              <li>After verifying, you can log in</li>
            </ul>
          </div>

          {resendMsg && (
            <div style={{
              padding: "10px 14px",
              background: resendMsg.includes("resent") ? "#ecfdf5" : "#fef2f2",
              borderRadius: "7px",
              color: resendMsg.includes("resent") ? "#059669" : "#dc2626",
              fontSize: "0.875rem",
              marginBottom: "16px",
            }}>
              {resendMsg}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              ...submitBtnStyle,
              background: "#fff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              marginBottom: "12px",
              opacity: resendLoading ? 0.6 : 1,
            }}
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </button>

          <Link
            to="/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px",
              fontSize: "0.875rem",
              color: "#475569",
              textDecoration: "none",
            }}
          >
            Already verified? <span style={{ color: "#2563eb", fontWeight: "600" }}>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration Form ────────────────────────────────────────────────────────
  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.75rem", color: "#0f172a" }}>
            Create Account 🚀
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
            Join DevCollab and connect with developers
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={fieldWrap}>
            <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
            <input
              id="reg-name" type="text" name="name"
              value={formData.name} onChange={handleChange}
              placeholder="John Doe" required autoComplete="name"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={fieldWrap}>
            <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
            <input
              id="reg-email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="john@example.com" required autoComplete="email"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={fieldWrap}>
            <label htmlFor="reg-password" style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Create password (min. 6 chars)" required autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                style={eyeBtnStyle}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Strength Meter */}
            {formData.password && strength && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: strength.width,
                    background: strength.color,
                    borderRadius: "9999px",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: strength.color, fontWeight: "600", marginTop: "3px", display: "inline-block" }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ ...fieldWrap, marginBottom: "20px" }}>
            <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-confirm"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="Repeat password" required autoComplete="new-password"
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password ? "#fca5a5" : undefined,
                }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowConfirmPassword((p) => !p)}
                style={eyeBtnStyle}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#ef4444" }}>
                Passwords don't match
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "500", whiteSpace: "nowrap" }}>or sign up with</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Google Sign Up */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="rectangular"
              theme="outline"
              size="large"
              text="signup_with"
              width="360"
            />
          </div>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.875rem", color: "#64748b" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────
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
  maxWidth: "440px",
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

const fieldWrap = { marginBottom: "14px" };

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
  transition: "border-color 0.15s",
};

const eyeBtnStyle = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  padding: "4px",
  lineHeight: 1,
};

const submitBtnStyle = {
  width: "100%",
  padding: "11px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.95rem",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
  transition: "background 0.15s",
};

export default Register;