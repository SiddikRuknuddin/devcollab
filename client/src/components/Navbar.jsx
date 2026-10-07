import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const { isAuthenticated, token, logout, user, userProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Scroll detection for shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Avatar helper
  const profileImage = userProfile?.profileImage || user?.profileImage || "";
  const displayName = userProfile?.name || user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DC";

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
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setUserMenuOpen(false);
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
    { to: "/dashboard", label: "Dashboard", icon: "⊞" },
    { to: "/projects", label: "Projects", icon: "📁" },
    { to: "/explore", label: "Explore", icon: "🌐" },
    { to: "/developers", label: "Developers", icon: "👥" },
    { to: "/discussions", label: "Discussions", icon: "💬" },
    { to: "/invitations", label: "Invitations", icon: "✉️" },
  ];

  // Styles based on dark/light
  const navBg = isDark
    ? scrolled ? "rgba(8, 12, 20, 0.97)" : "rgba(8, 12, 20, 0.85)"
    : scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.90)";

  const navBorder = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const navShadow = scrolled
    ? isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 2px 16px rgba(0,0,0,0.08)"
    : "none";

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: navBg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${navBorder}`,
      boxShadow: navShadow,
      transition: "background 0.3s ease, box-shadow 0.3s ease",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}>

        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.5)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" fill="#fff" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
            </svg>
          </div>
          <span style={{
            fontWeight: "800",
            fontSize: "1.15rem",
            color: isDark ? "#ffffff" : "#0f172a",
            letterSpacing: "-0.4px",
          }}>
            DevCollab
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        {isAuthenticated && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flex: 1,
            justifyContent: "center",
          }} className="desktop-nav">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to ||
                (link.to !== "/dashboard" && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? "600" : "500",
                    color: isActive
                      ? (isDark ? "#a5b4fc" : "#4f46e5")
                      : (isDark ? "#94a3b8" : "#475569"),
                    background: isActive
                      ? (isDark ? "rgba(99,102,241,0.15)" : "#eef2ff")
                      : "transparent",
                    border: isActive
                      ? `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`
                      : "1px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";
                      e.currentTarget.style.color = isDark ? "#f1f5f9" : "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = isDark ? "#94a3b8" : "#475569";
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Right Section ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
              color: isDark ? "#fbbf24" : "#6366f1",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isDark ? "🌙" : "☀️"}
          </button>

          {isAuthenticated ? (
            <>
              {/* ── Notification Bell ── */}
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
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                    background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "all 0.15s ease",
                  }}
                  title="Notifications"
                  aria-label="Notifications"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9";
                    e.currentTarget.style.borderColor = isDark ? "rgba(99,102,241,0.4)" : "#c7d2fe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#fff";
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-5px", right: "-5px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
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
                      border: `2px solid ${isDark ? "#080c14" : "#fff"}`,
                      boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div style={{
                    position: "absolute",
                    right: 0, top: "calc(100% + 10px)",
                    width: "360px",
                    background: isDark ? "#111827" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                    borderRadius: "14px",
                    boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" : "0 12px 32px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 200,
                    animation: "slideDown 0.15s ease",
                  }}>
                    {/* Header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
                    }}>
                      <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#f1f5f9" : "#0f172a" }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: isDark ? "rgba(99,102,241,0.2)" : "#eef2ff",
                          color: isDark ? "#a5b4fc" : "#4f46e5",
                          fontSize: "0.75rem", fontWeight: "700",
                          padding: "3px 10px", borderRadius: "9999px",
                          border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`,
                        }}>
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          color: isDark ? "#475569" : "#94a3b8",
                          fontSize: "0.875rem",
                        }}>
                          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔕</div>
                          No notifications yet
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                              padding: "12px 18px",
                              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#f8fafc"}`,
                              cursor: "pointer",
                              background: notif.isRead
                                ? "transparent"
                                : (isDark ? "rgba(99,102,241,0.08)" : "#eff6ff"),
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? "transparent" : (isDark ? "rgba(99,102,241,0.08)" : "#eff6ff")}
                          >
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "3px",
                            }}>
                              <span style={{
                                fontSize: "0.85rem",
                                fontWeight: notif.isRead ? "500" : "700",
                                color: isDark ? "#f1f5f9" : "#0f172a",
                                lineHeight: 1.4,
                                flex: 1,
                              }}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span style={{
                                  width: "7px", height: "7px",
                                  borderRadius: "50%",
                                  background: "#6366f1",
                                  flexShrink: 0,
                                  marginTop: "4px",
                                  marginLeft: "8px",
                                  boxShadow: "0 0 6px rgba(99,102,241,0.6)",
                                }} />
                              )}
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: isDark ? "#64748b" : "#64748b",
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

                    {/* Footer */}
                    <div style={{
                      padding: "12px 18px",
                      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
                      textAlign: "center",
                    }}>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        style={{
                          fontSize: "0.85rem",
                          color: isDark ? "#a5b4fc" : "#4f46e5",
                          fontWeight: "600",
                          textDecoration: "none",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => e.target.style.color = isDark ? "#818cf8" : "#3730a3"}
                        onMouseLeave={(e) => e.target.style.color = isDark ? "#a5b4fc" : "#4f46e5"}
                      >
                        View All Notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── User Menu ── */}
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
                    padding: "4px 10px 4px 4px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                    borderRadius: "9999px",
                    background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.09)" : "#f1f5f9";
                    e.currentTarget.style.borderColor = isDark ? "rgba(99,102,241,0.4)" : "#c7d2fe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fff";
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: "28px", height: "28px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "700", color: "#fff",
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(99,102,241,0.4)",
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
                    fontWeight: "600",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    maxWidth: "90px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {displayName.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "9px", color: isDark ? "#64748b" : "#94a3b8", marginRight: "2px" }}>▼</span>
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: "absolute",
                    right: 0, top: "calc(100% + 10px)",
                    width: "200px",
                    background: isDark ? "#111827" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                    borderRadius: "12px",
                    boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" : "0 12px 32px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 200,
                    animation: "slideDown 0.15s ease",
                  }}>
                    {/* User info header */}
                    <div style={{
                      padding: "14px 16px 10px",
                      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
                    }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: "700", color: isDark ? "#f1f5f9" : "#0f172a" }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
                        {user?.email || ""}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: isDark ? "#cbd5e1" : "#374151",
                        textDecoration: "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>👤</span> My Profile
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: isDark ? "#cbd5e1" : "#374151",
                        textDecoration: "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>⊞</span> Dashboard
                    </Link>

                    <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: "#f87171",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.1s",
                        fontFamily: "var(--font)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(248,113,113,0.1)" : "#fef2f2"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>🚪</span> Sign Out
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
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                  borderRadius: "8px",
                  background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                  color: isDark ? "#f1f5f9" : "#0f172a",
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
                  padding: "7px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: isDark ? "#94a3b8" : "#475569",
                  textDecoration: "none",
                  borderRadius: "8px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                  background: isDark ? "rgba(255,255,255,0.04)" : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";
                  e.currentTarget.style.color = isDark ? "#f1f5f9" : "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "transparent";
                  e.currentTarget.style.color = isDark ? "#94a3b8" : "#475569";
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "7px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.3)";
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
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
          background: isDark ? "#0d1117" : "#fff",
          padding: "8px 16px 16px",
          animation: "slideDown 0.2s ease",
        }} className="mobile-nav">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 12px",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? (isDark ? "#a5b4fc" : "#4f46e5") : (isDark ? "#cbd5e1" : "#374151"),
                  textDecoration: "none",
                  borderRadius: "8px",
                  background: isActive ? (isDark ? "rgba(99,102,241,0.12)" : "#eef2ff") : "transparent",
                  transition: "background 0.1s",
                  marginBottom: "2px",
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
          <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", margin: "8px 0" }} />
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "11px 12px",
              fontSize: "0.95rem", fontWeight: "500",
              color: isDark ? "#cbd5e1" : "#374151",
              textDecoration: "none", borderRadius: "8px",
              marginBottom: "2px",
            }}
          >
            <span>👤</span> My Profile
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "11px 12px",
              fontSize: "0.95rem", fontWeight: "500",
              color: "#f87171",
              background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left",
              borderRadius: "8px",
              fontFamily: "var(--font)",
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;