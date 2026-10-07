import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API_BASE_URL } from "../services/api";

const getFullUrl = (url) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function PublicPortfolio() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/portfolio/${id}`);
        if (res.data?.success) {
          setPortfolio(res.data.portfolio);
        } else {
          setError("Developer portfolio not found");
        }
      } catch (err) {
        console.error("Fetch portfolio error:", err);
        setError(err.response?.data?.message || "Failed to load developer portfolio");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPortfolio();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactModalOpen(false);
      setContactForm({ name: "", email: "", message: "" });
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--border)",
            borderTop: "3px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p>Loading Developer Portfolio...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Portfolio Not Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
            {error || "The developer portfolio you are looking for does not exist or has been removed."}
          </p>
          <Link
            to="/explore"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#6366f1",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Browse Other Developers
          </Link>
        </div>
      </div>
    );
  }

  const { user, projects = [], stats = {} } = portfolio;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <nav style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
            <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "var(--text-primary)" }}>
              Dev<span style={{ color: "#6366f1" }}>Collab</span>
            </span>
            <span style={{
              fontSize: "0.75rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "700"
            }}>
              Verified Portfolio
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleCopyLink}
              style={{
                padding: "7px 14px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{copied ? "✓ Copied!" : "🔗 Share"}</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "7px 14px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>📄 Export PDF</span>
            </button>
            <button
              onClick={() => setContactModalOpen(true)}
              style={{
                padding: "7px 16px",
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
              ✉️ Contact / Hire
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Hero Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}>
          {/* Subtle gradient banner top */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #6366f1, #ec4899, #10b981)"
          }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            flexWrap: "wrap"
          }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: user.profileImage ? `url(${user.profileImage}) center/cover` : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.4rem",
                fontWeight: "800",
                color: "#fff",
                border: "4px solid var(--surface)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
              }}>
                {!user.profileImage && (user.name?.[0]?.toUpperCase() || "D")}
              </div>
              <div style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#10b981",
                border: "3px solid var(--surface)"
              }} title="Active Developer" />
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h1 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
                  {user.name}
                </h1>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: "700"
                }}>
                  ✓ Open to Collaboration
                </span>
              </div>

              <p style={{ margin: "0 0 12px 0", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: "680px" }}>
                {user.bio || "Full-stack developer building robust, modern software solutions on DevCollab."}
              </p>

              {/* Meta items */}
              <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {user.location && (
                  <span>📍 {user.location}</span>
                )}
                <span>📅 Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                {user.email && (
                  <span>✉️ {user.email}</span>
                )}
              </div>

              {/* Social Links */}
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                {user.github && (
                  <a
                    href={user.github.startsWith("http") ? user.github : `https://${user.github}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>🐙 GitHub</span>
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={user.linkedin.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>💼 LinkedIn</span>
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>🌐 Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "28px"
        }}>
          <div style={{
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#6366f1" }}>
              {stats.totalProjects}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Projects Shipped
            </div>
          </div>

          <div style={{
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#10b981" }}>
              {stats.totalEndorsements}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Peer Endorsements
            </div>
          </div>

          <div style={{
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#f59e0b" }}>
              {stats.totalBadges}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Earned Badges
            </div>
          </div>

          <div style={{
            background: "var(--surface)",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ec4899" }}>
              {stats.totalCertificates || (user.certifications || user.certificates || []).length}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Verified Certificates
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {user.badges && user.badges.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🏆</span> Earned Developer Badges
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {user.badges.map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 18px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                  }}
                >
                  <span style={{ fontSize: "22px" }}>{badge.icon}</span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {badge.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Endorsements */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "28px"
        }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span> Endorsed Skills & Core Competencies
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {(user.skills || []).map((skill, idx) => {
              const count = (user.endorsements || []).filter(
                (e) => e.skill?.toLowerCase() === skill.toLowerCase()
              ).length;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: count > 0 ? "rgba(99, 102, 241, 0.12)" : "var(--surface-2)",
                    border: count > 0 ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{ fontWeight: "600", fontSize: "0.85rem", color: count > 0 ? "#818cf8" : "var(--text-primary)" }}>
                    {skill}
                  </span>
                  {count > 0 && (
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "12px",
                      background: "#6366f1",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: "700"
                    }}>
                      ⭐ {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Projects Showcase */}
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🚀</span> Shipped & Active Projects ({projects.length})
          </h3>

          {projects.length === 0 ? (
            <div style={{
              padding: "32px",
              background: "var(--surface)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              textAlign: "center",
              color: "var(--text-muted)"
            }}>
              No public projects published yet.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px"
            }}>
              {projects.map((proj) => {
                const totalMilestones = proj.milestones?.length || 0;
                const completedMilestones = proj.milestones?.filter((m) => m.isCompleted)?.length || 0;
                const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

                return (
                  <div
                    key={proj._id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "16px",
                      padding: "22px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                      transition: "transform 0.2s ease, border-color 0.2s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
                          {proj.title}
                        </h4>
                        <span style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: proj.status === "Completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          color: proj.status === "Completed" ? "#34d399" : "#818cf8",
                          fontWeight: "700"
                        }}>
                          {proj.status}
                        </span>
                      </div>

                      <p style={{
                        margin: "0 0 12px 0",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {proj.description}
                      </p>

                      {/* Tech stack */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {(proj.technologies || []).slice(0, 4).map((tech, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              fontSize: "0.75rem",
                              color: "var(--text-primary)"
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Milestone roadmap progress */}
                      {totalMilestones > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                            <span>Roadmap Progress</span>
                            <span>{completedMilestones}/{totalMilestones} ({progress}%)</span>
                          </div>
                          <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "6px", overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", background: "#10b981", borderRadius: "6px" }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                      <Link
                        to={`/projects/${proj._id}`}
                        style={{
                          fontSize: "0.82rem",
                          color: "#818cf8",
                          textDecoration: "none",
                          fontWeight: "600"
                        }}
                      >
                        View Project Overview →
                      </Link>

                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                            textDecoration: "none"
                          }}
                        >
                          🐙 Repo
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verified Certifications Gallery */}
        {((user.certifications && user.certifications.length > 0) || (user.certificates && user.certificates.length > 0)) && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "24px"
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📜</span> Verified Certifications & Credentials
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px"
            }}>
              {(user.certifications || user.certificates || []).map((cert, idx) => {
                const certTitle = cert.name || cert.title;
                const certUrl = cert.certificateUrl || cert.credentialUrl;
                const dateStr = cert.completed || (cert.issueDate ? new Date(cert.issueDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "");
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "16px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <h5 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {certTitle}
                      </h5>
                      {cert.issuer && (
                        <div style={{ fontSize: "0.82rem", color: "#818cf8", fontWeight: "600" }}>
                          {cert.issuer}
                        </div>
                      )}
                      {dateStr && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Completed / Issued: {dateStr}
                        </div>
                      )}
                      {cert.credentialId && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          ID: <code>{cert.credentialId}</code>
                        </div>
                      )}
                    </div>

                    {certUrl && (
                      <a
                        href={getFullUrl(certUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "8px",
                          fontSize: "0.8rem",
                          color: "#34d399",
                          textDecoration: "none",
                          fontWeight: "600"
                        }}
                      >
                        Verify / View Credential ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Recruiter / Contact Modal */}
      {contactModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
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
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>
                Contact {user.name}
              </h3>
              <button
                onClick={() => setContactModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.2rem",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {contactSent ? (
              <div style={{
                padding: "24px",
                textAlign: "center",
                color: "#34d399"
              }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
                <h4>Message Sent!</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Your inquiry has been relayed to {user.name}. They will reach out to you via your provided email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Jane Doe (Tech Recruiter)"
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
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="jane@company.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Project Proposal or Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your role, opportunity, or collaboration idea..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Send Inquiry 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Print / PDF Styling */}
      <style>{`
        @media print {
          nav, button, .no-print {
            display: none !important;
          }
          body, main {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
          }
          * {
            box-shadow: none !important;
            border-color: #cccccc !important;
          }
        }
      `}</style>
    </div>
  );
}
