import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { token, user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interactive Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [inviteSentToast, setInviteSentToast] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("devcollab_theme") || "dark";
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem("devcollab_theme") || "dark");
    };
    window.addEventListener("devcollab_theme_change", handleThemeChange);
    return () => window.removeEventListener("devcollab_theme_change", handleThemeChange);
  }, []);

  const isDark = theme === "dark";

  // Fetch real data from the backend APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, myProjectsRes] = await Promise.all([
        api.get("/api/dashboard/stats"),
        api.get("/api/projects/my").catch(() => ({ data: { projects: [] } })),
      ]);

      setStats(statsRes.data.stats || {});
      setRecentActivity(statsRes.data.recentActivity || {});

      // Use real projects owned by the user
      const realProjects =
        myProjectsRes.data.projects && myProjectsRes.data.projects.length > 0
          ? myProjectsRes.data.projects
          : statsRes.data.recentActivity?.projects || [];

      setProjects(realProjects);
    } catch (err) {
      console.error("Dashboard Data Error:", err.response?.data || err.message);
      setError("Unable to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/register?ref=${user?._id || "devcollab"}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSentToast(`Invitation sent to ${inviteEmail} as ${inviteRole}! 🚀`);
    setInviteEmail("");
    setTimeout(() => {
      setInviteSentToast("");
      setShowInviteModal(false);
    }, 2500);
  };

  const displayName = userProfile?.name || user?.name || "Developer";

  // Real stats extracted directly from the database response
  const totalProjects = stats?.totalProjects ?? 0;
  const planningCount = stats?.planningProjects ?? 0;
  const inProgressCount = stats?.inProgressProjects ?? 0;
  const completedCount = stats?.completedProjects ?? 0;
  const teamMembersCount = stats?.totalProjectMembers ?? 0;
  const pendingInvitesCount = stats?.pendingInvitations ?? 0;

  // Real pending invitations from recent activity
  const realInvitations = recentActivity?.invitations || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#080c14" : "#f8fafc",
        backgroundImage: isDark
          ? "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)"
          : "radial-gradient(#e2e8f0 1px, transparent 1px)",
        backgroundSize: isDark ? "28px 28px, 100% 100%, 100% 100%" : "24px 24px",
        padding: "2rem 1.25rem 4rem",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: isDark ? "#f8fafc" : "#0f172a",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ========================================================
            HERO HEADER
        ======================================================== */}
        <div
          style={{
            background: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
            backdropFilter: "blur(16px)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "2rem 2.25rem",
            boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.4)" : "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.25rem",
            marginBottom: "2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-70px",
              right: "-70px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: isDark
                ? "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)"
                : "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div>
            <h1
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "2.1rem",
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Welcome back, {displayName}!{" "}
              <span style={{ display: "inline-block" }}>👋</span>
            </h1>
            <p
              style={{
                margin: 0,
                color: isDark ? "#94a3b8" : "#64748b",
                fontSize: "1.02rem",
                fontWeight: "400",
              }}
            >
              Collaborate, build, and connect with developers worldwide.
            </p>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              id="invite-button"
              onClick={() => setShowInviteModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #e2e8f0",
                borderRadius: "10px",
                color: isDark ? "#f8fafc" : "#1e293b",
                fontSize: "0.92rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(255, 255, 255, 0.12)" : "#f8fafc";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Invite</span>
            </button>

            <button
              id="new-project-button"
              onClick={() => navigate("/projects/create")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.92rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: isDark
                  ? "0 0 25px rgba(59, 130, 246, 0.5), 0 4px 14px rgba(79, 70, 229, 0.4)"
                  : "0 4px 14px rgba(79, 70, 229, 0.35)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 35px rgba(59, 130, 246, 0.7), 0 6px 18px rgba(79, 70, 229, 0.5)"
                  : "0 6px 18px rgba(79, 70, 229, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 25px rgba(59, 130, 246, 0.5), 0 4px 14px rgba(79, 70, 229, 0.4)"
                  : "0 4px 14px rgba(79, 70, 229, 0.35)";
              }}
            >
              <span style={{ fontSize: "1.2rem", fontWeight: "700", lineHeight: 1 }}>+</span>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            OVERVIEW & STATISTICS SECTION (Real Data)
        ======================================================== */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#818cf8" : "#4f46e5"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: isDark ? "#f8fafc" : "#0f172a",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              Overview & Statistics
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: isDark ? "#94a3b8" : "#64748b" }}>
              Loading statistics...
            </div>
          ) : error ? (
            <div style={{ padding: "1rem", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "10px", marginBottom: "1rem" }}>
              {error}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "1.1rem",
              }}
            >
              {/* 1. TOTAL PROJECTS */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #1d4ed8 0%, #1e3a8a 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(29, 78, 216, 0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    TOTAL PROJECTS
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#2563eb",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#2563eb", margin: "0.25rem 0" }}>
                    {totalProjects}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#93c5fd" : "#64748b" }}>
                    Created & managed by you
                  </div>
                </div>
              </div>

              {/* 2. PLANNING */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #b45309 0%, #78350f 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(180, 83, 9, 0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    PLANNING
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#fffbeb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#f59e0b",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="9" y1="18" x2="15" y2="18" />
                      <line x1="10" y1="22" x2="14" y2="22" />
                      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#f59e0b", margin: "0.25rem 0" }}>
                    {planningCount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#fde68a" : "#64748b" }}>
                    In planning stage
                  </div>
                </div>
              </div>

              {/* 3. IN PROGRESS */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #4338ca 0%, #312e81 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(67, 56, 202, 0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    IN PROGRESS
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#4f46e5",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#4f46e5", margin: "0.25rem 0" }}>
                    {inProgressCount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#c7d2fe" : "#64748b" }}>
                    Actively under development
                  </div>
                </div>
              </div>

              {/* 4. COMPLETED */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #059669 0%, #064e3b 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(5, 150, 105, 0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    COMPLETED
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#ecfdf5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#10b981",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#10b981", margin: "0.25rem 0" }}>
                    {completedCount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#a7f3d0" : "#64748b" }}>
                    Shipped & production-ready
                  </div>
                </div>
              </div>

              {/* 5. TEAM MEMBERS */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #7c3aed 0%, #4c1d95 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(124, 58, 237, 0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    TEAM MEMBERS
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#f3e8ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#8b5cf6",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#8b5cf6", margin: "0.25rem 0" }}>
                    {teamMembersCount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#ddd6fe" : "#64748b" }}>
                    Collaborators in your projects
                  </div>
                </div>
              </div>

              {/* 6. PENDING INVITES */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1.4rem 1.25rem",
                  background: isDark
                    ? "linear-gradient(160deg, #e11d48 0%, #881337 70%, #0f172a 100%)"
                    : "#ffffff",
                  border: isDark ? "1px solid rgba(225, 29, 72, 0.4)" : "1px solid #e2e8f0",
                  boxShadow: isDark ? "0 8px 24px rgba(225, 29, 72, 0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "155px",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.85)" : "#64748b", letterSpacing: "0.04em" }}>
                    PENDING INVITES
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#fff1f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#ffffff" : "#f43f5e",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "800", color: isDark ? "#ffffff" : "#f43f5e", margin: "0.25rem 0" }}>
                    {pendingInvitesCount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#fecdd3" : "#64748b" }}>
                    Invitations waiting for you
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            BOTTOM DUAL PANELS (100% Real Projects & Real Requests)
        ======================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* ────────────────────────────────────────────────────────
              LEFT PANEL: REAL "YOUR PROJECTS"
          ──────────────────────────────────────────────────────── */}
          <div
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
              backdropFilter: "blur(16px)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "1.5rem 1.75rem",
              boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                  Your Projects
                </h3>
                {projects.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#eff2fe",
                      color: isDark ? "#a5b4fc" : "#4f46e5",
                    }}
                  >
                    {projects.length}
                  </span>
                )}
              </div>
              <Link
                to="/projects"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: isDark ? "#818cf8" : "#4f46e5",
                  textDecoration: "none",
                }}
              >
                View all
              </Link>
            </div>

            {/* List of Real Projects */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", flex: 1 }}>
              {projects.length === 0 ? (
                <div
                  style={{
                    padding: "2.5rem 1rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem" }}>
                    No projects found yet.
                  </p>
                  <button
                    onClick={() => navigate("/projects/create")}
                    style={{
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    + Create Your First Project
                  </button>
                </div>
              ) : (
                projects.map((project) => {
                  const isCompleted = project.status === "Completed";
                  const isInProgress = project.status === "In Progress";

                  const badgeBg = isCompleted
                    ? (isDark ? "rgba(6, 78, 59, 0.6)" : "#ecfdf5")
                    : isInProgress
                    ? (isDark ? "rgba(30, 58, 138, 0.6)" : "#eff6ff")
                    : (isDark ? "rgba(120, 53, 15, 0.6)" : "#fffbeb");

                  const badgeColor = isCompleted
                    ? (isDark ? "#6ee7b7" : "#059669")
                    : isInProgress
                    ? (isDark ? "#93c5fd" : "#2563eb")
                    : (isDark ? "#fde68a" : "#d97706");

                  const badgeBorder = isCompleted
                    ? (isDark ? "rgba(16, 185, 129, 0.4)" : "#a7f3d0")
                    : isInProgress
                    ? (isDark ? "rgba(59, 130, 246, 0.4)" : "#bfdbfe")
                    : (isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a");

                  const statusText = isCompleted ? "Shipped" : (project.status || "Planning");

                  const techStack =
                    Array.isArray(project.technologies) && project.technologies.length > 0
                      ? project.technologies.join(" • ")
                      : project.description || "Developer Project";

                  return (
                    <div
                      key={project._id}
                      onClick={() => navigate(`/projects/${project._id}`)}
                      style={{
                        padding: "1.1rem 1.25rem",
                        borderRadius: "14px",
                        background: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "rgba(255, 255, 255, 0.07)" : "#f1f5f9";
                        e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1";
                        e.currentTarget.style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc";
                        e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.98rem", color: isDark ? "#ffffff" : "#0f172a" }}>
                            {project.title}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: isDark ? "#94a3b8" : "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {techStack}
                        </div>
                      </div>

                      {/* Real Status Pill Badge */}
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                          flexShrink: 0,
                        }}
                      >
                        {statusText}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              RIGHT PANEL: REAL "PENDING REQUESTS"
          ──────────────────────────────────────────────────────── */}
          <div
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
              backdropFilter: "blur(16px)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "1.5rem 1.75rem",
              boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                  Pending Requests
                </h3>
                {pendingInvitesCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: isDark ? "rgba(244, 63, 94, 0.2)" : "#ffe4e6",
                      color: isDark ? "#fda4af" : "#e11d48",
                    }}
                  >
                    {pendingInvitesCount}
                  </span>
                )}
              </div>
              <Link
                to="/invitations"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: isDark ? "#818cf8" : "#4f46e5",
                  textDecoration: "none",
                }}
              >
                Manage
              </Link>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {realInvitations.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {realInvitations.map((inv) => (
                    <div
                      key={inv._id}
                      style={{
                        padding: "0.9rem 1.1rem",
                        borderRadius: "12px",
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#fff" : "#0f172a" }}>
                          {inv.project?.title || "Project Invitation"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                          Status: {inv.status}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/invitations")}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state matching the user's screenshot */
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? "#94a3b8" : "#94a3b8",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontSize: "0.92rem",
                      fontWeight: "500",
                    }}
                  >
                    No invitations or join requests at the moment.
                  </p>
                  <Link
                    to="/invitations"
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      color: isDark ? "#818cf8" : "#4f46e5",
                      textDecoration: "none",
                    }}
                  >
                    Manage Requests →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          INVITATION MODAL (Interactive)
      ======================================================== */}
      {showInviteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderRadius: "20px",
              maxWidth: "480px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>
                Invite Developers to DevCollab
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: isDark ? "#94a3b8" : "#64748b",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#64748b" }}>
              Collaborate in real time with developers globally. Share your link or dispatch an instant invite.
            </p>

            {/* Quick Share Link */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: "600", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                Collaboration Invite Link
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register?ref=${user?._id || "devcollab"}`}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                    color: isDark ? "#f8fafc" : "#475569",
                  }}
                />
                <button
                  onClick={handleCopyInviteLink}
                  style={{
                    padding: "9px 16px",
                    backgroundColor: copiedLink ? "#10b981" : "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {copiedLink ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Form to Invite via Email */}
            <form onSubmit={handleSendInvite}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "600", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Developer Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="developer@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: "0.88rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "600", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  <option value="Developer">Developer (Full Access)</option>
                  <option value="Architect">Architect / Lead</option>
                  <option value="Reviewer">Reviewer (Read & Comment)</option>
                </select>
              </div>

              {inviteSentToast && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10b981",
                    color: "#34d399",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {inviteSentToast}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: isDark ? "#cbd5e1" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
                  }}
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;