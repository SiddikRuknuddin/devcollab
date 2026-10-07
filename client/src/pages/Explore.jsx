import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Explore() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState("All");
  const [applyingProject, setApplyingProject] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", message: "" });

  const fetchExploreProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/projects/explore");
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Explore fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreProjects();
  }, []);

  const allTechnologies = useMemo(() => {
    const techSet = new Set();
    projects.forEach((p) => {
      (p.technologies || []).forEach((t) => techSet.add(t));
    });
    return ["All", ...Array.from(techSet).slice(0, 8)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesTech =
        selectedTech === "All" ||
        (p.technologies || []).some((t) => t.toLowerCase() === selectedTech.toLowerCase());
      if (!matchesTech) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, search, selectedTech]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyingProject) return;

    try {
      setSubmittingApp(true);
      setFeedback({ error: "", message: "" });
      const res = await api.post(`/api/projects/${applyingProject._id}/apply`, {
        message: applicationMessage.trim(),
      });
      setFeedback({ message: res.data.message || "Application submitted successfully!" });
      setApplyingProject(null);
      setApplicationMessage("");
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Failed to submit application" });
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "var(--bg)",
      padding: "2.5rem 1.25rem 4rem",
    }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* Banner Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
          borderRadius: "24px",
          border: "1px solid var(--border)",
          padding: "2.5rem 2rem",
          marginBottom: "2rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <span style={{
            display: "inline-block", padding: "4px 12px", borderRadius: "20px",
            background: "rgba(99,102,241,0.2)", color: "var(--primary)",
            fontSize: "0.8rem", fontWeight: "800", marginBottom: "12px",
          }}>
            🌐 Public Project Discovery & Bounties
          </span>
          <h1 style={{
            margin: "0 0 10px", fontSize: "2.4rem", fontWeight: "900",
            color: "var(--text-primary)", letterSpacing: "-0.03em",
          }}>
            Explore Open Collaboration Projects
          </h1>
          <p style={{
            margin: "0 auto", maxWidth: "600px", color: "var(--text-secondary)",
            fontSize: "1rem", lineHeight: 1.5,
          }}>
            Discover open-source initiatives and developer projects seeking contributors. Apply with 1-click and build your portfolio!
          </p>
        </div>

        {/* Global Feedback */}
        {feedback.message && (
          <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", color: "#34d399", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            ✓ {feedback.message}
          </div>
        )}
        {feedback.error && (
          <div style={{ padding: "12px 16px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", color: "var(--error)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            ⚠️ {feedback.error}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{
          display: "flex", flexDirection: "column", gap: "12px",
          marginBottom: "2rem",
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: "260px", background: "var(--surface)",
              borderRadius: "14px", border: "1px solid var(--border)",
              padding: "4px 14px", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: "var(--shadow)",
            }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search projects by title, description, or stack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "10px 0", border: "none", outline: "none",
                  background: "transparent", color: "var(--text-primary)", fontSize: "0.92rem",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tech pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              {allTechnologies.map((tech) => {
                const isSelected = selectedTech === tech;
                return (
                  <button
                    key={tech}
                    onClick={() => setSelectedTech(tech)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: isSelected ? "var(--primary)" : "var(--surface)",
                      color: isSelected ? "#fff" : "var(--text-secondary)",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading open projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{
            padding: "4rem 2rem", textAlign: "center", background: "var(--surface)",
            borderRadius: "20px", border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: "2.5rem", margin: "0 0 10px" }}>🔍</p>
            <h3 style={{ margin: "0 0 6px", color: "var(--text-primary)" }}>No projects found</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Try searching for different keywords or reset your technology filter.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}>
            {filteredProjects.map((p) => {
              const isMyProject = p.owner?._id === user?._id;
              return (
                <div
                  key={p._id}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "18px",
                    border: "1px solid var(--border)",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div>
                    {/* Status & Open Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem",
                        fontWeight: "800", background: "rgba(16,185,129,0.12)", color: "#34d399",
                        border: "1px solid rgba(16,185,129,0.3)",
                      }}>
                        ⚡ Open for Contributors
                      </span>

                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {p.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
                      {p.title}
                    </h3>

                    <p style={{
                      margin: "0 0 14px", color: "var(--text-secondary)", fontSize: "0.88rem",
                      lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {p.description}
                    </p>

                    {/* Tech Stack */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {(p.technologies || []).slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          style={{
                            padding: "3px 8px", borderRadius: "6px", background: "var(--surface-2)",
                            color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: "600",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "700", color: "#fff", fontSize: "0.75rem",
                      }}>
                        {p.owner?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {p.owner?.name}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        to={`/projects/${p._id}`}
                        style={{
                          padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)",
                          color: "var(--text-primary)", textDecoration: "none", fontSize: "0.8rem", fontWeight: "600",
                        }}
                      >
                        Details
                      </Link>

                      {!isMyProject && (
                        <button
                          onClick={() => setApplyingProject(p)}
                          style={{
                            padding: "6px 14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.8rem",
                            fontWeight: "700", cursor: "pointer",
                          }}
                        >
                          Apply to Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Apply Modal */}
        {applyingProject && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem",
          }}>
            <div style={{
              background: "var(--surface)", borderRadius: "20px", border: "1px solid var(--border)",
              maxWidth: "480px", width: "100%", padding: "1.75rem", boxShadow: "var(--shadow-lg)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
                  Apply to join "{applyingProject.title}"
                </h3>
                <button
                  onClick={() => setApplyingProject(null)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: "0 0 14px", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Introduce yourself to {applyingProject.owner?.name} and share why you'd be a great collaborator on this project.
              </p>

              <form onSubmit={handleApply} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Hi! I have 2 years of experience with React and Node.js. I'd love to help build the authentication and database layer..."
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    color: "var(--text-primary)", outline: "none", fontSize: "0.88rem",
                    boxSizing: "border-box",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setApplyingProject(null)}
                    style={{
                      padding: "8px 16px", background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: "8px", color: "var(--text-secondary)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApp || !applicationMessage.trim()}
                    style={{
                      padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {submittingApp ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
