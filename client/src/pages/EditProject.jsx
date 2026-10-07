import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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

const Shell = ({ children }) => (
  <div style={{
    minHeight: "calc(100vh - 64px)", background: "var(--bg)",
    padding: "2rem 1.25rem 4rem",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
  }}>
    <div style={{ width: "100%", maxWidth: "640px" }}>{children}</div>
  </div>
);

function EditProject() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [formData, setFormData] = useState({
    title: "", description: "", technologies: "", githubUrl: "", status: "Planning",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/api/projects/${id}`);
        const p = res.data.project;
        if (!p) { setError("Project not found"); return; }
        setFormData({
          title: p.title || "",
          description: p.description || "",
          technologies: p.technologies?.join(", ") || "",
          githubUrl: p.githubUrl || "",
          status: p.status || "Planning",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load project details");
      } finally { setLoading(false); }
    };
    if (token && id) fetchProject();
  }, [token, id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required"); return;
    }
    setSaving(true); setError("");
    try {
      const technologiesArray = formData.technologies.split(",").map(t => t.trim()).filter(Boolean);
      await api.put(`/api/projects/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        technologies: technologiesArray,
        githubUrl: formData.githubUrl.trim(),
        status: formData.status,
      });
      navigate("/projects");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project. Please try again.");
    } finally { setSaving(false); }
  };

  const getFocusStyle = (field) => field === focusedField
    ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-light)" }
    : {};

  if (loading) return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "3rem 0", color: "var(--text-muted)" }}>
        <div style={{
          width: "36px", height: "36px", border: "3px solid var(--border)",
          borderTopColor: "var(--primary)", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        Loading project...
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  return (
    <Shell>
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
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 6px 18px rgba(245,158,11,0.35)",
            }}>✏️</span>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Edit Project
            </h1>
          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Update your project information and tech stack.
          </p>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", background: "var(--error-bg)",
            border: "1px solid var(--error-border)", borderRadius: "10px",
            color: "var(--error)", fontSize: "0.875rem", marginBottom: "20px",
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label htmlFor="edit-proj-title" style={labelStyle}>Project Title <span style={{ color: "var(--primary)" }}>*</span></label>
            <input
              id="edit-proj-title" type="text" name="title"
              value={formData.title} onChange={handleChange} required
              onFocus={() => setFocusedField("title")} onBlur={() => setFocusedField("")}
              style={{ ...inputStyle, ...getFocusStyle("title") }}
            />
          </div>

          <div>
            <label htmlFor="edit-proj-desc" style={labelStyle}>Description <span style={{ color: "var(--primary)" }}>*</span></label>
            <textarea
              id="edit-proj-desc" name="description"
              value={formData.description} onChange={handleChange} required rows="4"
              onFocus={() => setFocusedField("desc")} onBlur={() => setFocusedField("")}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, ...getFocusStyle("desc") }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label htmlFor="edit-proj-tech" style={labelStyle}>Technologies</label>
              <input
                id="edit-proj-tech" type="text" name="technologies"
                value={formData.technologies} onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                onFocus={() => setFocusedField("tech")} onBlur={() => setFocusedField("")}
                style={{ ...inputStyle, ...getFocusStyle("tech") }}
              />
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Comma-separated</p>
            </div>
            <div>
              <label htmlFor="edit-proj-status" style={labelStyle}>Status</label>
              <select
                id="edit-proj-status" name="status"
                value={formData.status} onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="Planning">📋 Planning</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-proj-github" style={labelStyle}>GitHub URL</label>
            <input
              id="edit-proj-github" type="url" name="githubUrl"
              value={formData.githubUrl} onChange={handleChange}
              placeholder="https://github.com/username/project"
              onFocus={() => setFocusedField("github")} onBlur={() => setFocusedField("")}
              style={{ ...inputStyle, ...getFocusStyle("github") }}
            />
            {formData.githubUrl && !formData.githubUrl.toLowerCase().includes("github.com") && (
              <p style={{ margin: "5px 0 0", fontSize: "0.78rem", color: "#f59e0b" }}>
                ⚠️ This must be a GitHub repository link (e.g. <code>https://github.com/owner/repo</code>).
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              type="submit" disabled={saving}
              style={{
                flex: 1, padding: "12px 24px",
                background: saving ? "var(--surface-2)" : "linear-gradient(135deg, #f59e0b, #f97316)",
                color: saving ? "var(--text-muted)" : "#fff",
                border: "none", borderRadius: "10px",
                fontWeight: "700", fontSize: "0.95rem",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font)",
                boxShadow: saving ? "none" : "0 6px 20px rgba(245,158,11,0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {saving ? "Saving..." : "💾 Save Changes"}
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
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-border)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}

export default EditProject;