import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "General", "Programming", "Web Development", "Mobile Development",
  "Machine Learning", "DevOps", "Database", "Career", "Projects", "Help",
];

const CATEGORY_ICONS = {
  General: "💡", Programming: "💻", "Web Development": "🌍",
  "Mobile Development": "📱", "Machine Learning": "🤖", DevOps: "⚙️",
  Database: "🗄️", Career: "🚀", Projects: "📁", Help: "🆘",
};

const inputStyle = {
  width: "100%", padding: "11px 14px",
  borderRadius: "10px", border: "1px solid var(--border)",
  fontSize: "0.95rem", boxSizing: "border-box",
  background: "var(--surface-2)", color: "var(--text-primary)",
  fontFamily: "var(--font)", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
const labelStyle = {
  display: "block", fontSize: "0.875rem",
  fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px",
};

function CreateDiscussion() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [formData, setFormData] = useState({
    title: "", content: "", category: "General", tags: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setError("Please enter a discussion title"); return; }
    if (!formData.content.trim()) { setError("Please enter discussion content"); return; }
    setLoading(true); setError("");
    try {
      const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await api.post("/api/discussions", {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: tagsArray,
      });
      navigate(`/discussions/${res.data.discussion._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create discussion. Try again.");
    } finally { setLoading(false); }
  };

  const getFocusStyle = (field) => field === focusedField
    ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-light)" }
    : {};

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)", background: "var(--bg)",
      padding: "2rem 1.25rem 4rem",
    }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Link to="/discussions" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--text-muted)", textDecoration: "none",
          fontSize: "0.875rem", fontWeight: "600", marginBottom: "24px",
          transition: "color 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          ← Back to Discussions
        </Link>

        {/* Page header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            margin: "0 0 8px", fontSize: "2rem", fontWeight: "800",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{
              width: "42px", height: "42px", borderRadius: "11px",
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 6px 20px rgba(236,72,153,0.35)",
            }}>✍️</span>
            Start a Discussion
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Share a thought, ask for help, or kick off a conversation with the DevCollab community.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "12px 16px", background: "var(--error-bg)",
            border: "1px solid var(--error-border)", borderRadius: "10px",
            color: "var(--error)", fontSize: "0.875rem", marginBottom: "20px",
          }}>⚠️ {error}</div>
        )}

        {/* Form Card */}
        <div style={{
          background: "var(--surface)", borderRadius: "20px",
          border: "1px solid var(--border)", padding: "2rem 2.25rem",
          boxShadow: "var(--shadow-lg)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Discussion Title <span style={{ color: "var(--primary)" }}>*</span></label>
              <input
                type="text" name="title" value={formData.title} onChange={handleChange} required
                placeholder="e.g. Best state management library for React in 2026?"
                onFocus={() => setFocusedField("title")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, ...getFocusStyle("title") }}
              />
            </div>

            {/* Category + Tags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Category <span style={{ color: "var(--primary)" }}>*</span></label>
                <select
                  name="category" value={formData.category} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tags</label>
                <input
                  type="text" name="tags" value={formData.tags} onChange={handleChange}
                  placeholder="e.g. React, Redux, Zustand"
                  onFocus={() => setFocusedField("tags")} onBlur={() => setFocusedField("")}
                  style={{ ...inputStyle, ...getFocusStyle("tags") }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Comma-separated</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <label style={labelStyle}>Content <span style={{ color: "var(--primary)" }}>*</span></label>
              <textarea
                name="content" value={formData.content} onChange={handleChange} rows="8" required
                placeholder="Describe your question or discussion in detail. Be clear and concise..."
                onFocus={() => setFocusedField("content")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, ...getFocusStyle("content") }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
              <button
                type="submit" disabled={loading}
                style={{
                  flex: 1, padding: "12px 24px",
                  background: loading ? "var(--surface-2)" : "linear-gradient(135deg, #ec4899, #8b5cf6)",
                  color: loading ? "var(--text-muted)" : "#fff",
                  border: "none", borderRadius: "10px",
                  fontWeight: "700", fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(236,72,153,0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {loading ? "Publishing..." : "🚀 Publish Discussion"}
              </button>
              <button
                type="button" onClick={() => navigate("/discussions")}
                style={{
                  padding: "12px 22px",
                  background: "var(--surface-2)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", borderRadius: "10px",
                  fontWeight: "600", fontSize: "0.95rem",
                  cursor: "pointer", fontFamily: "var(--font)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-border)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`select option { background: var(--surface); color: var(--text-primary); }`}</style>
    </div>
  );
}

export default CreateDiscussion;
