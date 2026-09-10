import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, token, logout, user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Avatar helper
  const profileImage = userProfile?.profileImage || user?.profileImage || "";
  const displayName = userProfile?.name || user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fetchNotificationStats = async () => {
    if (!token) return;
    try {
      const response = await api.get("/api/notifications?limit=5");
      setRecentNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotificationStats();
      const interval = setInterval(fetchNotificationStats, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setRecentNotifications([]);
    }
  }, [isAuthenticated, token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const handleNotificationClick = async (notif) => {
    setNotifOpen(false);
    if (!notif.isRead) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch { /* silent */ }
    }
    switch (notif.type) {
      case "PROJECT_INVITATION":
        navigate("/invitations");
        break;
      case "INVITATION_ACCEPTED":
      case "INVITATION_REJECTED":
      case "PROJECT_MEMBER_REMOVED":
        navigate(
          notif.relatedProject?._id || notif.relatedProject
            ? `/projects/${notif.relatedProject._id || notif.relatedProject}`
            : "/projects"
        );
        break;
      case "DISCUSSION_COMMENT":
        navigate(
          notif.relatedDiscussion?._id || notif.relatedDiscussion
            ? `/discussions/${notif.relatedDiscussion._id || notif.relatedDiscussion}`
            : "/discussions"
        );
        break;
      default:
        navigate("/notifications");
    }
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/developers", label: "Developers" },
    { to: "/discussions", label: "Discussions" },
    { to: "/invitations", label: "Invitations" },
  ];

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}>

        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <div style={{
            width: "30px", height: "30px",
            background: "#2563eb",
            borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "700", fontSize: "14px",
          }}>
            DC
          </div>
          <span style={{
            fontWeight: "700",
            fontSize: "1.05rem",
            color: "#0f172a",
            letterSpacing: "-0.3px",
          }}>
            DevCollab
          </span>
        </Link>

        {/* Desktop Nav Links */}
        {isAuthenticated && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            flex: 1,
            justifyContent: "center",
          }}
            className="desktop-nav"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#475569",
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f1f5f9";
                  e.target.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#475569";
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setNotifOpen((prev) => !prev);
                    setUserMenuOpen(false);
                    if (!notifOpen) fetchNotificationStats();
                  }}
                  style={{
                    position: "relative",
                    width: "36px", height: "36px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "background 0.15s",
                  }}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-4px", right: "-4px",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "9999px",
                      fontSize: "10px",
                      fontWeight: "700",
                      minWidth: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      border: "2px solid #fff",
                    }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div style={{
                    position: "absolute",
                    right: 0, top: "calc(100% + 8px)",
                    width: "340px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 200,
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                    }}>
                      <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#0f172a" }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: "#eff6ff", color: "#2563eb",
                          fontSize: "0.75rem", fontWeight: "600",
                          padding: "2px 8px", borderRadius: "9999px",
                        }}>
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{
                          padding: "28px 16px",
                          textAlign: "center",
                          color: "#94a3b8",
                          fontSize: "0.875rem",
                        }}>
                          No notifications yet
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                              padding: "10px 16px",
                              borderBottom: "1px solid #f8fafc",
                              cursor: "pointer",
                              background: notif.isRead ? "#fff" : "#eff6ff",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? "#fff" : "#eff6ff"}
                          >
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "2px",
                            }}>
                              <span style={{
                                fontSize: "0.85rem",
                                fontWeight: notif.isRead ? "500" : "600",
                                color: "#0f172a",
                              }}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span style={{
                                  width: "7px", height: "7px",
                                  borderRadius: "50%",
                                  background: "#2563eb",
                                  flexShrink: 0,
                                  marginTop: "4px",
                                }} />
                              )}
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{
                      padding: "10px 16px",
                      borderTop: "1px solid #f1f5f9",
                      textAlign: "center",
                    }}>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        style={{
                          fontSize: "0.85rem",
                          color: "#2563eb",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        View All →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div ref={userMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setNotifOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 8px 4px 4px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "9999px",
                    background: "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: "28px", height: "28px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "700", color: "#2563eb",
                    flexShrink: 0,
                  }}>
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : initials}
                  </div>
                  <span style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#0f172a",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {displayName.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>▼</span>
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: "absolute",
                    right: 0, top: "calc(100% + 8px)",
                    width: "180px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    zIndex: 200,
                  }}>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 14px",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        textDecoration: "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      👤 My Profile
                    </Link>
                    <div style={{ borderTop: "1px solid #f1f5f9" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.875rem",
                        color: "#ef4444",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#fef2f2"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="hamburger-btn"
                aria-label="Toggle menu"
                style={{
                  display: "none",
                  width: "36px", height: "36px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                to="/login"
                style={{
                  padding: "7px 14px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#475569",
                  textDecoration: "none",
                  borderRadius: "7px",
                  border: "1px solid #e2e8f0",
                  transition: "background 0.15s",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "7px 14px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "7px",
                  background: "#2563eb",
                  transition: "background 0.15s",
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && mobileOpen && (
        <div style={{
          borderTop: "1px solid #f1f5f9",
          background: "#fff",
          padding: "8px 16px 16px",
        }}
          className="mobile-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "10px 12px",
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#0f172a",
                textDecoration: "none",
                borderRadius: "7px",
                transition: "background 0.1s",
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid #f1f5f9", margin: "8px 0" }} />
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block",
              padding: "10px 12px",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0f172a",
              textDecoration: "none",
              borderRadius: "7px",
            }}
          >
            My Profile
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#ef4444",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: "7px",
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;