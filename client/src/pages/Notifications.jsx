import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/api/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error(
        "Notifications Fetch Error:",
        err.response?.data || err.message
      );
      setError("Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark Read Error:", err.response?.data || err.message);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await api.put("/api/notifications/read-all");

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark All Read Error:", err.response?.data || err.message);
      alert("Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);

      const deletedItem = notifications.find((n) => n._id === id);
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete Notification Error:", err.response?.data || err.message);
      alert("Failed to delete notification");
    }
  };

  // Click notification to navigate
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await api.put(`/api/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Auto Mark Read Error:", err);
      }
    }

    // Determine target route
    switch (notification.type) {
      case "PROJECT_INVITATION":
        navigate("/invitations");
        break;
      case "INVITATION_ACCEPTED":
      case "INVITATION_REJECTED":
      case "PROJECT_MEMBER_REMOVED":
        if (notification.relatedProject?._id || notification.relatedProject) {
          const pId =
            notification.relatedProject._id || notification.relatedProject;
          navigate(`/projects/${pId}`);
        } else {
          navigate("/projects");
        }
        break;
      case "DISCUSSION_COMMENT":
        if (
          notification.relatedDiscussion?._id ||
          notification.relatedDiscussion
        ) {
          const dId =
            notification.relatedDiscussion._id ||
            notification.relatedDiscussion;
          navigate(`/discussions/${dId}`);
        } else {
          navigate("/discussions");
        }
        break;
      default:
        break;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "PROJECT_INVITATION":
        return { label: "Invitation", color: "#3b82f6", bg: "#eff6ff" };
      case "INVITATION_ACCEPTED":
        return { label: "Accepted", color: "#10b981", bg: "#ecfdf5" };
      case "INVITATION_REJECTED":
        return { label: "Declined", color: "#ef4444", bg: "#fef2f2" };
      case "PROJECT_MEMBER_REMOVED":
        return { label: "Team Update", color: "#f59e0b", bg: "#fffbeb" };
      case "DISCUSSION_COMMENT":
        return { label: "Comment", color: "#8b5cf6", bg: "#f5f3ff" };
      default:
        return { label: "Notice", color: "#6b7280", bg: "#f3f4f6" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={fetchNotifications}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem" }}>
            Notifications 🔔
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
            Stay updated with your projects, team invitations, and discussions.
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              cursor: actionLoading ? "not-allowed" : "pointer",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 500,
            }}
          >
            {actionLoading ? "Updating..." : "Mark All as Read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>📭</span>
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
            No notifications yet
          </h3>
          <p style={{ color: "#6b7280", margin: 0 }}>
            You're all caught up! New invites, comments, and project updates will
            appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  backgroundColor: item.isRead ? "#ffffff" : "#f0f7ff",
                  borderRadius: "8px",
                  border: item.isRead
                    ? "1px solid #e5e7eb"
                    : "1px solid #93c5fd",
                  boxShadow: item.isRead
                    ? "none"
                    : "0 1px 3px rgba(37,99,235,0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
                  {/* Sender Avatar / Icon */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {item.sender?.profileImage ? (
                      <img
                        src={item.sender.profileImage}
                        alt={item.sender?.name || "User"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      (item.sender?.name || "U")[0].toUpperCase()
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.25rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          color: badge.color,
                          backgroundColor: badge.bg,
                        }}
                      >
                        {badge.label}
                      </span>
                      <strong style={{ fontSize: "1rem", color: "#111827" }}>
                        {item.title}
                      </strong>
                      {!item.isRead && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                            display: "inline-block",
                          }}
                          title="Unread"
                        />
                      )}
                    </div>

                    <p
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#374151",
                        fontSize: "0.95rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        From:{" "}
                        <strong>
                          {item.sender?.name || "DevCollab User"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    alignItems: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(item._id, e)}
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.3rem 0.6rem",
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#374151",
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.6rem",
                      backgroundColor: "#fff",
                      border: "1px solid #fca5a5",
                      color: "#ef4444",
                      borderRadius: "4px",
                      cursor: "pointer",
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
    </div>
  );
}

export default Notifications;
