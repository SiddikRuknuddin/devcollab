import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DirectMessageModal from "../components/DirectMessageModal";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
];

const Shell = ({ children }) => (
  <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem 4rem" }}>
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>{children}</div>
  </div>
);

const BackLink = () => (
  <Link to="/developers" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem", marginBottom: "20px", transition: "color 0.2s" }}
    onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
  >← Back to Developers</Link>
);

function DeveloperProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDM, setShowDM] = useState(false);
  const [endorsingSkill, setEndorsingSkill] = useState(null);

  useEffect(() => {
    if (!token || !id) return;
    const fetchDev = async () => {
      try {
        const res = await api.get(`/api/users/developers/${id}`);
        setDeveloper(res.data.developer);
      } catch (err) {
        setError(err.response?.status === 404 ? "Developer not found" : err.response?.data?.message || "Unable to load developer profile");
      } finally { setLoading(false); }
    };
    fetchDev();
  }, [token, id]);

  const handleEndorse = async (skill) => {
    try {
      setEndorsingSkill(skill);
      const res = await api.post(`/api/users/${id}/endorse`, { skill });
      setDeveloper((prev) => ({
        ...prev,
        endorsements: res.data.endorsements,
        badges: res.data.badges || prev.badges,
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to endorse skill");
    } finally {
      setEndorsingSkill(null);
    }
  };

  if (loading) return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4rem 0" }}>
        <div style={{ width: "44px", height: "44px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading developer profile...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  if (error || !developer) return (
    <Shell>
      <BackLink />
      <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", padding: "1.5rem", color: "var(--error)" }}>
        {error || "Developer not found."}
      </div>
    </Shell>
  );

  const initials = developer.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const endorsements = developer.endorsements || [];
  const badges = developer.badges || [];
  const isMe = user?._id === developer._id;

  return (
    <Shell>
      <BackLink />

      {/* Main Profile Card */}
      <div style={{
        background: "var(--surface)", borderRadius: "20px",
        border: "1px solid var(--border)", padding: "2rem 2.25rem",
        boxShadow: "var(--shadow)", marginBottom: "20px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "4px",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
        }} />

        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <div style={{
            width: "88px", height: "88px", borderRadius: "20px",
            background: GRADIENTS[0],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: "800", color: "#fff",
            flexShrink: 0, overflow: "hidden",
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}>
            {developer.profileImage
              ? <img src={developer.profileImage} alt={developer.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>

          <div style={{ flex: "1 1 260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h1 style={{ margin: "0 0 4px", fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
                  {developer.name}
                </h1>
                <p style={{ margin: "0 0 8px", color: "var(--primary)", fontWeight: "600", fontSize: "0.95rem" }}>
                  {developer.title || "Full-stack Developer"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href={`/portfolio/${developer._id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "8px 16px",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🌐</span> Portfolio ↗
                </a>

                {!isMe && (
                  <button
                    onClick={() => setShowDM(true)}
                    style={{
                      padding: "9px 18px",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                    }}
                  >
                    <span>💬</span> Direct Message
                  </button>
                )}
              </div>
            </div>


            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {developer.email && <span>✉️ {developer.email}</span>}
              {developer.location && <span>📍 {developer.location}</span>}
            </div>

            {developer.bio && (
              <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.92rem" }}>
                {developer.bio}
              </p>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(developer.github || developer.linkedin || developer.portfolio) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
            {developer.github && (
              <a href={developer.github.startsWith("http") ? developer.github : `https://${developer.github}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.82rem", fontWeight: "700" }}>
                🐙 GitHub
              </a>
            )}
            {developer.linkedin && (
              <a href={developer.linkedin.startsWith("http") ? developer.linkedin : `https://${developer.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.82rem", fontWeight: "700" }}>
                💼 LinkedIn
              </a>
            )}
            {developer.portfolio && (
              <a href={developer.portfolio.startsWith("http") ? developer.portfolio : `https://${developer.portfolio}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", textDecoration: "none", fontSize: "0.82rem", fontWeight: "700" }}>
                🚀 Portfolio
              </a>
            )}
          </div>
        )}
      </div>

      {/* Gamification Badges (Feature 6) */}
      {badges.length > 0 && (
        <div style={{
          background: "var(--surface)", borderRadius: "18px",
          border: "1px solid var(--border)", padding: "1.5rem 1.75rem",
          boxShadow: "var(--shadow)", marginBottom: "20px",
        }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            🏆 Earned Badges & Recognition
          </h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {badges.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 14px", borderRadius: "12px",
                  background: "rgba(99,102,241,0.1)", border: "1px solid var(--primary-border)",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{b.icon || "🏆"}</span>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)" }}>{b.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Endorsements (Feature 6) */}
      <div style={{ background: "var(--surface)", borderRadius: "18px", border: "1px solid var(--border)", padding: "1.5rem 2rem", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            🛠️ Skills & Peer Endorsements
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {endorsements.length} total endorsements received
          </span>
        </div>

        {developer.skills?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {developer.skills.map((skill, i) => {
              const skillEndorsements = endorsements.filter(
                (e) => e.skill.toLowerCase() === skill.toLowerCase()
              );
              const isEndorsedByMe = skillEndorsements.some(
                (e) => e.endorsedBy === user?._id || e.endorsedBy?._id === user?._id
              );

              return (
                <div
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: isEndorsedByMe ? "rgba(99,102,241,0.15)" : "var(--surface-2)",
                    border: `1px solid ${isEndorsedByMe ? "var(--primary-border)" : "var(--border)"}`,
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{skill}</span>

                  {skillEndorsements.length > 0 && (
                    <span style={{
                      background: isEndorsedByMe ? "var(--primary)" : "var(--surface)",
                      color: isEndorsedByMe ? "#fff" : "var(--text-muted)",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                    }}>
                      {skillEndorsements.length}
                    </span>
                  )}

                  {!isMe && (
                    <button
                      onClick={() => handleEndorse(skill)}
                      disabled={endorsingSkill === skill}
                      title={isEndorsedByMe ? "Remove endorsement" : "Endorse this skill"}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: isEndorsedByMe ? "var(--primary)" : "var(--text-muted)",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        padding: 0,
                      }}
                    >
                      {isEndorsedByMe ? "✓" : "+1"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>No skills listed.</p>
        )}
      </div>

      {/* Experience & Education */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {[
          { icon: "💼", title: "Experience", key: "experience" },
          { icon: "🎓", title: "Education", key: "education" },
        ].map(({ icon, title, key }) => (
          <div key={key} style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem", boxShadow: "var(--shadow)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              {icon} {title}
            </h3>
            <p style={{ margin: 0, color: developer[key] ? "var(--text-secondary)" : "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {developer[key] || `No ${title.toLowerCase()} details listed.`}
            </p>
          </div>
        ))}
      </div>

      {/* Certifications */}
      {developer.certifications?.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem 2rem", boxShadow: "var(--shadow)", marginTop: "20px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            📜 Verified Certifications ({developer.certifications.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {developer.certifications.map((cert, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--surface-2)", borderRadius: "12px", border: "1px solid var(--border)", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text-primary)", fontSize: "0.92rem" }}>{cert.name}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{cert.issuer} {cert.completed && `• Completed ${cert.completed}`}</p>
                </div>
                {cert.certificateUrl && (
                  <a href={cert.certificateUrl.startsWith("http") ? cert.certificateUrl : `${API_BASE_URL}${cert.certificateUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "0.82rem", fontWeight: "700" }}>
                    View Certificate ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Message Modal */}
      {showDM && (
        <DirectMessageModal
          targetUser={developer}
          onClose={() => setShowDM(false)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}

export default DeveloperProfile;