import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Register() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [focusedField, setFocusedField] = useState(null);

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
    if (score <= 1) return { label: "Weak", color: "#f87171", width: "25%" };
    if (score === 2) return { label: "Fair", color: "#fbbf24", width: "50%" };
    if (score === 3) return { label: "Good", color: "#34d399", width: "75%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
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

  const getInputStyle = (field, extraBorderColor) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "9px",
    border: `1px solid ${extraBorderColor || (focusedField === field ? "var(--primary)" : "var(--border)")}`,
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    background: focusedField === field ? "var(--surface)" : "var(--surface-2)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "var(--font)",
    transition: "all 0.2s ease",
    boxShadow: focusedField === field ? "0 0 0 3px var(--primary-light)" : "none",
  });

  // ── Success / Verify Email State ──
  if (successData) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "var(--bg)",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--surface)",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          padding: "40px 36px",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          animation: "fadeInUp 0.4s ease",
        }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📧</div>
          <h1 style={{ margin: "0 0 10px", fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Check your email
          </h1>
          <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {successData.emailSent
              ? <>We sent a verification link to <strong style={{ color: "var(--text-primary)" }}>{successData.email}</strong>. Click the link to activate your account.</>
              : "Your account was created. Email verification is temporarily unavailable — contact support if needed."}
          </p>

          <div style={{
            background: "var(--info-bg)",
            border: "1px solid var(--info-border)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            textAlign: "left",
          }}>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: "0.875rem", color: "var(--info)", lineHeight: 1.9 }}>
              <li>Check your inbox (and spam folder)</li>
              <li>The link expires in <strong>24 hours</strong></li>
              <li>After verifying, you can log in</li>
            </ul>
          </div>

          {resendMsg && (
            <div style={{
              padding: "11px 16px",
              background: resendMsg.includes("resent") ? "var(--success-bg)" : "var(--error-bg)",
              border: `1px solid ${resendMsg.includes("resent") ? "var(--success-border)" : "var(--error-border)"}`,
              borderRadius: "8px",
              color: resendMsg.includes("resent") ? "var(--success)" : "var(--error)",
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
              width: "100%",
              padding: "11px",
              background: "var(--surface-2)",
              color: "var(--primary)",
              border: "1px solid var(--primary-border)",
              borderRadius: "10px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: resendLoading ? "not-allowed" : "pointer",
              opacity: resendLoading ? 0.6 : 1,
              fontFamily: "var(--font)",
              marginBottom: "12px",
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
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            Already verified?{" "}
            <span style={{ color: "var(--primary)", fontWeight: "700" }}>Sign In</span>
          </Link>
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

  // ── Registration Form ──
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
        background: "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)",
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
            🚀
          </div>
          <h1 style={{
            margin: "0 0 6px", fontSize: "1.7rem", fontWeight: "800",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
          }}>
            Create Account
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Join DevCollab and connect with developers
          </p>
        </div>

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
          {/* Name */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="reg-name" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Full Name
            </label>
            <input
              id="reg-name" type="text" name="name"
              value={formData.name} onChange={handleChange}
              placeholder="John Doe" required autoComplete="name"
              style={getInputStyle("name")}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="reg-email" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Email Address
            </label>
            <input
              id="reg-email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="john@example.com" required autoComplete="email"
              style={getInputStyle("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="reg-password" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Create password (min. 6 chars)" required autoComplete="new-password"
                style={{ ...getInputStyle("password"), paddingRight: "46px" }}
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
            {/* Strength Meter */}
            {formData.password && strength && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: strength.width,
                    background: strength.color,
                    borderRadius: "9999px",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: strength.color, fontWeight: "700", marginTop: "4px", display: "inline-block" }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="reg-confirm" style={{
              display: "block", fontSize: "0.85rem", fontWeight: "600",
              color: "var(--text-secondary)", marginBottom: "7px",
            }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-confirm"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="Repeat password" required autoComplete="new-password"
                style={{
                  ...getInputStyle("confirm",
                    formData.confirmPassword && formData.confirmPassword !== formData.password
                      ? "var(--error-border)" : undefined),
                  paddingRight: "46px"
                }}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((p) => !p)}
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
                {showConfirmPassword ? (
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
            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
              <p style={{ margin: "5px 0 0", fontSize: "0.78rem", color: "var(--error)", fontWeight: "500" }}>
                Passwords don't match
              </p>
            )}
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
                Creating Account...
              </span>
            ) : "Create Account →"}
          </button>

          {/* OR Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap" }}>
              or sign up with
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Google */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="rectangular"
              theme={isDark ? "filled_black" : "outline"}
              size="large"
              text="signup_with"
              width="368"
            />
          </div>
        </form>

        <div style={{ marginTop: "22px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none" }}
            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
          >
            Sign In
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

export default Register;