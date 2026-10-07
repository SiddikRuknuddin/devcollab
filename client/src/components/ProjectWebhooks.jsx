import { useEffect, useState } from "react";
import api from "../services/api";

const EVENT_OPTIONS = [
  { id: "task.created", label: "Task Created (Kanban)" },
  { id: "task.completed", label: "Task Completed (Kanban)" },
  { id: "milestone.completed", label: "Milestone Achieved (Roadmap)" },
  { id: "member.joined", label: "New Member Joined Project" },
  { id: "file.uploaded", label: "File Uploaded to Vault" },
  { id: "standup.started", label: "Video Standup Started" },
  { id: "code.reviewed", label: "AI Security Audit Run" },
];

export default function ProjectWebhooks({ projectId, isOwner }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [platform, setPlatform] = useState("discord");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState(["task.created", "task.completed", "milestone.completed"]);
  const [submitting, setSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { message, isSuccess }
  const [testingId, setTestingId] = useState(false);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/projects/${projectId}/webhooks`);
      if (res.data?.success) {
        setWebhooks(res.data.webhooks || []);
      }
    } catch (err) {
      console.error("Fetch webhooks error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchWebhooks();
  }, [projectId]);

  const handleToggleEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/projects/${projectId}/webhooks`, {
        platform,
        url,
        events: selectedEvents,
      });
      if (res.data?.success) {
        setWebhooks(res.data.webhooks);
        setShowAddModal(false);
        setUrl("");
        setSelectedEvents(["task.created", "task.completed", "milestone.completed"]);
      }
    } catch (err) {
      console.error("Add webhook error:", err);
      alert(err.response?.data?.message || "Failed to add webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm("Remove this automated webhook integration?")) return;
    try {
      const res = await api.delete(`/api/projects/${projectId}/webhooks/${webhookId}`);
      if (res.data?.success) {
        setWebhooks(res.data.webhooks);
      }
    } catch (err) {
      console.error("Delete webhook error:", err);
      alert("Failed to delete webhook");
    }
  };

  const handleTestPing = async () => {
    setTestingId(true);
    setTestStatus(null);
    try {
      const res = await api.post(`/api/projects/${projectId}/webhooks/test`);
      if (res.data?.success) {
        setTestStatus({ message: "✓ Test event dispatched to active channels!", isSuccess: true });
      }
    } catch (err) {
      setTestStatus({ message: "Failed to dispatch test event.", isSuccess: false });
    } finally {
      setTestingId(false);
      setTimeout(() => setTestStatus(null), 4000);
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
        gap: "14px",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5865F2, #4A154B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          }}>
            🔔
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Automated Discord & Slack Webhooks
            </h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Send automated embeds to your team's Discord or Slack channel when tasks, files, or milestones update
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {webhooks.length > 0 && (
            <button
              onClick={handleTestPing}
              disabled={testingId}
              style={{
                padding: "8px 16px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: testingId ? "wait" : "pointer"
              }}
            >
              {testingId ? "Pinging..." : "⚡ Send Test Ping"}
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)"
              }}
            >
              + Add Webhook
            </button>
          )}
        </div>
      </div>

      {testStatus && (
        <div style={{
          padding: "10px 16px",
          marginBottom: "16px",
          borderRadius: "8px",
          background: testStatus.isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          color: testStatus.isSuccess ? "#34d399" : "#f87171",
          border: `1px solid ${testStatus.isSuccess ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          fontSize: "0.85rem"
        }}>
          {testStatus.message}
        </div>
      )}

      {/* Webhooks list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
          Loading webhook integrations...
        </div>
      ) : webhooks.length === 0 ? (
        <div style={{
          padding: "36px 20px",
          textAlign: "center",
          background: "var(--surface-2)",
          borderRadius: "14px",
          border: "1px dashed var(--border)"
        }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📡</div>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Webhooks Configured</h4>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px", marginInline: "auto" }}>
            Connect a Discord channel or Slack incoming webhook to receive real-time project announcements and task completions automatically.
          </p>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 16px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Configure First Webhook
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {webhooks.map((hook) => (
            <div
              key={hook._id}
              style={{
                padding: "16px 18px",
                background: "var(--surface-2)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "260px" }}>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: hook.platform === "discord" ? "rgba(88, 101, 242, 0.2)" : hook.platform === "slack" ? "rgba(74, 21, 75, 0.2)" : "rgba(99, 102, 241, 0.2)",
                  color: hook.platform === "discord" ? "#5865F2" : hook.platform === "slack" ? "#e01e5a" : "#818cf8",
                  fontWeight: "800",
                  fontSize: "0.75rem",
                  textTransform: "uppercase"
                }}>
                  {hook.platform}
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-primary)" }}>
                    {hook.url.slice(0, 38)}••••••••{hook.url.slice(-8)}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {(hook.events || []).map((ev, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.7rem",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          color: "var(--text-muted)"
                        }}
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  fontSize: "0.75rem",
                  color: hook.active ? "#34d399" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: hook.active ? "#10b981" : "#64748b" }} />
                  {hook.active ? "Active" : "Paused"}
                </span>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteWebhook(hook._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#f87171",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      padding: "4px 8px"
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Webhook Modal */}
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
            maxWidth: "500px",
            width: "100%",
            background: "var(--surface)",
            borderRadius: "18px",
            border: "1px solid var(--border)",
            padding: "28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>
                Add New Webhook Integration
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWebhook} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                >
                  <option value="discord">Discord Channel Webhook</option>
                  <option value="slack">Slack Incoming Webhook</option>
                  <option value="custom">Generic Custom Webhook (JSON)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Webhook URL
                </label>
                <input
                  type="url"
                  required
                  placeholder={platform === "discord" ? "https://discord.com/api/webhooks/..." : "https://hooks.slack.com/services/..."}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {platform === "discord"
                    ? "Create in Discord: Channel Settings → Integrations → Webhooks → New Webhook → Copy URL"
                    : "Create in Slack: Apps → Incoming WebHooks → Add New Webhook to Workspace"}
                </p>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                  Trigger Events
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {EVENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.78rem",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        background: "var(--surface-2)",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: selectedEvents.includes(opt.id) ? "1px solid #6366f1" : "1px solid var(--border)"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(opt.id)}
                        onChange={() => handleToggleEvent(opt.id)}
                        style={{ accentColor: "#6366f1" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 16px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: submitting ? "wait" : "pointer"
                  }}
                >
                  {submitting ? "Saving..." : "Save Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
