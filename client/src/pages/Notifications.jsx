import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TYPE_CONFIG = {
  PROJECT_INVITATION: { label: "Invitation", icon: "📨", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
  INVITATION_ACCEPTED: { label: "Accepted", icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  INVITATION_REJECTED: { label: "Declined", icon: "✕", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  PROJECT_MEMBER_REMOVED: { label: "Team Update", icon: "🔔", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  DISCUSSION_COMMENT: { label: "Comment", icon: "💬", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
};

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
];

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const Shell = ({ children }) => (
  <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem 4rem" }}>
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>{children}</div>
  </div>
);

function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      setError("Unable to load notifications");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchNotifications(); }, [token]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { alert("Failed to mark all as read"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      const item = notifications.find(n => n._id === id);
      if (item && !item.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { alert("Failed to delete notification"); }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    switch (notif.type) {
      case "PROJECT_INVITATION": navigate("/invitations"); break;
      case "INVITATION_ACCEPTED":
      case "INVITATION_REJECTED":
      case "PROJECT_MEMBER_REMOVED": {
        const pId = notif.relatedProject?._id || notif.relatedProject;
        navigate(pId ? `/projects/${pId}` : "/projects"); break;
      }
      case "DISCUSSION_COMMENT": {
        const dId = notif.relatedDiscussion?._id || notif.relatedDiscussion;
        navigate(dId ? `/discussions/${dId}` : "/discussions"); break;
      }
    }
  };

  if (loading) return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4rem 0" }}>
        <div style={{ width: "44px", height: "44px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading notifications...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  if (error) return (
    <Shell>
      <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--error)", marginBottom: "12px" }}>{error}</p>
        <button onClick={fetchNotifications} style={{ padding: "8px 20px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font)", fontWeight: "700" }}>Retry</button>
      </div>
    </Shell>
  );

  return (
    <Shell>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "2rem" }}>
        <div>
          <h1 style={{
            margin: "0 0 8px", fontSize: "2rem", fontWeight: "800",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{
              width: "42px", height: "42px", borderRadius: "11px",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 6px 20px rgba(245,158,11,0.35)",
            }}>🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                fontSize: "0.7rem", fontWeight: "800",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff", padding: "3px 9px", borderRadius: "20px",
                boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
              }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Stay updated with your projects, team invitations, and discussions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead} disabled={actionLoading}
            style={{
              padding: "10px 20px",
              background: "var(--surface)", color: "var(--text-primary)",
              border: "1px solid var(--border)", borderRadius: "10px",
              fontWeight: "600", fontSize: "0.875rem",
              cursor: actionLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font)", transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-border)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            {actionLoading ? "Updating..." : "✓ Mark All as Read"}
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "18px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
          <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)", fontSize: "1.2rem" }}>You're all caught up!</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
            New invites, comments, and project updates will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.map((item, i) => {
            const tc = TYPE_CONFIG[item.type] || { label: "Notice", icon: "📌", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" };
            const isHovered = hoveredId === item._id;
            const initials = (item.sender?.name || "U")[0].toUpperCase();
            const gradient = GRADIENTS[i % GRADIENTS.length];

            return (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                onMouseEnter={() => setHoveredId(item._id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: "16px",
                  padding: "1.1rem 1.35rem",
                  background: item.isRead ? "var(--surface)" : "rgba(99,102,241,0.06)",
                  borderRadius: "14px",
                  border: `1px solid ${isHovered ? "var(--primary-border)" : item.isRead ? "var(--border)" : "rgba(99,102,241,0.25)"}`,
                  boxShadow: isHovered ? "var(--shadow-lg)" : "var(--shadow)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: item.sender?.profileImage ? "#000" : gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: "800", color: "#fff",
                  flexShrink: 0, overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}>
                  {item.sender?.profileImage
                    ? <img src={item.sender.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    : initials}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: "700",
                      padding: "3px 9px", borderRadius: "20px",
                      color: tc.color, background: tc.bg,
                      border: `1px solid ${tc.border}`,
                    }}>
                      {tc.icon} {tc.label}
                    </span>
                    <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>{item.title}</span>
                    {!item.isRead && (
                      <span style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "var(--primary)", display: "inline-block",
                        boxShadow: "0 0 8px rgba(99,102,241,0.6)",
                      }} />
                    )}
                  </div>

                  <p style={{ margin: "0 0 6px", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    {item.message}
                  </p>

                  <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>From: <strong style={{ color: "var(--text-secondary)" }}>{item.sender?.name || "DevCollab"}</strong></span>
                    <span>·</span>
                    <span>{timeAgo(item.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(item._id, e)}
                      style={{
                        fontSize: "0.75rem", padding: "4px 10px",
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "6px", cursor: "pointer",
                        color: "var(--text-secondary)", fontFamily: "var(--font)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    style={{
                      fontSize: "0.75rem", padding: "4px 10px",
                      background: "var(--error-bg)", border: "1px solid var(--error-border)",
                      color: "var(--error)", borderRadius: "6px",
                      cursor: "pointer", fontFamily: "var(--font)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}

export default Notifications;
