import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  Completed: { bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.3)", dot: "#10b981" },
  "In Progress": { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.3)", dot: "#6366f1" },
  Planning: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.3)", dot: "#f59e0b" },
};

const PageShell = ({ children }) => (
  <div style={{
    minHeight: "calc(100vh - 64px)",
    background: "var(--bg)",
    padding: "2rem 1.25rem 4rem",
  }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </div>
);

function Projects() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/projects/my");
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Projects Error:", err.response?.data || err.message);
      setError("Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchProjects(); }, [token]);

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    setDeletingId(projectId);
    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.technologies?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, search, statusFilter]);

  if (loading) return (
    <PageShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "16px" }}>
        <div style={{
          width: "44px", height: "44px",
          border: "3px solid var(--border)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading your projects...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );

  if (error) return (
    <PageShell>
      <div style={{
        background: "var(--error-bg)", border: "1px solid var(--error-border)",
        borderRadius: "12px", padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
        <p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p>
        <button onClick={fetchProjects} style={{
          padding: "9px 20px", background: "var(--primary)", color: "#fff",
          border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontFamily: "var(--font)",
        }}>Retry</button>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem",
      }}>
        <div>
          <h1 style={{
            margin: "0 0 6px", fontSize: "2rem", fontWeight: "800",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{
              width: "42px", height: "42px", borderRadius: "11px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
            }}>💻</span>
            My Projects
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Manage and track your development projects
            {projects.length > 0 && <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>— {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}</span>}
          </p>
        </div>
        <Link to="/projects/create" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 20px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff", borderRadius: "10px", textDecoration: "none",
          fontWeight: "700", fontSize: "0.9rem",
          boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.35)"; }}
        >
          <span style={{ fontSize: "1.1rem" }}>+</span> New Project
        </Link>
      </div>

      {/* Search & Filter Bar (Only show if there are projects or active filter) */}
      {projects.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "12px",
          marginBottom: "1.75rem",
        }}>
          <div style={{
            display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
          }}>
            {/* Search Input */}
            <div style={{
              flex: 1, minWidth: "260px",
              background: "var(--surface)",
              border: `1px solid ${searchFocused ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "12px",
              padding: "4px 14px",
              display: "flex", alignItems: "center", gap: "10px",
              boxShadow: searchFocused ? "0 0 0 3px var(--primary-light)" : "var(--shadow)",
              transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: "16px", opacity: 0.5 }}>🔍</span>
              <input
                type="text"
                placeholder="Search projects by title, description, or tech (e.g. React)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  fontSize: "0.9rem",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font)",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "var(--surface-2)", border: "none",
                    borderRadius: "6px", padding: "4px 8px",
                    color: "var(--text-muted)", cursor: "pointer",
                    fontSize: "0.8rem", fontFamily: "var(--font)",
                  }}
                >✕ Clear</button>
              )}
            </div>

            {/* Status Tabs */}
            <div style={{
              display: "flex", gap: "6px", background: "var(--surface)",
              padding: "4px", borderRadius: "10px", border: "1px solid var(--border)",
            }}>
              {["All", "Planning", "In Progress", "Completed"].map((st) => {
                const isSelected = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "7px",
                      border: "none",
                      background: isSelected ? "var(--primary)" : "transparent",
                      color: isSelected ? "#fff" : "var(--text-secondary)",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no projects exist at all */}
      {projects.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "var(--surface)", borderRadius: "18px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "18px",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 20px",
          }}>📁</div>
          <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", color: "var(--text-primary)" }}>No projects yet</h3>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: "0.95rem" }}>
            Create your first project and start collaborating with developers worldwide.
          </p>
          <Link to="/projects/create" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "11px 24px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            fontWeight: "700", fontSize: "0.9rem",
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
          }}>
            Create Your First Project →
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* No Search Match State */
        <div style={{
          textAlign: "center", padding: "3.5rem 2rem",
          background: "var(--surface)", borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", color: "var(--text-primary)" }}>No matching projects</h3>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 20px", fontSize: "0.9rem" }}>
            No projects found matching "{search || statusFilter}". Try adjusting your search query or status filter.
          </p>
          <button
            onClick={() => { setSearch(""); setStatusFilter("All"); }}
            style={{
              padding: "9px 20px", background: "var(--surface-2)", color: "var(--primary)",
              border: "1px solid var(--primary-border)", borderRadius: "8px",
              cursor: "pointer", fontWeight: "600", fontFamily: "var(--font)",
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}>
          {filteredProjects.map((project) => {
            const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG["Planning"];
            const isHovered = hoveredCard === project._id;
            return (
              <div
                key={project._id}
                onMouseEnter={() => setHoveredCard(project._id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "var(--surface)",
                  borderRadius: "16px",
                  border: `1px solid ${isHovered ? "var(--primary-border)" : "var(--border)"}`,
                  boxShadow: isHovered ? "var(--shadow-lg), 0 0 0 1px var(--primary-border)" : "var(--shadow)",
                  display: "flex", flexDirection: "column",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Top accent bar */}
                <div style={{
                  height: "3px",
                  background: `linear-gradient(90deg, ${sc.dot}, transparent)`,
                }} />

                <div style={{ padding: "1.25rem 1.25rem 0" }}>
                  {/* Title + Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <h2 style={{
                      margin: 0, fontSize: "1.05rem", fontWeight: "700",
                      color: "var(--text-primary)", lineHeight: 1.3, flex: 1,
                    }}>
                      {project.title}
                    </h2>
                    <span style={{
                      fontSize: "0.72rem", padding: "3px 9px",
                      borderRadius: "20px", fontWeight: "700",
                      background: sc.bg, color: sc.color,
                      border: `1px solid ${sc.border}`,
                      whiteSpace: "nowrap", flexShrink: 0,
                      display: "flex", alignItems: "center", gap: "5px",
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: "0 0 12px", color: "var(--text-secondary)",
                    fontSize: "0.875rem", lineHeight: 1.55,
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {project.description || "No description provided."}
                  </p>

                  {/* Tech badges */}
                  {project.technologies?.length > 0 && (
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {project.technologies.slice(0, 4).map((tech, idx) => (
                        <span key={idx} style={{
                          fontSize: "0.72rem", fontWeight: "600",
                          background: "var(--surface-2)", color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          padding: "2px 8px", borderRadius: "6px",
                        }}>
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "2px 4px" }}>
                          +{project.technologies.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* GitHub link */}
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      fontSize: "0.8rem", color: "var(--primary)",
                      textDecoration: "none", marginBottom: "12px",
                      fontWeight: "600",
                    }}>
                      <span>🐙</span> GitHub Repository
                    </a>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{
                  display: "flex", gap: "6px", alignItems: "center",
                  borderTop: "1px solid var(--border)",
                  padding: "10px 1.25rem",
                  marginTop: "auto",
                  background: "var(--surface-2)",
                  flexWrap: "wrap",
                }}>
                  <Link to={`/projects/${project._id}`} style={{
                    fontSize: "0.82rem", color: "var(--primary)", fontWeight: "700",
                    textDecoration: "none", padding: "5px 10px",
                    background: "rgba(99,102,241,0.1)", borderRadius: "7px",
                    border: "1px solid var(--primary-border)",
                    transition: "all 0.15s",
                  }}>
                    View
                  </Link>
                  <Link to={`/projects/edit/${project._id}`} style={{
                    fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600",
                    textDecoration: "none", padding: "5px 10px",
                    background: "var(--surface)", borderRadius: "7px",
                    border: "1px solid var(--border)",
                  }}>
                    Edit
                  </Link>
                  <Link to={`/projects/${project._id}/members`} style={{
                    fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600",
                    textDecoration: "none", padding: "5px 10px",
                    background: "var(--surface)", borderRadius: "7px",
                    border: "1px solid var(--border)",
                  }}>
                    Members
                  </Link>
                  <button
                    onClick={() => handleDelete(project._id)}
                    disabled={deletingId === project._id}
                    style={{
                      fontSize: "0.82rem", color: "var(--error)", fontWeight: "600",
                      background: "none", border: "none", cursor: "pointer",
                      padding: "5px 8px", marginLeft: "auto",
                      opacity: deletingId === project._id ? 0.5 : 1,
                      fontFamily: "var(--font)",
                    }}
                  >
                    {deletingId === project._id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </PageShell>
  );
}

export default Projects;