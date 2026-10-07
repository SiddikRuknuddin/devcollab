import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

// Shared dark form input style
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  fontFamily: "var(--font)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "700",
  color: "var(--text-secondary)",
  marginBottom: "6px",
};

function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", description: "", technologies: "", githubUrl: "", status: "Planning",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required"); return;
    }
    setLoading(true); setError("");
    try {
      const technologiesArray = formData.technologies.split(",").map(t => t.trim()).filter(Boolean);
      await api.post("/api/projects", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        technologies: technologiesArray,
        githubUrl: formData.githubUrl.trim(),
        status: formData.status,
      });
      navigate("/projects");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project. Please try again.");
    } finally { setLoading(false); }
  };

  const getFocusStyle = (field) => field === focusedField
    ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-light)" }
    : {};

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "var(--bg)",
      padding: "2rem 1.25rem 4rem",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "640px" }}>
        {/* Back link */}
        <Link to="/projects" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--text-muted)", textDecoration: "none",
          fontSize: "0.875rem", fontWeight: "600", marginBottom: "24px",
          transition: "color 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          ← Back to Projects
        </Link>

        {/* Card */}
        <div style={{
          background: "var(--surface)", borderRadius: "20px",
          border: "1px solid var(--border)", padding: "2rem 2.25rem",
          boxShadow: "var(--shadow-lg)",
        }}>
          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
              }}>🚀</span>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)" }}>
                Create Project
              </h1>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.92rem" }}>
              Start a new development project and invite teammates.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: "12px 16px", background: "var(--error-bg)",
              border: "1px solid var(--error-border)", borderRadius: "10px",
              color: "var(--error)", fontSize: "0.875rem", marginBottom: "20px",
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Title */}
            <div>
              <label htmlFor="proj-title" style={labelStyle}>Project Title <span style={{ color: "var(--primary)" }}>*</span></label>
              <input
                id="proj-title" type="text" name="title"
                value={formData.title} onChange={handleChange} required
                placeholder="e.g. AI Code Assistant"
                onFocus={() => setFocusedField("title")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, ...getFocusStyle("title") }}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="proj-desc" style={labelStyle}>Description <span style={{ color: "var(--primary)" }}>*</span></label>
              <textarea
                id="proj-desc" name="description"
                value={formData.description} onChange={handleChange} required rows="4"
                placeholder="What does this project do? Describe the problem it solves..."
                onFocus={() => setFocusedField("desc")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, ...getFocusStyle("desc") }}
              />
            </div>

            {/* Technologies & Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label htmlFor="proj-tech" style={labelStyle}>Technologies</label>
                <input
                  id="proj-tech" type="text" name="technologies"
                  value={formData.technologies} onChange={handleChange}
                  placeholder="React, Node.js, MongoDB"
                  onFocus={() => setFocusedField("tech")} onBlur={() => setFocusedField("")}
                  style={{ ...inputStyle, ...getFocusStyle("tech") }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Comma-separated</p>
              </div>
              <div>
                <label htmlFor="proj-status" style={labelStyle}>Status</label>
                <select
                  id="proj-status" name="status"
                  value={formData.status} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="Planning">📋 Planning</option>
                  <option value="In Progress">⚡ In Progress</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>
            </div>

            {/* GitHub URL */}
            <div>
              <label htmlFor="proj-github" style={labelStyle}>GitHub URL</label>
              <input
                id="proj-github" type="url" name="githubUrl"
                value={formData.githubUrl} onChange={handleChange}
                placeholder="https://github.com/username/repository"
                onFocus={() => setFocusedField("github")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, ...getFocusStyle("github") }}
              />
              {formData.githubUrl && !formData.githubUrl.toLowerCase().includes("github.com") && (
                <p style={{ margin: "5px 0 0", fontSize: "0.78rem", color: "#f59e0b" }}>
                  ⚠️ This must be a GitHub repository link (e.g. <code>https://github.com/owner/repo</code>).
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
              <button
                type="submit" disabled={loading}
                style={{
                  flex: 1, padding: "12px 24px",
                  background: loading ? "var(--surface-2)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: loading ? "var(--text-muted)" : "#fff",
                  border: "none", borderRadius: "10px",
                  fontWeight: "700", fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {loading ? "Creating..." : "🚀 Create Project"}
              </button>
              <button
                type="button" onClick={() => navigate("/projects")}
                style={{
                  padding: "12px 22px",
                  background: "var(--surface-2)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", borderRadius: "10px",
                  fontWeight: "600", fontSize: "0.95rem",
                  cursor: "pointer", fontFamily: "var(--font)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateProject;