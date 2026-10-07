import { useState } from "react";
import api from "../services/api";

const PROVIDER_ICONS = {
  Vercel: "▲",
  Render: "⚡",
  Netlify: "🌐",
  Railway: "🚂",
  AWS: "☁️",
  Custom: "🔗",
};

export default function ProjectDeployments({ projectId, deployments = [], isOwner, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ environment: "Production", provider: "Vercel", url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [pingingUrl, setPingingUrl] = useState(null);
  const [healthStatus, setHealthStatus] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/projects/${projectId}/deployments`, form);
      if (res.data?.success) {
        onUpdate(res.data.deployments);
        setShowAddModal(false);
        setForm({ environment: "Production", provider: "Vercel", url: "" });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add deployment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (depId) => {
    if (!window.confirm("Remove this deployment configuration?")) return;
    try {
      const res = await api.delete(`/api/projects/${projectId}/deployments/${depId}`);
      if (res.data?.success) {
        onUpdate(res.data.deployments);
        if (previewUrl === depId) setPreviewUrl(null);
      }
    } catch (err) {
      alert("Failed to delete deployment");
    }
  };

  const handlePing = async (url, depId) => {
    setPingingUrl(depId);
    try {
      const res = await api.post(`/api/projects/${projectId}/deployments/ping`, { url });
      if (res.data?.success) {
        setHealthStatus((prev) => ({
          ...prev,
          [depId]: {
            status: res.data.status,
            latencyMs: res.data.latencyMs,
            statusCode: res.data.statusCode,
          },
        }));
      }
    } catch (err) {
      setHealthStatus((prev) => ({
        ...prev,
        [depId]: { status: "Offline", latencyMs: 0 },
      }));
    } finally {
      setPingingUrl(null);
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      padding: "24px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          }}>
            🚀
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Cloud Deployments & Live Previews
            </h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Inspect live staging/production instances, monitor uptime latency, and test live in-browser
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)"
            }}
          >
            + Add Deployment
          </button>
        )}
      </div>

      {/* Deployments list */}
      {deployments.length === 0 ? (
        <div style={{
          padding: "36px 20px",
          textAlign: "center",
          background: "var(--surface-2)",
          borderRadius: "14px",
          border: "1px dashed var(--border)"
        }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>☁️</div>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Deployments Connected</h4>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px", marginInline: "auto" }}>
            Add your Vercel, Render, or Railway live deployment URL to monitor health and enable interactive live previews for collaborators.
          </p>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 16px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Add First Deployment URL
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {deployments.map((dep) => {
            const health = healthStatus[dep._id] || { status: dep.status, latencyMs: dep.latencyMs };
            const isLive = health.status === "Live";
            const isPreviewOpen = previewUrl === dep.url;

            return (
              <div
                key={dep._id}
                style={{
                  background: "var(--surface-2)",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <span>{PROVIDER_ICONS[dep.provider] || "☁️"}</span>
                      {dep.provider}
                    </span>

                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: dep.environment === "Production" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      color: dep.environment === "Production" ? "#34d399" : "#818cf8",
                      border: `1px solid ${dep.environment === "Production" ? "rgba(16, 185, 129, 0.3)" : "rgba(99, 102, 241, 0.3)"}`
                    }}>
                      {dep.environment}
                    </span>

                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        fontFamily: "monospace",
                        fontSize: "0.88rem",
                        fontWeight: "600"
                      }}
                    >
                      {dep.url} ↗
                    </a>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Live status badge */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "14px",
                      fontSize: "0.78rem",
                      background: isLive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: isLive ? "#34d399" : "#f87171",
                      border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                    }}>
                      <span style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: isLive ? "#10b981" : "#ef4444"
                      }} />
                      <span>{isLive ? `Live (${health.latencyMs || 84}ms)` : "Offline / Unreachable"}</span>
                    </div>

                    <button
                      onClick={() => handlePing(dep.url, dep._id)}
                      disabled={pingingUrl === dep._id}
                      style={{
                        padding: "5px 12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        cursor: pingingUrl === dep._id ? "wait" : "pointer"
                      }}
                    >
                      {pingingUrl === dep._id ? "Pinging..." : "⚡ Health Check"}
                    </button>

                    <button
                      onClick={() => setPreviewUrl(isPreviewOpen ? null : dep.url)}
                      style={{
                        padding: "5px 12px",
                        background: isPreviewOpen ? "#6366f1" : "var(--surface)",
                        border: "1px solid var(--border)",
                        color: isPreviewOpen ? "#fff" : "var(--text-primary)",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {isPreviewOpen ? "Hide Preview" : "🖥️ Preview in App"}
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(dep._id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          padding: "4px 8px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Embedded Live Preview Iframe */}
                {isPreviewOpen && (
                  <div style={{
                    marginTop: "8px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
                  }}>
                    <div style={{
                      padding: "8px 14px",
                      background: "#0d1322",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)"
                    }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                      <span style={{ marginLeft: "10px", fontFamily: "monospace" }}>{dep.url}</span>
                    </div>
                    <iframe
                      src={dep.url}
                      title="Live Deployment Preview"
                      style={{
                        width: "100%",
                        height: "440px",
                        border: "none",
                        background: "#fff",
                        display: "block"
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Deployment Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 100
        }}>
          <div style={{
            maxWidth: "460px",
            width: "100%",
            background: "var(--surface)",
            borderRadius: "18px",
            border: "1px solid var(--border)",
            padding: "26px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>
                Add Deployment Instance
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Environment
                </label>
                <select
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value })}
                  style={{
                    width: "100%", padding: "10px", background: "var(--surface-2)",
                    border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none"
                  }}
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Preview">Preview PR</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Hosting Provider
                </label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  style={{
                    width: "100%", padding: "10px", background: "var(--surface-2)",
                    border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none"
                  }}
                >
                  <option value="Vercel">Vercel</option>
                  <option value="Render">Render</option>
                  <option value="Netlify">Netlify</option>
                  <option value="Railway">Railway</option>
                  <option value="AWS">AWS Cloud</option>
                  <option value="Custom">Custom Domain</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Deployment URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://my-app.vercel.app"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", background: "var(--surface-2)",
                    border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)",
                    outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 16px", background: "var(--surface-2)", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px", background: "linear-gradient(135deg, #10b981, #06b6d4)",
                    border: "none", color: "#fff", borderRadius: "8px", fontWeight: "700",
                    cursor: submitting ? "wait" : "pointer"
                  }}
                >
                  {submitting ? "Saving..." : "Add Instance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
