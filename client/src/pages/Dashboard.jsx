import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/dashboard/stats");

      setStats(response.data.stats || {});
      setRecentActivity(response.data.recentActivity || {});
    } catch (err) {
      console.error(
        "Dashboard Stats Error:",
        err.response?.data || err.message
      );
      setError("Unable to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  // Status breakdown percentages
  const totalProjects = stats?.totalProjects || 0;
  const planningCount = stats?.planningProjects || 0;
  const inProgressCount = stats?.inProgressProjects || 0;
  const completedCount = stats?.completedProjects || 0;

  const planningPct = totalProjects
    ? Math.round((planningCount / totalProjects) * 100)
    : 0;
  const inProgressPct = totalProjects
    ? Math.round((inProgressCount / totalProjects) * 100)
    : 0;
  const completedPct = totalProjects
    ? Math.round((completedCount / totalProjects) * 100)
    : 0;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#111827" }}>
          Welcome to DevCollab 👋
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "1.05rem" }}>
          Collaborate, build, and connect with developers worldwide.
        </p>
      </div>

      {/* Analytics / Stats Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "#1f2937", marginBottom: "1rem" }}>
          📊 Overview & Statistics
        </h2>

        {loading ? (
          <p style={{ color: "#6b7280" }}>Loading statistics...</p>
        ) : error ? (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "8px",
              color: "#ef4444",
            }}
          >
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* Total Projects */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  TOTAL PROJECTS
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#2563eb",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.totalProjects ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Created & managed by you
                </div>
              </div>

              {/* Planning Projects */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  PLANNING
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#f59e0b",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.planningProjects ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  In planning stage
                </div>
              </div>

              {/* In Progress */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  IN PROGRESS
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#3b82f6",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.inProgressProjects ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Actively under development
                </div>
              </div>

              {/* Completed */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  COMPLETED
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#10b981",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.completedProjects ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Shipped projects
                </div>
              </div>

              {/* Team Members */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  TEAM MEMBERS
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#8b5cf6",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.totalProjectMembers ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Collaborators in your projects
                </div>
              </div>

              {/* Pending Invitations */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  PENDING INVITES
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#ec4899",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.pendingInvitations ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Invitations waiting for you
                </div>
              </div>

              {/* Discussions */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  DISCUSSIONS
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#06b6d4",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.totalDiscussions ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Topics started by you
                </div>
              </div>

              {/* Comments */}
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>
                  COMMENTS
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#6366f1",
                    margin: "0.25rem 0",
                  }}
                >
                  {stats?.totalComments ?? 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Community replies posted
                </div>
              </div>
            </div>

            {/* Project Status Visualization (CSS Progress Bar) */}
            {totalProjects > 0 && (
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Project Status Breakdown</span>
                  <span style={{ color: "#6b7280" }}>
                    {totalProjects} Total {totalProjects === 1 ? "Project" : "Projects"}
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div
                  style={{
                    height: "14px",
                    width: "100%",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "7px",
                    overflow: "hidden",
                    display: "flex",
                    marginBottom: "0.75rem",
                  }}
                >
                  {planningCount > 0 && (
                    <div
                      style={{
                        width: `${planningPct}%`,
                        backgroundColor: "#f59e0b",
                        transition: "width 0.3s ease",
                      }}
                      title={`Planning: ${planningCount} (${planningPct}%)`}
                    />
                  )}
                  {inProgressCount > 0 && (
                    <div
                      style={{
                        width: `${inProgressPct}%`,
                        backgroundColor: "#3b82f6",
                        transition: "width 0.3s ease",
                      }}
                      title={`In Progress: ${inProgressCount} (${inProgressPct}%)`}
                    />
                  )}
                  {completedCount > 0 && (
                    <div
                      style={{
                        width: `${completedPct}%`,
                        backgroundColor: "#10b981",
                        transition: "width 0.3s ease",
                      }}
                      title={`Completed: ${completedCount} (${completedPct}%)`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    fontSize: "0.85rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        backgroundColor: "#f59e0b",
                      }}
                    />
                    Planning ({planningCount} - {planningPct}%)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        backgroundColor: "#3b82f6",
                      }}
                    />
                    In Progress ({inProgressCount} - {inProgressPct}%)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        backgroundColor: "#10b981",
                      }}
                    />
                    Completed ({completedCount} - {completedPct}%)
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      {!loading && recentActivity && (
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "#1f2937", marginBottom: "1rem" }}>
            ⚡ Recent Activity
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Recent Projects */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>
                  📁 Recent Projects
                </h3>
                <Link
                  to="/projects"
                  style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
                >
                  View All →
                </Link>
              </div>

              {!recentActivity.projects || recentActivity.projects.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
                  No projects yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recentActivity.projects.map((p) => (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#111827", fontSize: "0.9rem" }}>
                        {p.title}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor:
                            p.status === "Completed"
                              ? "#ecfdf5"
                              : p.status === "In Progress"
                              ? "#eff6ff"
                              : "#fffbeb",
                          color:
                            p.status === "Completed"
                              ? "#059669"
                              : p.status === "In Progress"
                              ? "#2563eb"
                              : "#d97706",
                        }}
                      >
                        {p.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Discussions */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>
                  💬 Recent Discussions
                </h3>
                <Link
                  to="/discussions"
                  style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
                >
                  View All →
                </Link>
              </div>

              {!recentActivity.discussions || recentActivity.discussions.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
                  No discussions created yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recentActivity.discussions.map((d) => (
                    <Link
                      key={d._id}
                      to={`/discussions/${d._id}`}
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#111827",
                          fontSize: "0.9rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "180px",
                        }}
                      >
                        {d.title}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                        }}
                      >
                        {formatDate(d.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Invitations */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>
                  ✉️ Recent Invitations
                </h3>
                <Link
                  to="/invitations"
                  style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
                >
                  View All →
                </Link>
              </div>

              {!recentActivity.invitations || recentActivity.invitations.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
                  No invitations received.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recentActivity.invitations.map((inv) => (
                    <Link
                      key={inv._id}
                      to="/invitations"
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#111827", fontSize: "0.9rem" }}>
                        {inv.project?.title || "Project Invitation"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          backgroundColor:
                            inv.status === "Accepted"
                              ? "#ecfdf5"
                              : inv.status === "Pending"
                              ? "#fffbeb"
                              : "#fef2f2",
                          color:
                            inv.status === "Accepted"
                              ? "#059669"
                              : inv.status === "Pending"
                              ? "#d97706"
                              : "#dc2626",
                        }}
                      >
                        {inv.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Navigation Cards (Kept as required) */}
      <h2 style={{ fontSize: "1.25rem", color: "#1f2937", marginBottom: "1rem" }}>
        🚀 Quick Navigation
      </h2>
      <div
        className="dashboard-cards"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Profile */}
        <div
          className="dashboard-card"
          style={{
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>👤 Profile</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
            View and manage your developer profile.
          </p>
          <Link to="/profile" style={{ color: "#2563eb", fontWeight: 500 }}>
            View Profile →
          </Link>
        </div>

        {/* Projects */}
        <div
          className="dashboard-card"
          style={{
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>💻 Projects</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
            Create and manage your development projects.
          </p>
          <Link to="/projects" style={{ color: "#2563eb", fontWeight: 500 }}>
            View Projects →
          </Link>
        </div>

        {/* Collaborators */}
        <div
          className="dashboard-card"
          style={{
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>👥 Collaborators</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
            Find developers and collaborate on projects.
          </p>
          <Link to="/developers" style={{ color: "#2563eb", fontWeight: 500 }}>
            Find Developers →
          </Link>
        </div>

        {/* Discussions */}
        <div
          className="dashboard-card"
          style={{
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>💬 Discussions</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
            Share ideas and discuss development topics.
          </p>
          <Link to="/discussions" style={{ color: "#2563eb", fontWeight: 500 }}>
            View Discussions →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;